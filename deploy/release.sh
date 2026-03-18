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
# Frontend Image Names
# ============================================
get_frontend_images() {
    local tag="${1:-latest}"
    FRONTEND_FERNANDO_IMAGE="${DOCKER_USERNAME}/${IMAGE_FRONTEND_FERNANDO:-portfolio-frontend-fernando}:${tag}"
    FRONTEND_JESSICA_IMAGE="${DOCKER_USERNAME}/${IMAGE_FRONTEND_JESSICA:-portfolio-frontend-jessica}:${tag}"
    FRONTEND_BUSYBEE_IMAGE="${DOCKER_USERNAME}/${IMAGE_FRONTEND_BUSYBEE:-portfolio-frontend-busybee}:${tag}"
    FRONTEND_EXECUTIVE_CATERING_IMAGE="${DOCKER_USERNAME}/${IMAGE_FRONTEND_EXECUTIVE_CATERING:-portfolio-frontend-executive-catering}:${tag}"
    FRONTEND_OPSBLUEPRINT_IMAGE="${DOCKER_USERNAME}/${IMAGE_FRONTEND_OPSBLUEPRINT:-portfolio-frontend-opsblueprint}:${tag}"
    N8N_PYTHON_HELPER_IMAGE="${DOCKER_USERNAME}/${IMAGE_N8N_PYTHON_HELPER:-portfolio-n8n-python-helper}:${tag}"
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
    local tag="${1:-latest}"
    
    get_frontend_images "$tag"
    
    log_info "Building images locally..."
    
    # Build backend
    log_info "Building backend image: ${backend_image}:${tag}"
    docker build -t "${backend_image}:${tag}" -f "$PROJECT_ROOT/backend/dotnet/Dockerfile" "$PROJECT_ROOT/backend/dotnet"
    
    # Build frontend - Fernando (main site + admin)
    log_info "Building frontend image (Fernando): ${FRONTEND_FERNANDO_IMAGE}"
    docker build -t "${FRONTEND_FERNANDO_IMAGE}" -f "$PROJECT_ROOT/frontend/portfolio-react/Dockerfile" "$PROJECT_ROOT/frontend/portfolio-react"
    
    # Build frontend - Jessica (photographer)
    log_info "Building frontend image (Jessica): ${FRONTEND_JESSICA_IMAGE}"
    docker build -t "${FRONTEND_JESSICA_IMAGE}" -f "$PROJECT_ROOT/frontend/portfolio-jessica/Dockerfile" "$PROJECT_ROOT/frontend/portfolio-jessica"
    
    # Build frontend - Busy Bee (marketing agency)
    log_info "Building frontend image (Busy Bee): ${FRONTEND_BUSYBEE_IMAGE}"
    docker build -t "${FRONTEND_BUSYBEE_IMAGE}" -f "$PROJECT_ROOT/frontend/portfolio-busybee/Dockerfile" "$PROJECT_ROOT/frontend/portfolio-busybee"
    
    # Build frontend - Executive Catering (1stopwings + future executive catering)
    log_info "Building frontend image (Executive Catering): ${FRONTEND_EXECUTIVE_CATERING_IMAGE}"
    docker build -t "${FRONTEND_EXECUTIVE_CATERING_IMAGE}" -f "$PROJECT_ROOT/frontend/portfolio-executive-catering/Dockerfile" "$PROJECT_ROOT/frontend/portfolio-executive-catering"
    
    # Build frontend - OpsBlueprint (workflow automation consulting)
    log_info "Building frontend image (OpsBlueprint): ${FRONTEND_OPSBLUEPRINT_IMAGE}"
    docker build -t "${FRONTEND_OPSBLUEPRINT_IMAGE}" -f "$PROJECT_ROOT/frontend/portfolio-opsblueprint/Dockerfile" "$PROJECT_ROOT/frontend/portfolio-opsblueprint"
    
    # Build n8n Python Helper
    log_info "Building n8n Python Helper image: ${N8N_PYTHON_HELPER_IMAGE}"
    docker build -t "${N8N_PYTHON_HELPER_IMAGE}" -f "$PROJECT_ROOT/n8n-agent/python-helper/Dockerfile" "$PROJECT_ROOT/n8n-agent/python-helper"
    
    log_success "Images built successfully"
    
    # Push to registry
    log_info "Pushing images to Docker Hub..."
    
    docker push "${backend_image}:${tag}"
    docker push "${FRONTEND_FERNANDO_IMAGE}"
    docker push "${FRONTEND_JESSICA_IMAGE}"
    docker push "${FRONTEND_BUSYBEE_IMAGE}"
    docker push "${FRONTEND_EXECUTIVE_CATERING_IMAGE}"
    docker push "${FRONTEND_OPSBLUEPRINT_IMAGE}"
    docker push "${N8N_PYTHON_HELPER_IMAGE}"
    
    log_success "Images pushed to Docker Hub"
    
    # Export for use in deploy
    export BACKEND_IMAGE="${backend_image}:${tag}"
}

