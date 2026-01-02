#!/bin/bash

set -e

# ============================================
# Portfolio Release Script
# Builds locally, pushes to Docker Hub, deploys to DigitalOcean
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$SCRIPT_DIR/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================
# Load Environment Variables
# ============================================
load_env() {
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error ".env file not found at $ENV_FILE"
        log_info "Copy .env.example to .env and fill in your values:"
        log_info "  cp $SCRIPT_DIR/.env.example $ENV_FILE"
        exit 1
    fi

    set -a
    source "$ENV_FILE"
    set +a

    log_success "Loaded environment from $ENV_FILE"
}

# ============================================
# Validate Required Variables
# ============================================
validate_env() {
    local missing=()

    # Always required
    [[ -z "$CMS_ADMIN_PASSWORD" ]] && missing+=("CMS_ADMIN_PASSWORD")
    [[ -z "$JWT_SECRET_KEY" ]] && missing+=("JWT_SECRET_KEY")

    # For new droplet
    if [[ -z "$DROPLET_IP" ]]; then
        [[ -z "$DO_API_TOKEN" ]] && missing+=("DO_API_TOKEN")
        [[ -z "$DO_SSH_KEY_FINGERPRINT" ]] && missing+=("DO_SSH_KEY_FINGERPRINT")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for var in "${missing[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi

    log_success "Environment variables validated"
}

# ============================================
# Validate Docker Registry Variables
# ============================================
validate_registry() {
    if [[ -z "$DOCKER_USERNAME" ]]; then
        log_error "DOCKER_USERNAME not set in .env"
        log_info "Set your Docker Hub username and run: docker login"
        exit 1
    fi
    
    # Check if logged into Docker
    if ! docker info 2>/dev/null | grep -q "Username"; then
        log_warn "You may not be logged into Docker Hub"
        log_info "Run: docker login"
    fi
}

