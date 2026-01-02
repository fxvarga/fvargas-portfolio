#!/bin/bash

set -e

# ============================================
# Portfolio Release Script
# Deploys to DigitalOcean (new or existing droplet)
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
# Build and Push Images
# ============================================
build_images() {
    log_info "Building Docker images locally..."
    
    cd "$PROJECT_ROOT"
    docker compose build
    
    log_success "Images built successfully"
}

# ============================================
# Deploy to Server
# ============================================
deploy() {
    log_info "Deploying to $DROPLET_IP..."

    # Create production docker-compose with environment variables
    local remote_dir="/opt/portfolio"

    # Copy necessary files
    log_info "Copying files to server..."
    
    # Create a temp directory for deployment files
    local tmp_dir=$(mktemp -d)
    
    # Copy docker-compose and Dockerfiles
    cp "$PROJECT_ROOT/docker-compose.yml" "$tmp_dir/"
    cp -r "$PROJECT_ROOT/backend" "$tmp_dir/"
    cp -r "$PROJECT_ROOT/frontend" "$tmp_dir/"
    
    # Create production .env file
    cat > "$tmp_dir/.env" << EOF
ASPNETCORE_ENVIRONMENT=Production
CMS_ADMIN_USERNAME=${CMS_ADMIN_USERNAME:-admin}
CMS_ADMIN_PASSWORD=${CMS_ADMIN_PASSWORD}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
CMS_DB_PATH=/app/data/cms.db
EOF
    
    # Sync files to server
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude 'bin' \
        --exclude 'obj' \
        --exclude '.git' \
        --exclude '*.db' \
        -e "ssh -o StrictHostKeyChecking=no" \
        "$tmp_dir/" "root@$DROPLET_IP:$remote_dir/"
    
    # Cleanup temp directory
    rm -rf "$tmp_dir"
    
    log_info "Building and starting containers on server..."
    
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << DEPLOY_SCRIPT
        set -e
        cd $remote_dir
        
        # Build and start containers
        docker compose down --remove-orphans || true
        docker compose build --no-cache
        docker compose up -d
        
        # Wait for services to be healthy
        echo "Waiting for services to start..."
        sleep 10
        
        # Check status
        docker compose ps
        
        echo ""
        echo "Deployment complete!"
DEPLOY_SCRIPT

    log_success "Deployment complete!"
    echo ""
    log_info "Your application is now running at:"
    echo "  http://$DROPLET_IP"
    echo "  http://$DROPLET_IP/admin"
    
    if [[ -n "$DOMAIN_NAME" ]]; then
        echo ""
        log_info "Don't forget to point your domain ($DOMAIN_NAME) to $DROPLET_IP"
    fi
}

# ============================================
# Quick Deploy (existing server, code only)
# ============================================
quick_deploy() {
    log_info "Quick deploying to $DROPLET_IP (code changes only)..."

    local remote_dir="/opt/portfolio"

    # Sync only source files
    rsync -avz \
        --exclude 'node_modules' \
        --exclude 'bin' \
        --exclude 'obj' \
        --exclude '.git' \
        --exclude '*.db' \
        --exclude '.env' \
        -e "ssh -o StrictHostKeyChecking=no" \
        "$PROJECT_ROOT/backend/" "root@$DROPLET_IP:$remote_dir/backend/"
    
    rsync -avz \
        --exclude 'node_modules' \
        --exclude '.git' \
        -e "ssh -o StrictHostKeyChecking=no" \
        "$PROJECT_ROOT/frontend/" "root@$DROPLET_IP:$remote_dir/frontend/"

    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << DEPLOY_SCRIPT
        set -e
        cd $remote_dir
        docker compose build
        docker compose up -d
        docker compose ps
DEPLOY_SCRIPT

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
# Print Usage
# ============================================
usage() {
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  new         Create new droplet and deploy"
    echo "  deploy      Full deploy to existing droplet"
    echo "  quick       Quick deploy (code changes only)"
    echo "  status      Show container status"
    echo "  logs        Follow container logs (optionally: logs backend|frontend)"
    echo "  backup      Backup database"
    echo "  setup       Setup existing server (install Docker, etc.)"
    echo ""
    echo "Examples:"
    echo "  $0 new              # Create droplet and deploy"
    echo "  $0 deploy           # Full deploy to existing server"
    echo "  $0 quick            # Quick code-only deploy"
    echo "  $0 logs backend     # Follow backend logs"
    echo ""
}

# ============================================
# Main
# ============================================
main() {
    local command="${1:-}"
    shift || true

    case "$command" in
        new)
            load_env
            validate_env
            create_droplet
            setup_server
            deploy
            ;;
        deploy)
            load_env
            validate_env
            if [[ -z "$DROPLET_IP" ]]; then
                log_error "DROPLET_IP not set. Use 'new' to create a droplet first."
                exit 1
            fi
            deploy
            ;;
        quick)
            load_env
            if [[ -z "$DROPLET_IP" ]]; then
                log_error "DROPLET_IP not set"
                exit 1
            fi
            quick_deploy
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