# ============================================
# Deploy to Server (using pre-built images)
# ============================================
deploy() {
    local tag="${1:-latest}"
    local backend_image="${DOCKER_USERNAME}/${IMAGE_BACKEND:-portfolio-backend}:${tag}"
    
    get_frontend_images "$tag"
    
    local domain_fernando="${DOMAIN_FERNANDO:-}"
    local domain_jessica="${DOMAIN_JESSICA:-}"
    local domain_busybee="${DOMAIN_BUSYBEE:-}"
    local domain_1stopwings="${DOMAIN_1STOPWINGS:-}"
    local domain_executive_catering="${DOMAIN_EXECUTIVE_CATERING:-}"
    local domain_opsblueprint="${DOMAIN_OPSBLUEPRINT:-}"
    local domain_analytics="${DOMAIN_ANALYTICS:-}"
    local domain_grafana="${DOMAIN_GRAFANA:-}"
    local domain_n8n="${DOMAIN_N8N:-}"
    
    # Plausible config
    local plausible_base_url="${PLAUSIBLE_BASE_URL:-}"
    local plausible_secret_key="${PLAUSIBLE_SECRET_KEY_BASE:-}"
    local plausible_disable_reg="${PLAUSIBLE_DISABLE_REGISTRATION:-true}"
    
    # Grafana config
    local grafana_admin_password="${GRAFANA_ADMIN_PASSWORD:-admin}"
    
    # n8n config
    local n8n_encryption_key="${N8N_ENCRYPTION_KEY:-}"
    local n8n_postgres_user="${N8N_POSTGRES_USER:-n8n}"
    local n8n_postgres_password="${N8N_POSTGRES_PASSWORD:-n8n}"
    local n8n_postgres_db="${N8N_POSTGRES_DB:-n8n}"
    
    # n8n workflow env vars (MS Graph, SharePoint, Azure OpenAI)
    local ms_graph_tenant_id="${MS_GRAPH_TENANT_ID:-}"
    local ms_graph_client_id="${MS_GRAPH_CLIENT_ID:-}"
    local ms_graph_client_secret="${MS_GRAPH_CLIENT_SECRET:-}"
    local sharepoint_site_id="${SHAREPOINT_SITE_ID:-}"
    local sharepoint_drive_id="${SHAREPOINT_DRIVE_ID:-}"
    local sharepoint_leads_folder_id="${SHAREPOINT_LEADS_FOLDER_ID:-}"
    local sharepoint_proposals_folder_id="${SHAREPOINT_PROPOSALS_FOLDER_ID:-}"
    local leads_tracker_file_id="${LEADS_TRACKER_FILE_ID:-}"
    local sharepoint_kb_folder_id="${SHAREPOINT_KB_FOLDER_ID:-}"
    local sharepoint_kb_file_id="${SHAREPOINT_KB_FILE_ID:-}"
    local mail_user_upn="${MAIL_USER_UPN:-}"
    local azure_openai_endpoint="${AZURE_OPENAI_ENDPOINT:-}"
    local azure_openai_api_key="${AZURE_OPENAI_API_KEY:-}"
    local azure_openai_chat_deployment="${AZURE_OPENAI_CHAT_DEPLOYMENT:-}"
    local azure_openai_api_version="${AZURE_OPENAI_API_VERSION:-}"
    local email_categories_file_id="${EMAIL_CATEGORIES_FILE_ID:-}"
    local email_categories_table_name="${EMAIL_CATEGORIES_TABLE_NAME:-Categories}"
    
    log_info "Deploying to $DROPLET_IP..."
    log_info "Using images:"
    log_info "  Backend:          $backend_image"
    log_info "  Frontend Fernando: $FRONTEND_FERNANDO_IMAGE"
    log_info "  Frontend Jessica:  $FRONTEND_JESSICA_IMAGE"
    log_info "  Frontend BusyBee:  $FRONTEND_BUSYBEE_IMAGE"
    log_info "  Frontend Executive Catering: $FRONTEND_EXECUTIVE_CATERING_IMAGE"
    log_info "  Frontend OpsBlueprint: $FRONTEND_OPSBLUEPRINT_IMAGE"
    log_info "  n8n Python Helper: $N8N_PYTHON_HELPER_IMAGE"
    
    log_info "Domains:"
    log_info "  Fernando: ${domain_fernando:-localhost}"
    log_info "  Jessica:  ${domain_jessica:-jessica.localhost}"
    log_info "  BusyBee:  ${domain_busybee:-busybee.localhost}"
    log_info "  1StopWings: ${domain_1stopwings:-1stopwings.localhost}"
    log_info "  Executive Catering: ${domain_executive_catering:-executivecatering.localhost}"
    log_info "  OpsBlueprint: ${domain_opsblueprint:-opsblueprint.localhost}"
    log_info "  Analytics: ${domain_analytics:-analytics.localhost}"
    log_info "  Grafana:   ${domain_grafana:-grafana.localhost}"
    log_info "  n8n:       ${domain_n8n:-n8n.localhost}"

    # Create production docker-compose on server
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << DEPLOY_SCRIPT
        set -e
        
        mkdir -p /opt/portfolio
        mkdir -p /opt/portfolio/clickhouse
        mkdir -p /opt/portfolio/prometheus
        mkdir -p /opt/portfolio/grafana/provisioning/datasources
        mkdir -p /opt/portfolio/grafana/provisioning/dashboards
        mkdir -p /opt/portfolio/grafana/dashboards
        cd /opt/portfolio
        
        # Create ClickHouse config files for Plausible
        cat > clickhouse/logs.xml << 'CLICKHOUSE_EOF'
<clickhouse>
    <logger>
        <level>warning</level>
        <console>true</console>
    </logger>
    <query_log replace="1">
        <database>system</database>
        <table>query_log</table>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
        <engine>
            ENGINE = MergeTree
            PARTITION BY event_date
            ORDER BY (event_time)
            TTL event_date + interval 30 day
            SETTINGS ttl_only_drop_parts=1
        </engine>
    </query_log>
    <metric_log remove="remove" />
    <asynchronous_metric_log remove="remove" />
    <query_thread_log remove="remove" />
    <text_log remove="remove" />
    <trace_log remove="remove" />
    <session_log remove="remove" />
    <part_log remove="remove" />
</clickhouse>
CLICKHOUSE_EOF

        cat > clickhouse/ipv4-only.xml << 'CLICKHOUSE_EOF'
<clickhouse>
    <listen_host>0.0.0.0</listen_host>
</clickhouse>
CLICKHOUSE_EOF

        cat > clickhouse/low-resources.xml << 'CLICKHOUSE_EOF'
<clickhouse>
    <mark_cache_size>524288000</mark_cache_size>
</clickhouse>
CLICKHOUSE_EOF

        cat > clickhouse/default-profile-low-resources-overrides.xml << 'CLICKHOUSE_EOF'
<clickhouse>
    <profiles>
        <default>
            <max_threads>1</max_threads>
            <max_block_size>8192</max_block_size>
            <max_download_threads>1</max_download_threads>
            <input_format_parallel_parsing>0</input_format_parallel_parsing>
            <output_format_parallel_formatting>0</output_format_parallel_formatting>
        </default>
    </profiles>
</clickhouse>
CLICKHOUSE_EOF

        # Create Prometheus config
        cat > prometheus/prometheus.yml << 'PROM_EOF'
global:
  scrape_interval: 30s
  evaluation_interval: 30s
  scrape_timeout: 10s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: "cadvisor"
    static_configs:
      - targets: ["cadvisor:8080"]
PROM_EOF

        # Create Grafana provisioning - datasource
        cat > grafana/provisioning/datasources/prometheus.yml << 'GRAFANA_DS_EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
GRAFANA_DS_EOF

        # Create Grafana provisioning - dashboard config
        cat > grafana/provisioning/dashboards/dashboard.yml << 'GRAFANA_DASH_EOF'
apiVersion: 1

providers:
  - name: "default"
    orgId: 1
    folder: ""
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: false
GRAFANA_DASH_EOF

        # Create Grafana dashboard - Host Monitoring (Node Exporter)
        cat > grafana/dashboards/host-monitoring.json << 'HOST_DASH_EOF'
{"annotations":{"list":[]},"editable":true,"fiscalYearStartMonth":0,"graphTooltip":1,"links":[],"panels":[{"collapsed":false,"gridPos":{"h":1,"w":24,"x":0,"y":0},"id":100,"title":"Overview","type":"row"},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"thresholds":{"mode":"absolute","steps":[{"color":"green","value":null},{"color":"yellow","value":70},{"color":"red","value":90}]},"unit":"percent","min":0,"max":100},"overrides":[]},"gridPos":{"h":6,"w":6,"x":0,"y":1},"id":1,"options":{"orientation":"auto","reduceOptions":{"calcs":["lastNotNull"],"fields":"","values":false},"showThresholdLabels":false,"showThresholdMarkers":true},"title":"CPU Usage","type":"gauge","targets":[{"expr":"100 - (avg(irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)","legendFormat":"CPU","refId":"A"}]},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"thresholds":{"mode":"absolute","steps":[{"color":"green","value":null},{"color":"yellow","value":70},{"color":"red","value":85}]},"unit":"percent","min":0,"max":100},"overrides":[]},"gridPos":{"h":6,"w":6,"x":6,"y":1},"id":2,"options":{"orientation":"auto","reduceOptions":{"calcs":["lastNotNull"],"fields":"","values":false},"showThresholdLabels":false,"showThresholdMarkers":true},"title":"Memory Usage","type":"gauge","targets":[{"expr":"(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100","legendFormat":"RAM","refId":"A"}]},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"thresholds":{"mode":"absolute","steps":[{"color":"green","value":null},{"color":"yellow","value":70},{"color":"red","value":85}]},"unit":"percent","min":0,"max":100},"overrides":[]},"gridPos":{"h":6,"w":6,"x":12,"y":1},"id":3,"options":{"orientation":"auto","reduceOptions":{"calcs":["lastNotNull"],"fields":"","values":false},"showThresholdLabels":false,"showThresholdMarkers":true},"title":"Disk Usage","type":"gauge","targets":[{"expr":"(1 - (node_filesystem_avail_bytes{mountpoint=\"/\",fstype!=\"rootfs\"} / node_filesystem_size_bytes{mountpoint=\"/\",fstype!=\"rootfs\"})) * 100","legendFormat":"Disk","refId":"A"}]},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"thresholds":{"mode":"absolute","steps":[{"color":"green","value":null}]},"unit":"s"},"overrides":[]},"gridPos":{"h":6,"w":6,"x":18,"y":1},"id":4,"options":{"colorMode":"value","graphMode":"none","justifyMode":"auto","orientation":"auto","reduceOptions":{"calcs":["lastNotNull"],"fields":"","values":false},"textMode":"auto"},"title":"System Uptime","type":"stat","targets":[{"expr":"node_time_seconds - node_boot_time_seconds","legendFormat":"Uptime","refId":"A"}]},{"collapsed":false,"gridPos":{"h":1,"w":24,"x":0,"y":7},"id":101,"title":"CPU","type":"row"},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisBorderShow":false,"axisCenteredZero":false,"axisLabel":"","drawStyle":"line","fillOpacity":20,"lineWidth":1,"pointSize":5,"showPoints":"never","spanNulls":false,"stacking":{"group":"A","mode":"none"}},"unit":"percent","min":0,"max":100},"overrides":[]},"gridPos":{"h":8,"w":12,"x":0,"y":8},"id":5,"options":{"legend":{"calcs":["mean","max"],"displayMode":"table","placement":"bottom"},"tooltip":{"mode":"multi","sort":"desc"}},"title":"CPU Usage Over Time","type":"timeseries","targets":[{"expr":"100 - (avg(irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)","legendFormat":"Total CPU %","refId":"A"}]},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisBorderShow":false,"drawStyle":"line","fillOpacity":10,"lineWidth":1,"pointSize":5,"showPoints":"never","spanNulls":false,"stacking":{"group":"A","mode":"normal"}},"unit":"percent","min":0,"max":100},"overrides":[]},"gridPos":{"h":8,"w":12,"x":12,"y":8},"id":6,"options":{"legend":{"calcs":["mean"],"displayMode":"table","placement":"bottom"},"tooltip":{"mode":"multi","sort":"desc"}},"title":"CPU Usage by Mode","type":"timeseries","targets":[{"expr":"avg(irate(node_cpu_seconds_total{mode=\"user\"}[5m])) * 100","legendFormat":"user","refId":"A"},{"expr":"avg(irate(node_cpu_seconds_total{mode=\"system\"}[5m])) * 100","legendFormat":"system","refId":"B"},{"expr":"avg(irate(node_cpu_seconds_total{mode=\"iowait\"}[5m])) * 100","legendFormat":"iowait","refId":"C"}]},{"collapsed":false,"gridPos":{"h":1,"w":24,"x":0,"y":16},"id":102,"title":"Memory","type":"row"},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisBorderShow":false,"drawStyle":"line","fillOpacity":20,"lineWidth":1,"pointSize":5,"showPoints":"never","spanNulls":false,"stacking":{"group":"A","mode":"none"}},"unit":"bytes"},"overrides":[]},"gridPos":{"h":8,"w":12,"x":0,"y":17},"id":7,"options":{"legend":{"calcs":["mean","lastNotNull"],"displayMode":"table","placement":"bottom"},"tooltip":{"mode":"multi","sort":"desc"}},"title":"Memory Usage","type":"timeseries","targets":[{"expr":"node_memory_MemTotal_bytes","legendFormat":"Total","refId":"A"},{"expr":"node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes","legendFormat":"Used","refId":"B"},{"expr":"node_memory_MemAvailable_bytes","legendFormat":"Available","refId":"C"}]},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisBorderShow":false,"drawStyle":"line","fillOpacity":20,"lineWidth":1,"pointSize":5,"showPoints":"never","spanNulls":false,"stacking":{"group":"A","mode":"none"}},"unit":"bytes"},"overrides":[]},"gridPos":{"h":8,"w":12,"x":12,"y":17},"id":8,"options":{"legend":{"calcs":["mean","lastNotNull"],"displayMode":"table","placement":"bottom"},"tooltip":{"mode":"multi","sort":"desc"}},"title":"Swap Usage","type":"timeseries","targets":[{"expr":"node_memory_SwapTotal_bytes","legendFormat":"Swap Total","refId":"A"},{"expr":"node_memory_SwapTotal_bytes - node_memory_SwapFree_bytes","legendFormat":"Swap Used","refId":"B"}]},{"collapsed":false,"gridPos":{"h":1,"w":24,"x":0,"y":25},"id":103,"title":"Disk","type":"row"},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisBorderShow":false,"drawStyle":"line","fillOpacity":20,"lineWidth":1,"pointSize":5,"showPoints":"never","spanNulls":false,"stacking":{"group":"A","mode":"none"}},"unit":"bytes"},"overrides":[]},"gridPos":{"h":8,"w":12,"x":0,"y":26},"id":9,"options":{"legend":{"calcs":["lastNotNull"],"displayMode":"table","placement":"bottom"},"tooltip":{"mode":"multi","sort":"desc"}},"title":"Disk Space (Root /)","type":"timeseries","targets":[{"expr":"node_filesystem_size_bytes{mountpoint=\"/\",fstype!=\"rootfs\"}","legendFormat":"Total","refId":"A"},{"expr":"node_filesystem_size_bytes{mountpoint=\"/\",fstype!=\"rootfs\"} - node_filesystem_avail_bytes{mountpoint=\"/\",fstype!=\"rootfs\"}","legendFormat":"Used","refId":"B"},{"expr":"node_filesystem_avail_bytes{mountpoint=\"/\",fstype!=\"rootfs\"}","legendFormat":"Available","refId":"C"}]},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisBorderShow":false,"drawStyle":"line","fillOpacity":10,"lineWidth":1,"pointSize":5,"showPoints":"never","spanNulls":false,"stacking":{"group":"A","mode":"none"}},"unit":"Bps"},"overrides":[]},"gridPos":{"h":8,"w":12,"x":12,"y":26},"id":10,"options":{"legend":{"calcs":["mean","max"],"displayMode":"table","placement":"bottom"},"tooltip":{"mode":"multi","sort":"desc"}},"title":"Disk I/O","type":"timeseries","targets":[{"expr":"irate(node_disk_read_bytes_total[5m])","legendFormat":"Read {{device}}","refId":"A"},{"expr":"irate(node_disk_written_bytes_total[5m])","legendFormat":"Write {{device}}","refId":"B"}]},{"collapsed":false,"gridPos":{"h":1,"w":24,"x":0,"y":34},"id":104,"title":"Network","type":"row"},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisBorderShow":false,"drawStyle":"line","fillOpacity":10,"lineWidth":1,"pointSize":5,"showPoints":"never","spanNulls":false,"stacking":{"group":"A","mode":"none"}},"unit":"Bps"},"overrides":[]},"gridPos":{"h":8,"w":24,"x":0,"y":35},"id":11,"options":{"legend":{"calcs":["mean","max"],"displayMode":"table","placement":"bottom"},"tooltip":{"mode":"multi","sort":"desc"}},"title":"Network Traffic","type":"timeseries","targets":[{"expr":"irate(node_network_receive_bytes_total{device!~\"lo|veth.*|docker.*|br-.*\"}[5m])","legendFormat":"Recv {{device}}","refId":"A"},{"expr":"irate(node_network_transmit_bytes_total{device!~\"lo|veth.*|docker.*|br-.*\"}[5m])","legendFormat":"Send {{device}}","refId":"B"}]}],"schemaVersion":39,"tags":["node-exporter","host"],"templating":{"list":[]},"time":{"from":"now-1h","to":"now"},"timepicker":{},"timezone":"browser","title":"Host Monitoring (Node Exporter)","uid":"host-monitoring","version":1}
HOST_DASH_EOF

        # Create Grafana dashboard - Docker Container Monitoring (cAdvisor)
        cat > grafana/dashboards/docker-monitoring.json << 'DOCKER_DASH_EOF'
{"annotations":{"list":[]},"editable":true,"fiscalYearStartMonth":0,"graphTooltip":1,"links":[],"panels":[{"collapsed":false,"gridPos":{"h":1,"w":24,"x":0,"y":0},"id":100,"title":"Container Overview","type":"row"},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"thresholds":{"mode":"absolute","steps":[{"color":"green","value":null}]}},"overrides":[]},"gridPos":{"h":4,"w":6,"x":0,"y":1},"id":1,"options":{"colorMode":"value","graphMode":"none","justifyMode":"auto","orientation":"auto","reduceOptions":{"calcs":["lastNotNull"],"fields":"","values":false},"textMode":"auto"},"title":"Running Containers","type":"stat","targets":[{"expr":"count(container_last_seen{name=~\".+\"}) - count(container_last_seen{name=\"/\"})","legendFormat":"Containers","refId":"A"}]},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"thresholds":{"mode":"absolute","steps":[{"color":"green","value":null},{"color":"yellow","value":70},{"color":"red","value":85}]},"unit":"percent","min":0,"max":100},"overrides":[]},"gridPos":{"h":4,"w":6,"x":6,"y":1},"id":2,"options":{"orientation":"auto","reduceOptions":{"calcs":["lastNotNull"],"fields":"","values":false},"showThresholdLabels":false,"showThresholdMarkers":true},"title":"Total Container CPU %","type":"gauge","targets":[{"expr":"sum(rate(container_cpu_usage_seconds_total{name=~\".+\",name!=\"/\"}[5m])) * 100","legendFormat":"CPU","refId":"A"}]},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"thresholds":{"mode":"absolute","steps":[{"color":"green","value":null},{"color":"yellow","value":2684354560},{"color":"red","value":3489660928}]},"unit":"bytes"},"overrides":[]},"gridPos":{"h":4,"w":6,"x":12,"y":1},"id":3,"options":{"colorMode":"value","graphMode":"area","justifyMode":"auto","orientation":"auto","reduceOptions":{"calcs":["lastNotNull"],"fields":"","values":false},"textMode":"auto"},"title":"Total Container Memory","type":"stat","targets":[{"expr":"sum(container_memory_usage_bytes{name=~\".+\",name!=\"/\"})","legendFormat":"Memory","refId":"A"}]},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"thresholds":{"mode":"absolute","steps":[{"color":"green","value":null}]},"unit":"Bps"},"overrides":[]},"gridPos":{"h":4,"w":6,"x":18,"y":1},"id":4,"options":{"colorMode":"value","graphMode":"area","justifyMode":"auto","orientation":"auto","reduceOptions":{"calcs":["lastNotNull"],"fields":"","values":false},"textMode":"auto"},"title":"Total Network RX","type":"stat","targets":[{"expr":"sum(rate(container_network_receive_bytes_total{name=~\".+\",name!=\"/\"}[5m]))","legendFormat":"RX","refId":"A"}]},{"collapsed":false,"gridPos":{"h":1,"w":24,"x":0,"y":5},"id":101,"title":"CPU by Container","type":"row"},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisBorderShow":false,"drawStyle":"line","fillOpacity":20,"lineWidth":1,"pointSize":5,"showPoints":"never","spanNulls":false,"stacking":{"group":"A","mode":"none"}},"unit":"percent"},"overrides":[]},"gridPos":{"h":8,"w":24,"x":0,"y":6},"id":5,"options":{"legend":{"calcs":["mean","max"],"displayMode":"table","placement":"right","sortBy":"Mean","sortDesc":true},"tooltip":{"mode":"multi","sort":"desc"}},"title":"CPU Usage by Container","type":"timeseries","targets":[{"expr":"rate(container_cpu_usage_seconds_total{name=~\".+\",name!=\"/\"}[5m]) * 100","legendFormat":"{{name}}","refId":"A"}]},{"collapsed":false,"gridPos":{"h":1,"w":24,"x":0,"y":14},"id":102,"title":"Memory by Container","type":"row"},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisBorderShow":false,"drawStyle":"line","fillOpacity":20,"lineWidth":1,"pointSize":5,"showPoints":"never","spanNulls":false,"stacking":{"group":"A","mode":"none"}},"unit":"bytes"},"overrides":[]},"gridPos":{"h":8,"w":24,"x":0,"y":15},"id":6,"options":{"legend":{"calcs":["mean","lastNotNull"],"displayMode":"table","placement":"right","sortBy":"Last *","sortDesc":true},"tooltip":{"mode":"multi","sort":"desc"}},"title":"Memory Usage by Container","type":"timeseries","targets":[{"expr":"container_memory_usage_bytes{name=~\".+\",name!=\"/\"}","legendFormat":"{{name}}","refId":"A"}]},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisBorderShow":false,"drawStyle":"bars","fillOpacity":80,"lineWidth":1,"pointSize":5,"showPoints":"never","spanNulls":false,"stacking":{"group":"A","mode":"none"}},"unit":"bytes"},"overrides":[]},"gridPos":{"h":8,"w":24,"x":0,"y":23},"id":7,"options":{"legend":{"calcs":["lastNotNull"],"displayMode":"table","placement":"right","sortBy":"Last *","sortDesc":true},"tooltip":{"mode":"multi","sort":"desc"}},"title":"Memory RSS by Container","type":"timeseries","targets":[{"expr":"container_memory_rss{name=~\".+\",name!=\"/\"}","legendFormat":"{{name}}","refId":"A"}]},{"collapsed":false,"gridPos":{"h":1,"w":24,"x":0,"y":31},"id":103,"title":"Network by Container","type":"row"},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisBorderShow":false,"drawStyle":"line","fillOpacity":10,"lineWidth":1,"pointSize":5,"showPoints":"never","spanNulls":false,"stacking":{"group":"A","mode":"none"}},"unit":"Bps"},"overrides":[]},"gridPos":{"h":8,"w":12,"x":0,"y":32},"id":8,"options":{"legend":{"calcs":["mean","max"],"displayMode":"table","placement":"bottom","sortBy":"Mean","sortDesc":true},"tooltip":{"mode":"multi","sort":"desc"}},"title":"Network RX by Container","type":"timeseries","targets":[{"expr":"rate(container_network_receive_bytes_total{name=~\".+\",name!=\"/\"}[5m])","legendFormat":"{{name}}","refId":"A"}]},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisBorderShow":false,"drawStyle":"line","fillOpacity":10,"lineWidth":1,"pointSize":5,"showPoints":"never","spanNulls":false,"stacking":{"group":"A","mode":"none"}},"unit":"Bps"},"overrides":[]},"gridPos":{"h":8,"w":12,"x":12,"y":32},"id":9,"options":{"legend":{"calcs":["mean","max"],"displayMode":"table","placement":"bottom","sortBy":"Mean","sortDesc":true},"tooltip":{"mode":"multi","sort":"desc"}},"title":"Network TX by Container","type":"timeseries","targets":[{"expr":"rate(container_network_transmit_bytes_total{name=~\".+\",name!=\"/\"}[5m])","legendFormat":"{{name}}","refId":"A"}]},{"collapsed":false,"gridPos":{"h":1,"w":24,"x":0,"y":40},"id":104,"title":"Disk I/O by Container","type":"row"},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisBorderShow":false,"drawStyle":"line","fillOpacity":10,"lineWidth":1,"pointSize":5,"showPoints":"never","spanNulls":false,"stacking":{"group":"A","mode":"none"}},"unit":"Bps"},"overrides":[]},"gridPos":{"h":8,"w":12,"x":0,"y":41},"id":10,"options":{"legend":{"calcs":["mean","max"],"displayMode":"table","placement":"bottom","sortBy":"Mean","sortDesc":true},"tooltip":{"mode":"multi","sort":"desc"}},"title":"Disk Read by Container","type":"timeseries","targets":[{"expr":"rate(container_fs_reads_bytes_total{name=~\".+\",name!=\"/\"}[5m])","legendFormat":"{{name}}","refId":"A"}]},{"datasource":{"type":"prometheus","uid":""},"fieldConfig":{"defaults":{"color":{"mode":"palette-classic"},"custom":{"axisBorderShow":false,"drawStyle":"line","fillOpacity":10,"lineWidth":1,"pointSize":5,"showPoints":"never","spanNulls":false,"stacking":{"group":"A","mode":"none"}},"unit":"Bps"},"overrides":[]},"gridPos":{"h":8,"w":12,"x":12,"y":41},"id":11,"options":{"legend":{"calcs":["mean","max"],"displayMode":"table","placement":"bottom","sortBy":"Mean","sortDesc":true},"tooltip":{"mode":"multi","sort":"desc"}},"title":"Disk Write by Container","type":"timeseries","targets":[{"expr":"rate(container_fs_writes_bytes_total{name=~\".+\",name!=\"/\"}[5m])","legendFormat":"{{name}}","refId":"A"}]}],"schemaVersion":39,"tags":["cadvisor","docker","containers"],"templating":{"list":[]},"time":{"from":"now-1h","to":"now"},"timepicker":{},"timezone":"browser","title":"Docker Container Monitoring (cAdvisor)","uid":"docker-monitoring","version":1}
DOCKER_DASH_EOF

        # Create docker-compose.yml for production
        cat > docker-compose.yml << 'COMPOSE_EOF'