# ============================================
# Create New Droplet
# ============================================
create_droplet() {
    log_info "Creating new DigitalOcean droplet..."

    local droplet_name="${DROPLET_NAME:-portfolio}"
    local region="${DROPLET_REGION:-nyc1}"
    local size="${DROPLET_SIZE:-s-1vcpu-2gb}"
    local image="${DROPLET_IMAGE:-ubuntu-24-04-x64}"

    # Create droplet via API
    local response=$(curl -s -X POST "https://api.digitalocean.com/v2/droplets" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $DO_API_TOKEN" \
        -d "{
            \"name\": \"$droplet_name\",
            \"region\": \"$region\",
            \"size\": \"$size\",
            \"image\": \"$image\",
            \"ssh_keys\": [\"$DO_SSH_KEY_FINGERPRINT\"],
            \"backups\": false,
            \"ipv6\": false,
            \"monitoring\": true,
            \"tags\": [\"portfolio\", \"production\"]
        }")

    # Check for errors
    if echo "$response" | grep -q '"id"'; then
        local droplet_id=$(echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        log_success "Droplet created with ID: $droplet_id"
    else
        log_error "Failed to create droplet:"
        echo "$response" | head -20
        exit 1
    fi

    # Wait for droplet to be ready and get IP
    log_info "Waiting for droplet to be ready..."
    local max_attempts=60
    local attempt=0

    while [[ $attempt -lt $max_attempts ]]; do
        sleep 5
        attempt=$((attempt + 1))

        local status_response=$(curl -s -X GET "https://api.digitalocean.com/v2/droplets/$droplet_id" \
            -H "Authorization: Bearer $DO_API_TOKEN")

        local status=$(echo "$status_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        
        if [[ "$status" == "active" ]]; then
            DROPLET_IP=$(echo "$status_response" | grep -o '"ip_address":"[^"]*"' | head -1 | cut -d'"' -f4)
            log_success "Droplet is ready at IP: $DROPLET_IP"
            
            # Save IP to .env for future deployments
            if grep -q "^DROPLET_IP=" "$ENV_FILE"; then
                sed -i "s/^DROPLET_IP=.*/DROPLET_IP=$DROPLET_IP/" "$ENV_FILE"
            else
                echo "DROPLET_IP=$DROPLET_IP" >> "$ENV_FILE"
            fi
            
            return 0
        fi

        echo -n "."
    done

    log_error "Timeout waiting for droplet to be ready"
    exit 1
}

# ============================================
# Setup Server (first-time setup)
# ============================================
setup_server() {
    log_info "Setting up server at $DROPLET_IP..."

    # Wait for SSH to be available
    log_info "Waiting for SSH to be available..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$DROPLET_IP "echo 'SSH ready'" 2>/dev/null; then
            break
        fi
        sleep 5
        attempt=$((attempt + 1))
        echo -n "."
    done
    echo ""

    if [[ $attempt -ge $max_attempts ]]; then
        log_error "Could not connect to server via SSH"
        exit 1
    fi

    log_info "Installing Docker and dependencies..."
    
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << 'SETUP_SCRIPT'
        set -e
        
        # Update system
        apt-get update
        apt-get upgrade -y
        
        # Install Docker
        curl -fsSL https://get.docker.com | sh
        
        # Install Docker Compose plugin
        apt-get install -y docker-compose-plugin
        
        # Setup firewall
        ufw allow OpenSSH
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
        
        # Create app directory
        mkdir -p /opt/portfolio
        
        echo "Server setup complete!"
SETUP_SCRIPT

    log_success "Server setup complete"
}

# ============================================
# Build and Push Images Locally
# ============================================
build_and_push() {
    validate_registry
    
    local backend_image="${DOCKER_USERNAME}/${IMAGE_BACKEND:-portfolio-backend}"
    local frontend_image="${DOCKER_USERNAME}/${IMAGE_FRONTEND:-portfolio-frontend}"
    local tag="${1:-latest}"
    
    log_info "Building images locally..."
    
    # Build backend
    log_info "Building backend image: ${backend_image}:${tag}"
    docker build -t "${backend_image}:${tag}" -f "$PROJECT_ROOT/backend/dotnet/Dockerfile" "$PROJECT_ROOT/backend/dotnet"
    
    # Build frontend
    log_info "Building frontend image: ${frontend_image}:${tag}"
    docker build -t "${frontend_image}:${tag}" -f "$PROJECT_ROOT/frontend/portfolio-react/Dockerfile" "$PROJECT_ROOT/frontend/portfolio-react"
    
    log_success "Images built successfully"
    
    # Push to registry
    log_info "Pushing images to Docker Hub..."
    
    docker push "${backend_image}:${tag}"
    docker push "${frontend_image}:${tag}"
    
    log_success "Images pushed to Docker Hub"
    
    # Export for use in deploy
    export BACKEND_IMAGE="${backend_image}:${tag}"
    export FRONTEND_IMAGE="${frontend_image}:${tag}"
}

# ============================================
# Deploy to Server (using pre-built images)
# ============================================
deploy() {
    local tag="${1:-latest}"
    local backend_image="${DOCKER_USERNAME}/${IMAGE_BACKEND:-portfolio-backend}:${tag}"
    local frontend_image="${DOCKER_USERNAME}/${IMAGE_FRONTEND:-portfolio-frontend}:${tag}"
    local domain="${DOMAIN_NAME:-}"
    
    log_info "Deploying to $DROPLET_IP..."
    log_info "Using images:"
    log_info "  Backend:  $backend_image"
    log_info "  Frontend: $frontend_image"
    
    if [[ -n "$domain" ]]; then
        log_info "  Domain:   $domain (with Caddy/HTTPS)"
    else
        log_info "  Domain:   None (HTTP only via nginx)"
    fi

    # Create production docker-compose on server
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << DEPLOY_SCRIPT
        set -e
        
        mkdir -p /opt/portfolio
        cd /opt/portfolio
        
        # Create docker-compose.yml for production
        cat > docker-compose.yml << 'COMPOSE_EOF'
services:
  backend:
    image: ${backend_image}
    container_name: portfolio-backend
    volumes:
      - cms-data:/app/data
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ASPNETCORE_URLS=http://+:5000
      - CMS_DB_PATH=/app/data/cms.db
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    networks:
      - portfolio-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/graphql?query=%7B__typename%7D"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

  frontend:
    image: ${frontend_image}
    container_name: portfolio-frontend
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - portfolio-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

  caddy:
    image: caddy:2-alpine
    container_name: portfolio-caddy
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    environment:
      - DOMAIN_NAME=${domain}
    depends_on:
      - frontend
      - backend
    networks:
      - portfolio-network
    restart: unless-stopped

networks:
  portfolio-network:
    driver: bridge

volumes:
  cms-data:
    driver: local
  caddy-data:
    driver: local
  caddy-config:
    driver: local
COMPOSE_EOF

        # Create Caddyfile with domain directly embedded
        cat > Caddyfile << CADDY_EOF
${domain:-localhost} {
    # API and GraphQL routes to backend
    handle /graphql* {
        reverse_proxy backend:5000
    }

    handle /api/* {
        reverse_proxy backend:5000
    }

    handle /healthcheck {
        reverse_proxy backend:5000
    }

    # Everything else to frontend
    handle {
        reverse_proxy frontend:80
    }
}

www.${domain:-localhost} {
    redir https://${domain:-localhost}{uri} permanent
}
CADDY_EOF

        # Pull latest images
        echo "Pulling images..."
        docker compose pull
        
        # Start containers
        echo "Starting containers..."
        docker compose down --remove-orphans || true
        docker compose up -d
        
        # Wait for services
        echo "Waiting for services to start..."
        sleep 10
        
        # Check status
        docker compose ps
        
        echo ""
        echo "Deployment complete!"
DEPLOY_SCRIPT

    log_success "Deployment complete!"
    echo ""
    if [[ -n "$domain" ]]; then
        log_info "Your application is now running at:"
        echo "  https://$domain"
        echo "  https://$domain/admin"
        echo ""
        log_info "Make sure your DNS is configured:"
        echo "  $domain      -> A record -> $DROPLET_IP"
        echo "  www.$domain  -> A record -> $DROPLET_IP (or CNAME to $domain)"
    else
        log_info "Your application is now running at:"
        echo "  http://$DROPLET_IP"
        echo "  http://$DROPLET_IP/admin"
    fi
}

# ============================================
# Full Deploy (build locally + push + deploy)
# ============================================
full_deploy() {
    local tag="${1:-latest}"
    
    build_and_push "$tag"
    deploy "$tag"
}

# ============================================
# Quick Deploy (rebuild + push + restart)
# ============================================
quick_deploy() {
    local tag="${1:-latest}"
    
    build_and_push "$tag"
    
    log_info "Restarting containers on server..."
    
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << 'QUICK_SCRIPT'
        set -e
        cd /opt/portfolio
        docker compose pull
        docker compose up -d
        docker compose ps
QUICK_SCRIPT

    log_success "Quick deploy complete!"
}

# ============================================
# Show Status
# ============================================
show_status() {
    if [[ -z "$DROPLET_IP" ]]; then
        log_error "No DROPLET_IP configured"
        exit 1
    fi

    log_info "Checking status of $DROPLET_IP..."
    
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << 'STATUS_SCRIPT'
        cd /opt/portfolio
        echo ""
        echo "=== Container Status ==="
        docker compose ps
        echo ""
        echo "=== Recent Logs ==="
        docker compose logs --tail=20
STATUS_SCRIPT
}

# ============================================
# Show Logs
# ============================================
show_logs() {
    if [[ -z "$DROPLET_IP" ]]; then
        log_error "No DROPLET_IP configured"
        exit 1
    fi

    local service="${1:-}"
    
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP "cd /opt/portfolio && docker compose logs -f $service"
}

# ============================================
# Backup Database
# ============================================
backup_db() {
    if [[ -z "$DROPLET_IP" ]]; then
        log_error "No DROPLET_IP configured"
        exit 1
    fi

    local backup_file="backup_$(date +%Y%m%d_%H%M%S).db"
    local backup_dir="$SCRIPT_DIR/backups"
    mkdir -p "$backup_dir"

    log_info "Backing up database from $DROPLET_IP..."
    
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP \
        "docker cp portfolio-backend:/app/data/cms.db /tmp/cms_backup.db" && \
    scp -o StrictHostKeyChecking=no "root@$DROPLET_IP:/tmp/cms_backup.db" "$backup_dir/$backup_file"
    
    log_success "Database backed up to $backup_dir/$backup_file"
}

# ============================================
# Build Only (no push)
# ============================================
build_only() {
    local backend_image="${DOCKER_USERNAME:-local}/${IMAGE_BACKEND:-portfolio-backend}"
    local frontend_image="${DOCKER_USERNAME:-local}/${IMAGE_FRONTEND:-portfolio-frontend}"
    local tag="${1:-latest}"
    
    log_info "Building images locally..."
    
    # Build backend
    log_info "Building backend image: ${backend_image}:${tag}"
    docker build -t "${backend_image}:${tag}" -f "$PROJECT_ROOT/backend/dotnet/Dockerfile" "$PROJECT_ROOT/backend/dotnet"
    
    # Build frontend
    log_info "Building frontend image: ${frontend_image}:${tag}"
    docker build -t "${frontend_image}:${tag}" -f "$PROJECT_ROOT/frontend/portfolio-react/Dockerfile" "$PROJECT_ROOT/frontend/portfolio-react"
    
    log_success "Images built successfully"
    echo ""
    log_info "Images:"
    echo "  ${backend_image}:${tag}"
    echo "  ${frontend_image}:${tag}"
}

# ============================================
# Print Usage
# ============================================
usage() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  new             Create new droplet and deploy"
    echo "  deploy          Build locally, push to Docker Hub, deploy to server"
    echo "  quick           Quick deploy (build, push, restart containers)"
    echo "  build           Build images locally (no push)"
    echo "  push            Build and push images to Docker Hub"
    echo "  status          Show container status on server"
    echo "  logs [service]  Follow container logs"
    echo "  backup          Backup database from server"
    echo "  setup           Setup existing server (install Docker, etc.)"
    echo ""
    echo "Options:"
    echo "  --tag <tag>     Image tag (default: latest)"
    echo ""
    echo "Examples:"
    echo "  $0 new                    # Create droplet and deploy"
    echo "  $0 deploy                 # Build locally + push + deploy"
    echo "  $0 deploy --tag v1.0.0    # Deploy with specific tag"
    echo "  $0 quick                  # Quick redeploy"
    echo "  $0 build                  # Build images only"
    echo "  $0 logs backend           # Follow backend logs"
    echo ""
    echo "Required .env variables:"
    echo "  DOCKER_USERNAME           Docker Hub username"
    echo "  DROPLET_IP                Server IP (or use 'new' to create)"
    echo "  CMS_ADMIN_PASSWORD        Admin password"
    echo "  JWT_SECRET_KEY            JWT signing key"
    echo ""
}

# ============================================
# Main
# ============================================
main() {
    local command="${1:-}"
    shift || true
    
    # Parse options
    local tag="latest"
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --tag)
                tag="$2"
                shift 2
                ;;
            *)
                break
                ;;
        esac
    done

    case "$command" in
        new)
            load_env
            validate_env
            validate_registry
            create_droplet
            setup_server
            full_deploy "$tag"
            ;;
        deploy)
            load_env
            validate_env
            validate_registry
            if [[ -z "$DROPLET_IP" ]]; then
                log_error "DROPLET_IP not set. Use 'new' to create a droplet first."
                exit 1
            fi
            full_deploy "$tag"
            ;;
        quick)
            load_env
            validate_registry
            if [[ -z "$DROPLET_IP" ]]; then
                log_error "DROPLET_IP not set"
                exit 1
            fi
            quick_deploy "$tag"
            ;;
        build)
            load_env
            build_only "$tag"
            ;;
        push)
            load_env
            validate_registry
            build_and_push "$tag"
            ;;
        status)
            load_env
            show_status
            ;;
        logs)
            load_env
            show_logs "$@"
            ;;
        backup)
            load_env
            backup_db
            ;;
        setup)
            load_env
            if [[ -z "$DROPLET_IP" ]]; then
                log_error "DROPLET_IP not set"
                exit 1
            fi
            setup_server
            ;;
        *)
            usage
            exit 1
            ;;
    esac
}

main "$@"