services:
  # Elasticsearch for search functionality
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    container_name: portfolio-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - xpack.security.enrollment.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - cluster.name=portfolio-search
      - bootstrap.memory_lock=true
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - portfolio-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -s http://localhost:9200/_cluster/health | grep -E 'green|yellow'"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

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
      - CMS_ADMIN_PASSWORD=${CMS_ADMIN_PASSWORD}
      - ELASTICSEARCH_URL=http://elasticsearch:9200
      - AZURE_OPENAI_ENDPOINT=${AZURE_OPENAI_ENDPOINT:-}
      - AZURE_OPENAI_API_KEY=${AZURE_OPENAI_API_KEY:-}
      - AZURE_OPENAI_EMBEDDING_DEPLOYMENT=${AZURE_OPENAI_EMBEDDING_DEPLOYMENT:-text-embedding-ada-002}
    depends_on:
      elasticsearch:
        condition: service_healthy
    networks:
      - portfolio-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/graphql?query=%7B__typename%7D"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

  frontend-fernando:
    image: ${FRONTEND_FERNANDO_IMAGE}
    container_name: portfolio-frontend-fernando
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - portfolio-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

  frontend-jessica:
    image: ${FRONTEND_JESSICA_IMAGE}
    container_name: portfolio-frontend-jessica
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - portfolio-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

  frontend-busybee:
    image: ${FRONTEND_BUSYBEE_IMAGE}
    container_name: portfolio-frontend-busybee
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - portfolio-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

  frontend-executive-catering:
    image: ${FRONTEND_EXECUTIVE_CATERING_IMAGE}
    container_name: portfolio-frontend-executive-catering
    networks:
      - portfolio-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1/1stopwings-site/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

  frontend-opsblueprint:
    image: ${FRONTEND_OPSBLUEPRINT_IMAGE}
    container_name: portfolio-frontend-opsblueprint
    networks:
      - portfolio-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

  # Plausible Analytics
  plausible_db:
    image: postgres:16-alpine
    container_name: portfolio-plausible-db
    restart: unless-stopped
    volumes:
      - plausible-db-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=postgres
    networks:
      - portfolio-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  plausible_events_db:
    image: clickhouse/clickhouse-server:24.12-alpine
    container_name: portfolio-plausible-events-db
    restart: unless-stopped
    volumes:
      - plausible-events-data:/var/lib/clickhouse
      - plausible-events-logs:/var/log/clickhouse-server
      - ./clickhouse/logs.xml:/etc/clickhouse-server/config.d/logs.xml:ro
      - ./clickhouse/ipv4-only.xml:/etc/clickhouse-server/config.d/ipv4-only.xml:ro
      - ./clickhouse/low-resources.xml:/etc/clickhouse-server/config.d/low-resources.xml:ro
      - ./clickhouse/default-profile-low-resources-overrides.xml:/etc/clickhouse-server/users.d/default-profile-low-resources-overrides.xml:ro
    ulimits:
      nofile:
        soft: 262144
        hard: 262144
    environment:
      - CLICKHOUSE_SKIP_USER_SETUP=1
    networks:
      - portfolio-network
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 -O - http://127.0.0.1:8123/ping || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  plausible:
    image: ghcr.io/plausible/community-edition:v3.2.0
    container_name: portfolio-plausible
    restart: unless-stopped
    command: sh -c "/entrypoint.sh db createdb && /entrypoint.sh db migrate && /entrypoint.sh run"
    depends_on:
      plausible_db:
        condition: service_healthy
      plausible_events_db:
        condition: service_healthy
    volumes:
      - plausible-data:/var/lib/plausible
    ulimits:
      nofile:
        soft: 65535
        hard: 65535
    environment:
      - TMPDIR=/var/lib/plausible/tmp
      - BASE_URL=${plausible_base_url}
      - SECRET_KEY_BASE=${plausible_secret_key}
      - HTTP_PORT=8000
      - DISABLE_REGISTRATION=${plausible_disable_reg}
    networks:
      - portfolio-network

  # Monitoring Stack
  prometheus:
    image: prom/prometheus:v2.51.0
    container_name: portfolio-prometheus
    restart: unless-stopped
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--storage.tsdb.retention.time=15d"
      - "--storage.tsdb.retention.size=1GB"
      - "--web.console.libraries=/etc/prometheus/console_libraries"
      - "--web.console.templates=/etc/prometheus/consoles"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    networks:
      - portfolio-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  node-exporter:
    image: prom/node-exporter:v1.7.0
    container_name: portfolio-node-exporter
    restart: unless-stopped
    command:
      - "--path.rootfs=/host"
      - "--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)"
    pid: host
    volumes:
      - /:/host:ro,rslave
    networks:
      - portfolio-network

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.55.1
    container_name: portfolio-cadvisor
    restart: unless-stopped
    privileged: true
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    command:
      - "--housekeeping_interval=30s"
      - "--docker_only=true"
      - "--disable_metrics=percpu,sched,tcp,udp,disk,diskIO,hugetlb,referenced_memory,cpu_topology,resctrl"
    networks:
      - portfolio-network

  grafana:
    image: grafana/grafana:10.4.0
    container_name: portfolio-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${grafana_admin_password}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=https://${domain_grafana:-grafana.localhost}
      - GF_SERVER_SERVE_FROM_SUB_PATH=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning/datasources:/etc/grafana/provisioning/datasources:ro
      - ./grafana/provisioning/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
    depends_on:
      - prometheus
    networks:
      - portfolio-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

  # n8n Workflow Automation
  n8n-postgres:
    image: postgres:16-alpine
    container_name: portfolio-n8n-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${n8n_postgres_user}
      - POSTGRES_PASSWORD=${n8n_postgres_password}
      - POSTGRES_DB=${n8n_postgres_db}
    volumes:
      - n8n-db-data:/var/lib/postgresql/data
    networks:
      - portfolio-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${n8n_postgres_user}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  n8n:
    image: n8nio/n8n:latest
    container_name: portfolio-n8n
    restart: unless-stopped
    environment:
      - NODE_OPTIONS=--dns-result-order=ipv4first
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=n8n-postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=${n8n_postgres_db}
      - DB_POSTGRESDB_USER=${n8n_postgres_user}
      - DB_POSTGRESDB_PASSWORD=${n8n_postgres_password}
      - N8N_ENCRYPTION_KEY=${n8n_encryption_key}
      - EXECUTIONS_MODE=regular
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_SECURE_COOKIE=false
      - N8N_BLOCK_ENV_ACCESS_IN_NODE=false
      - WEBHOOK_URL=https://${domain_n8n:-n8n.localhost}/
      - N8N_EDITOR_BASE_URL=https://${domain_n8n:-n8n.localhost}/
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_PERSONALIZATION_ENABLED=false
      - N8N_INSIGHTS_ENABLED=false
      - N8N_LOG_LEVEL=info
      - GENERIC_TIMEZONE=America/New_York
      # Workflow env vars (MS Graph, SharePoint, Azure OpenAI)
      - MS_GRAPH_TENANT_ID=${ms_graph_tenant_id}
      - MS_GRAPH_CLIENT_ID=${ms_graph_client_id}
      - MS_GRAPH_CLIENT_SECRET=${ms_graph_client_secret}
      - SHAREPOINT_SITE_ID=${sharepoint_site_id}
      - SHAREPOINT_DRIVE_ID=${sharepoint_drive_id}
      - SHAREPOINT_LEADS_FOLDER_ID=${sharepoint_leads_folder_id}
      - SHAREPOINT_PROPOSALS_FOLDER_ID=${sharepoint_proposals_folder_id}
      - LEADS_TRACKER_FILE_ID=${leads_tracker_file_id}
      - SHAREPOINT_KB_FOLDER_ID=${sharepoint_kb_folder_id}
      - SHAREPOINT_KB_FILE_ID=${sharepoint_kb_file_id}
      - MAIL_USER_UPN=${mail_user_upn}
      - AZURE_OPENAI_ENDPOINT=${azure_openai_endpoint}
      - AZURE_OPENAI_API_KEY=${azure_openai_api_key}
      - AZURE_OPENAI_CHAT_DEPLOYMENT=${azure_openai_chat_deployment}
      - AZURE_OPENAI_API_VERSION=${azure_openai_api_version}
      - EMAIL_CATEGORIES_FILE_ID=${email_categories_file_id}
      - EMAIL_CATEGORIES_TABLE_NAME=${email_categories_table_name}
    volumes:
      - n8n-data:/home/node/.n8n
    sysctls:
      - net.ipv6.conf.all.disable_ipv6=1
    depends_on:
      n8n-postgres:
        condition: service_healthy
    networks:
      - portfolio-network
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://127.0.0.1:5678/healthz || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

  n8n-python-helper:
    image: ${N8N_PYTHON_HELPER_IMAGE}
    container_name: portfolio-n8n-python-helper
    restart: unless-stopped
    networks:
      - portfolio-network
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 10s

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
    depends_on:
      - frontend-fernando
      - frontend-jessica
      - frontend-busybee
      - frontend-executive-catering
      - frontend-opsblueprint
      - backend
      - plausible
      - grafana
      - n8n
    networks:
      - portfolio-network
    restart: unless-stopped

networks:
  portfolio-network:
    driver: bridge

volumes:
  elasticsearch-data:
    driver: local
  cms-data:
    driver: local
  caddy-data:
    driver: local
  caddy-config:
    driver: local
  plausible-db-data:
    driver: local
  plausible-events-data:
    driver: local
  plausible-events-logs:
    driver: local
  plausible-data:
    driver: local
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
  n8n-db-data:
    driver: local
  n8n-data:
    driver: local
COMPOSE_EOF

        # Create Caddyfile with domains directly embedded
        cat > Caddyfile << CADDY_EOF
# Fernando Vargas Portfolio (main site + admin)
${domain_fernando:-localhost} {
    handle /graphql* {
        reverse_proxy backend:5000
    }
    handle /api/* {
        reverse_proxy backend:5000
    }
    handle /healthcheck {
        reverse_proxy backend:5000
    }
    handle {
        reverse_proxy frontend-fernando:80
    }
}

www.${domain_fernando:-localhost} {
    redir https://${domain_fernando:-localhost}{uri} permanent
}

# Jessica Sutherland Portfolio
${domain_jessica:-jessica.localhost} {
    handle /admin* {
        redir https://${domain_fernando:-localhost}{uri} permanent
    }
    handle /graphql* {
        reverse_proxy backend:5000
    }
    handle /api/* {
        reverse_proxy backend:5000
    }
    handle /healthcheck {
        reverse_proxy backend:5000
    }
    handle {
        reverse_proxy frontend-jessica:80
    }
}

www.${domain_jessica:-jessica.localhost} {
    redir https://${domain_jessica:-jessica.localhost}{uri} permanent
}

# Busy Bee Marketing Agency
${domain_busybee:-busybee.localhost} {
    handle /admin* {
        redir https://${domain_fernando:-localhost}{uri} permanent
    }
    handle /graphql* {
        reverse_proxy backend:5000
    }
    handle /api/* {
        reverse_proxy backend:5000
    }
    handle /healthcheck {
        reverse_proxy backend:5000
    }
    handle {
        reverse_proxy frontend-busybee:80
    }
}

www.${domain_busybee:-busybee.localhost} {
    redir https://${domain_busybee:-busybee.localhost}{uri} permanent
}

# 1 Stop Wings (via Executive Catering container)
${domain_1stopwings:-1stopwings.localhost} {
    # API and GraphQL routes to backend (CMS-powered content)
    handle /graphql* {
        reverse_proxy backend:5000
    }

    handle /api/* {
        reverse_proxy backend:5000
    }

    handle {
        reverse_proxy frontend-executive-catering:80
    }
}

# Executive Catering main site (same container, different domain)
${domain_executive_catering:-executivecatering.localhost} {
    # API and GraphQL routes to backend (CMS-powered content)
    handle /graphql* {
        reverse_proxy backend:5000
    }

    handle /api/* {
        reverse_proxy backend:5000
    }

    handle {
        reverse_proxy frontend-executive-catering:80
    }
}

# OpsBlueprint (workflow automation consulting)
${domain_opsblueprint:-opsblueprint.localhost} {
    handle /api/* {
        reverse_proxy backend:5000
    }

    handle {
        reverse_proxy frontend-opsblueprint:80
    }
}

# Plausible Analytics
${domain_analytics:-analytics.localhost} {
    reverse_proxy plausible:8000
}

# Grafana Monitoring
${domain_grafana:-grafana.localhost} {
    reverse_proxy grafana:3000
}

# n8n Workflow Automation
${domain_n8n:-n8n.localhost} {
    reverse_proxy n8n:5678 {
        flush_interval -1
        transport http {
            keepalive 30s
        }
    }
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
    log_info "Your applications are now running at:"
    if [[ -n "$domain_fernando" ]]; then
        echo "  Fernando: https://$domain_fernando"
        echo "  Fernando Admin: https://$domain_fernando/admin"
    fi
    if [[ -n "$domain_jessica" ]]; then
        echo "  Jessica: https://$domain_jessica"
    fi
    if [[ -n "$domain_busybee" ]]; then
        echo "  BusyBee: https://$domain_busybee"
    fi
    if [[ -n "$domain_1stopwings" ]]; then
        echo "  1StopWings: https://$domain_1stopwings"
    fi
    if [[ -n "$domain_executive_catering" ]]; then
        echo "  Executive Catering: https://$domain_executive_catering"
    fi
    if [[ -n "$domain_opsblueprint" ]]; then
        echo "  OpsBlueprint: https://$domain_opsblueprint"
    fi
    if [[ -n "$domain_analytics" ]]; then
        echo "  Analytics: https://$domain_analytics"
    fi
    if [[ -n "$domain_grafana" ]]; then
        echo "  Grafana: https://$domain_grafana"
    fi
    echo ""
    log_info "Make sure your DNS is configured for all domains to point to: $DROPLET_IP"
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
    local tag="${1:-latest}"
    
    get_frontend_images "$tag"
    
    log_info "Building images locally..."
    
    # Build backend
    log_info "Building backend image: ${backend_image}:${tag}"
    docker build -t "${backend_image}:${tag}" -f "$PROJECT_ROOT/backend/dotnet/Dockerfile" "$PROJECT_ROOT/backend/dotnet"
    
    # Build frontend - Fernando
    log_info "Building frontend image (Fernando): ${FRONTEND_FERNANDO_IMAGE}"
    docker build -t "${FRONTEND_FERNANDO_IMAGE}" -f "$PROJECT_ROOT/frontend/portfolio-react/Dockerfile" "$PROJECT_ROOT/frontend/portfolio-react"
    
    # Build frontend - Jessica
    log_info "Building frontend image (Jessica): ${FRONTEND_JESSICA_IMAGE}"
    docker build -t "${FRONTEND_JESSICA_IMAGE}" -f "$PROJECT_ROOT/frontend/portfolio-jessica/Dockerfile" "$PROJECT_ROOT/frontend/portfolio-jessica"
    
    # Build frontend - Busy Bee
    log_info "Building frontend image (Busy Bee): ${FRONTEND_BUSYBEE_IMAGE}"
    docker build -t "${FRONTEND_BUSYBEE_IMAGE}" -f "$PROJECT_ROOT/frontend/portfolio-busybee/Dockerfile" "$PROJECT_ROOT/frontend/portfolio-busybee"
    
    # Build frontend - Executive Catering (1stopwings + future executive catering)
    log_info "Building frontend image (Executive Catering): ${FRONTEND_EXECUTIVE_CATERING_IMAGE}"
    docker build -t "${FRONTEND_EXECUTIVE_CATERING_IMAGE}" -f "$PROJECT_ROOT/frontend/portfolio-executive-catering/Dockerfile" "$PROJECT_ROOT/frontend/portfolio-executive-catering"
    
    # Build frontend - OpsBlueprint (workflow automation consulting)
    log_info "Building frontend image (OpsBlueprint): ${FRONTEND_OPSBLUEPRINT_IMAGE}"
    docker build -t "${FRONTEND_OPSBLUEPRINT_IMAGE}" -f "$PROJECT_ROOT/frontend/portfolio-opsblueprint/Dockerfile" "$PROJECT_ROOT/frontend/portfolio-opsblueprint"
    
    # Build n8n Python Helper
    log_info "Building n8n Python Helper image: ${N8N_PYTHON_HELPER_IMAGE}"
    docker build -t "${N8N_PYTHON_HELPER_IMAGE}" -f "$PROJECT_ROOT/n8n-agent/python-helper/Dockerfile" "$PROJECT_ROOT/n8n-agent/python-helper"
    
    log_success "Images built successfully"
    echo ""
    log_info "Images:"
    echo "  ${backend_image}:${tag}"
    echo "  ${FRONTEND_FERNANDO_IMAGE}"
    echo "  ${FRONTEND_JESSICA_IMAGE}"
    echo "  ${FRONTEND_BUSYBEE_IMAGE}"
    echo "  ${FRONTEND_EXECUTIVE_CATERING_IMAGE}"
    echo "  ${FRONTEND_OPSBLUEPRINT_IMAGE}"
    echo "  ${N8N_PYTHON_HELPER_IMAGE}"
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
    echo "Multi-tenant domain variables (optional):"
    echo "  DOMAIN_FERNANDO           Domain for Fernando's portfolio (e.g., fernando-vargas.com)"
    echo "  DOMAIN_JESSICA            Domain for Jessica's portfolio (e.g., jessicasutherland.me)"
    echo "  DOMAIN_BUSYBEE            Domain for BusyBee's portfolio (e.g., thebusybeeweb.com)"
    echo "  DOMAIN_1STOPWINGS         Domain for 1 Stop Wings (e.g., 1stopwings.executivecateringct.com)"
    echo "  DOMAIN_EXECUTIVE_CATERING Domain for Executive Catering (e.g., executivecateringct.fernando-vargas.com)"
    echo "  DOMAIN_ANALYTICS          Domain for Plausible Analytics (e.g., analytics.fernando-vargas.com)"
    echo "  DOMAIN_GRAFANA            Domain for Grafana Monitoring (e.g., grafana.fernando-vargas.com)"
    echo "  GRAFANA_ADMIN_PASSWORD    Grafana admin password"
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
