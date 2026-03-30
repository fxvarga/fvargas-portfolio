# ============================================
# Portfolio Release Script (PowerShell)
# Builds locally, pushes to Docker Hub, deploys to DigitalOcean
# ============================================

param(
    [Parameter(Position = 0)]
    [string]$Command,

    [Alias("Tag")]
    [string]$ImageTag = "latest",

    [Parameter(Position = 1, ValueFromRemainingArguments)]
    [string[]]$ExtraArgs
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$EnvFile = Join-Path $ScriptDir ".env"

# ============================================
# Logging Functions
# ============================================
function Log-Info    { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Log-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Log-Warn    { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Log-Error   { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Helper: check last external command exit code
function Assert-ExitCode {
    param([string]$Action = "Command")
    if ($LASTEXITCODE -ne 0) {
        Log-Error "$Action failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
}

# ============================================
# Load Environment Variables
# ============================================
function Load-Env {
    if (-not (Test-Path $EnvFile)) {
        Log-Error ".env file not found at $EnvFile"
        Log-Info "Copy .env.example to .env and fill in your values:"
        Log-Info "  Copy-Item `"$ScriptDir\.env.example`" `"$EnvFile`""
        exit 1
    }

    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        # Skip comments and blank lines
        if ($line -and -not $line.StartsWith("#")) {
            $eqIndex = $line.IndexOf("=")
            if ($eqIndex -gt 0) {
                $key = $line.Substring(0, $eqIndex).Trim()
                $value = $line.Substring($eqIndex + 1).Trim()
                Set-Variable -Name $key -Value $value -Scope Script
            }
        }
    }

    Log-Success "Loaded environment from $EnvFile"
}

# ============================================
# Validate Required Variables
# ============================================
function Validate-Env {
    $missing = @()

    # Always required
    if ([string]::IsNullOrEmpty($script:CMS_ADMIN_PASSWORD)) { $missing += "CMS_ADMIN_PASSWORD" }
    if ([string]::IsNullOrEmpty($script:JWT_SECRET_KEY))      { $missing += "JWT_SECRET_KEY" }

    # For new droplet
    if ([string]::IsNullOrEmpty($script:DROPLET_IP)) {
        if ([string]::IsNullOrEmpty($script:DO_API_TOKEN))            { $missing += "DO_API_TOKEN" }
        if ([string]::IsNullOrEmpty($script:DO_SSH_KEY_FINGERPRINT))  { $missing += "DO_SSH_KEY_FINGERPRINT" }
    }

    if ($missing.Count -gt 0) {
        Log-Error "Missing required environment variables:"
        foreach ($var in $missing) {
            Write-Host "  - $var"
        }
        exit 1
    }

    Log-Success "Environment variables validated"
}

# ============================================
# Validate Docker Registry Variables
# ============================================
function Validate-Registry {
    if ([string]::IsNullOrEmpty($script:DOCKER_USERNAME)) {
        Log-Error "DOCKER_USERNAME not set in .env"
        Log-Info "Set your Docker Hub username and run: docker login"
        exit 1
    }

    # Check if logged into Docker
    $dockerInfo = docker info 2>&1 | Out-String
    if ($dockerInfo -notmatch "Username") {
        Log-Warn "You may not be logged into Docker Hub"
        Log-Info "Run: docker login"
    }
}

# ============================================
# Frontend Image Names
# ============================================
function Get-FrontendImages {
    param([string]$Tag = "latest")

    $fernandoName = if ($script:IMAGE_FRONTEND_FERNANDO)          { $script:IMAGE_FRONTEND_FERNANDO }          else { "portfolio-frontend-fernando" }
    $jessicaName  = if ($script:IMAGE_FRONTEND_JESSICA)           { $script:IMAGE_FRONTEND_JESSICA }           else { "portfolio-frontend-jessica" }
    $busybeeName  = if ($script:IMAGE_FRONTEND_BUSYBEE)           { $script:IMAGE_FRONTEND_BUSYBEE }           else { "portfolio-frontend-busybee" }
    $execCatName  = if ($script:IMAGE_FRONTEND_EXECUTIVE_CATERING){ $script:IMAGE_FRONTEND_EXECUTIVE_CATERING }else { "portfolio-frontend-executive-catering" }
    $opsblueprintName = if ($script:IMAGE_FRONTEND_OPSBLUEPRINT) { $script:IMAGE_FRONTEND_OPSBLUEPRINT } else { "portfolio-frontend-opsblueprint" }
    $n8nHelperName = if ($script:IMAGE_N8N_PYTHON_HELPER)         { $script:IMAGE_N8N_PYTHON_HELPER }          else { "portfolio-n8n-python-helper" }
    $discordBotName = if ($script:IMAGE_DISCORD_BOT)              { $script:IMAGE_DISCORD_BOT }               else { "portfolio-discord-bot" }

    $script:FRONTEND_FERNANDO_IMAGE          = "$($script:DOCKER_USERNAME)/${fernandoName}:${Tag}"
    $script:FRONTEND_JESSICA_IMAGE           = "$($script:DOCKER_USERNAME)/${jessicaName}:${Tag}"
    $script:FRONTEND_BUSYBEE_IMAGE           = "$($script:DOCKER_USERNAME)/${busybeeName}:${Tag}"
    $script:FRONTEND_EXECUTIVE_CATERING_IMAGE = "$($script:DOCKER_USERNAME)/${execCatName}:${Tag}"
    $script:FRONTEND_OPSBLUEPRINT_IMAGE      = "$($script:DOCKER_USERNAME)/${opsblueprintName}:${Tag}"
    $script:N8N_PYTHON_HELPER_IMAGE          = "$($script:DOCKER_USERNAME)/${n8nHelperName}:${Tag}"
    $script:DISCORD_BOT_IMAGE                = "$($script:DOCKER_USERNAME)/${discordBotName}:${Tag}"
}

# ============================================
# Create New Droplet
# ============================================
function New-Droplet {
    Log-Info "Creating new DigitalOcean droplet..."

    $dropletName = if ($script:DROPLET_NAME)  { $script:DROPLET_NAME }  else { "portfolio" }
    $region      = if ($script:DROPLET_REGION) { $script:DROPLET_REGION } else { "nyc1" }
    $size        = if ($script:DROPLET_SIZE)   { $script:DROPLET_SIZE }   else { "s-1vcpu-2gb" }
    $image       = if ($script:DROPLET_IMAGE)  { $script:DROPLET_IMAGE }  else { "ubuntu-24-04-x64" }

    $body = @{
        name      = $dropletName
        region    = $region
        size      = $size
        image     = $image
        ssh_keys  = @($script:DO_SSH_KEY_FINGERPRINT)
        backups   = $false
        ipv6      = $false
        monitoring = $true
        tags      = @("portfolio", "production")
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $($script:DO_API_TOKEN)"
        "Content-Type"  = "application/json"
    }

    try {
        $response = Invoke-RestMethod -Uri "https://api.digitalocean.com/v2/droplets" `
            -Method Post -Headers $headers -Body $body
    }
    catch {
        Log-Error "Failed to create droplet: $_"
        exit 1
    }

    $dropletId = $response.droplet.id
    if (-not $dropletId) {
        Log-Error "Failed to create droplet - no ID returned"
        Write-Host ($response | ConvertTo-Json -Depth 5)
        exit 1
    }

    Log-Success "Droplet created with ID: $dropletId"

    # Wait for droplet to be ready and get IP
    Log-Info "Waiting for droplet to be ready..."
    $maxAttempts = 60

    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        Start-Sleep -Seconds 5

        try {
            $statusResponse = Invoke-RestMethod -Uri "https://api.digitalocean.com/v2/droplets/$dropletId" `
                -Method Get -Headers @{ "Authorization" = "Bearer $($script:DO_API_TOKEN)" }
        }
        catch {
            Write-Host -NoNewline "."
            continue
        }

        $status = $statusResponse.droplet.status
        if ($status -eq "active") {
            $script:DROPLET_IP = ($statusResponse.droplet.networks.v4 | Where-Object { $_.type -eq "public" }).ip_address
            Log-Success "Droplet is ready at IP: $($script:DROPLET_IP)"

            # Save IP to .env for future deployments
            $envContent = Get-Content $EnvFile -Raw
            if ($envContent -match "(?m)^DROPLET_IP=") {
                $envContent = $envContent -replace "(?m)^DROPLET_IP=.*", "DROPLET_IP=$($script:DROPLET_IP)"
                Set-Content -Path $EnvFile -Value $envContent -NoNewline
            }
            else {
                Add-Content -Path $EnvFile -Value "DROPLET_IP=$($script:DROPLET_IP)"
            }

            return
        }

        Write-Host -NoNewline "."
    }

    Write-Host ""
    Log-Error "Timeout waiting for droplet to be ready"
    exit 1
}

# ============================================
# Setup Server (first-time setup)
# ============================================
function Setup-Server {
    Log-Info "Setting up server at $($script:DROPLET_IP)..."

    # Wait for SSH to be available
    Log-Info "Waiting for SSH to be available..."
    $maxAttempts = 30

    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        $result = ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "root@$($script:DROPLET_IP)" "echo 'SSH ready'" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            break
        }
        Start-Sleep -Seconds 5
        Write-Host -NoNewline "."
    }

    if ($attempt -gt $maxAttempts) {
        Write-Host ""
        Log-Error "Could not connect to server via SSH"
        exit 1
    }

    Log-Info "Installing Docker and dependencies..."

    $setupScript = @'
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
'@

    ($setupScript -replace "`r","") | ssh -o StrictHostKeyChecking=no "root@$($script:DROPLET_IP)" "bash -s"
    Assert-ExitCode "Server setup"

    Log-Success "Server setup complete"
}

# ============================================
# Build and Push Images Locally
# ============================================
function Build-AndPush {
    param([string]$Tag = "latest")

    Validate-Registry

    $backendName  = if ($script:IMAGE_BACKEND) { $script:IMAGE_BACKEND } else { "portfolio-backend" }
    $backendImage = "$($script:DOCKER_USERNAME)/${backendName}"

    Get-FrontendImages -Tag $Tag

    Log-Info "Building images locally..."

    # Build backend
    Log-Info "Building backend image: ${backendImage}:${Tag}"
    docker build -t "${backendImage}:${Tag}" -f "$ProjectRoot/backend/dotnet/Dockerfile" "$ProjectRoot/backend/dotnet"
    Assert-ExitCode "Backend build"

    # Build frontend - Fernando (main site + admin) — uses repo root for pnpm workspace
    Log-Info "Building frontend image (Fernando): $($script:FRONTEND_FERNANDO_IMAGE)"
    docker build -t "$($script:FRONTEND_FERNANDO_IMAGE)" -f "$ProjectRoot/frontend/portfolio-react/Dockerfile" "$ProjectRoot"
    Assert-ExitCode "Frontend Fernando build"

    # Build frontend - Jessica (photographer) — uses repo root for pnpm workspace
    Log-Info "Building frontend image (Jessica): $($script:FRONTEND_JESSICA_IMAGE)"
    docker build -t "$($script:FRONTEND_JESSICA_IMAGE)" -f "$ProjectRoot/frontend/portfolio-jessica/Dockerfile" "$ProjectRoot"
    Assert-ExitCode "Frontend Jessica build"

    # Build frontend - Busy Bee (marketing agency) — uses repo root for pnpm workspace
    Log-Info "Building frontend image (Busy Bee): $($script:FRONTEND_BUSYBEE_IMAGE)"
    docker build -t "$($script:FRONTEND_BUSYBEE_IMAGE)" -f "$ProjectRoot/frontend/portfolio-busybee/Dockerfile" "$ProjectRoot"
    Assert-ExitCode "Frontend BusyBee build"

    # Build frontend - Executive Catering (1stopwings + future executive catering) — no workspace deps, uses own dir
    Log-Info "Building frontend image (Executive Catering): $($script:FRONTEND_EXECUTIVE_CATERING_IMAGE)"
    docker build -t "$($script:FRONTEND_EXECUTIVE_CATERING_IMAGE)" -f "$ProjectRoot/frontend/portfolio-executive-catering/Dockerfile" "$ProjectRoot/frontend/portfolio-executive-catering"
    Assert-ExitCode "Frontend Executive Catering build"

    # Build frontend - OpsBlueprint (workflow automation consulting) — uses repo root for pnpm workspace
    Log-Info "Building frontend image (OpsBlueprint): $($script:FRONTEND_OPSBLUEPRINT_IMAGE)"
    docker build -t "$($script:FRONTEND_OPSBLUEPRINT_IMAGE)" -f "$ProjectRoot/frontend/portfolio-opsblueprint/Dockerfile" "$ProjectRoot"
    Assert-ExitCode "Frontend OpsBlueprint build"

    # Build n8n Python Helper
    Log-Info "Building n8n Python Helper image: $($script:N8N_PYTHON_HELPER_IMAGE)"
    docker build -t "$($script:N8N_PYTHON_HELPER_IMAGE)" -f "$ProjectRoot/n8n-agent/python-helper/Dockerfile" "$ProjectRoot/n8n-agent/python-helper"
    Assert-ExitCode "n8n Python Helper build"

    # Build Discord Bot
    Log-Info "Building Discord Bot image: $($script:DISCORD_BOT_IMAGE)"
    docker build -t "$($script:DISCORD_BOT_IMAGE)" -f "$ProjectRoot/discord-bot/Dockerfile" "$ProjectRoot/discord-bot"
    Assert-ExitCode "Discord Bot build"

    Log-Success "Images built successfully"

    # Push to registry
    Log-Info "Pushing images to Docker Hub..."

    docker push "${backendImage}:${Tag}"
    Assert-ExitCode "Backend push"
    docker push "$($script:FRONTEND_FERNANDO_IMAGE)"
    Assert-ExitCode "Frontend Fernando push"
    docker push "$($script:FRONTEND_JESSICA_IMAGE)"
    Assert-ExitCode "Frontend Jessica push"
    docker push "$($script:FRONTEND_BUSYBEE_IMAGE)"
    Assert-ExitCode "Frontend BusyBee push"
    docker push "$($script:FRONTEND_EXECUTIVE_CATERING_IMAGE)"
    Assert-ExitCode "Frontend Executive Catering push"
    docker push "$($script:FRONTEND_OPSBLUEPRINT_IMAGE)"
    Assert-ExitCode "Frontend OpsBlueprint push"
    docker push "$($script:N8N_PYTHON_HELPER_IMAGE)"
    Assert-ExitCode "n8n Python Helper push"
    docker push "$($script:DISCORD_BOT_IMAGE)"
    Assert-ExitCode "Discord Bot push"

    Log-Success "Images pushed to Docker Hub"

    # Export for use in deploy
    $script:BACKEND_IMAGE = "${backendImage}:${Tag}"
}

# ============================================
# Deploy to Server (using pre-built images)
# ============================================
function Deploy-ToServer {
    param([string]$Tag = "latest")

    $backendName  = if ($script:IMAGE_BACKEND) { $script:IMAGE_BACKEND } else { "portfolio-backend" }
    $backendImage = "$($script:DOCKER_USERNAME)/${backendName}:${Tag}"

    Get-FrontendImages -Tag $Tag

    $domainFernando          = if ($script:DOMAIN_FERNANDO)          { $script:DOMAIN_FERNANDO }          else { "" }
    $domainJessica           = if ($script:DOMAIN_JESSICA)           { $script:DOMAIN_JESSICA }           else { "" }
    $domainBusybee           = if ($script:DOMAIN_BUSYBEE)           { $script:DOMAIN_BUSYBEE }           else { "" }
    $domain1stopwings        = if ($script:DOMAIN_1STOPWINGS)        { $script:DOMAIN_1STOPWINGS }        else { "" }
    $domainExecutiveCatering = if ($script:DOMAIN_EXECUTIVE_CATERING){ $script:DOMAIN_EXECUTIVE_CATERING }else { "" }
    $domainOpsblueprint      = if ($script:DOMAIN_OPSBLUEPRINT)      { $script:DOMAIN_OPSBLUEPRINT }      else { "" }
    $domainAnalytics         = if ($script:DOMAIN_ANALYTICS)          { $script:DOMAIN_ANALYTICS }          else { "" }
    $domainGrafana           = if ($script:DOMAIN_GRAFANA)            { $script:DOMAIN_GRAFANA }            else { "" }
    $domainN8n               = if ($script:DOMAIN_N8N)                { $script:DOMAIN_N8N }                else { "" }
    $domainBot               = if ($script:DOMAIN_BOT)                { $script:DOMAIN_BOT }                else { "" }

    $jwtSecretKey      = $script:JWT_SECRET_KEY
    $cmsAdminPassword  = $script:CMS_ADMIN_PASSWORD
    $esUrl             = if ($script:ELASTICSEARCH_URL)                 { $script:ELASTICSEARCH_URL }                 else { "http://elasticsearch:9200" }
    $aoaiEndpoint      = if ($script:AZURE_OPENAI_ENDPOINT)            { $script:AZURE_OPENAI_ENDPOINT }            else { "" }
    $aoaiKey           = if ($script:AZURE_OPENAI_API_KEY)             { $script:AZURE_OPENAI_API_KEY }             else { "" }
    $aoaiEmbedding     = if ($script:AZURE_OPENAI_EMBEDDING_DEPLOYMENT){ $script:AZURE_OPENAI_EMBEDDING_DEPLOYMENT }else { "text-embedding-ada-002" }

    # Plausible config
    $plausibleBaseUrl    = if ($script:PLAUSIBLE_BASE_URL)              { $script:PLAUSIBLE_BASE_URL }              else { "" }
    $plausibleSecretKey  = if ($script:PLAUSIBLE_SECRET_KEY_BASE)       { $script:PLAUSIBLE_SECRET_KEY_BASE }       else { "" }
    $plausibleDisableReg = if ($script:PLAUSIBLE_DISABLE_REGISTRATION)  { $script:PLAUSIBLE_DISABLE_REGISTRATION }  else { "true" }

    # Grafana config
    $grafanaAdminPassword = if ($script:GRAFANA_ADMIN_PASSWORD)         { $script:GRAFANA_ADMIN_PASSWORD }          else { "admin" }

    # n8n config
    $n8nEncryptionKey    = if ($script:N8N_ENCRYPTION_KEY)              { $script:N8N_ENCRYPTION_KEY }              else { "" }
    $n8nPostgresUser     = if ($script:N8N_POSTGRES_USER)              { $script:N8N_POSTGRES_USER }              else { "n8n" }
    $n8nPostgresPassword = if ($script:N8N_POSTGRES_PASSWORD)          { $script:N8N_POSTGRES_PASSWORD }          else { "n8n" }
    $n8nPostgresDb       = if ($script:N8N_POSTGRES_DB)                { $script:N8N_POSTGRES_DB }                else { "n8n" }
    $n8nPythonHelperImage = $script:N8N_PYTHON_HELPER_IMAGE

    # n8n workflow env vars (MS Graph, SharePoint, Azure OpenAI)
    $msGraphTenantId             = if ($script:MS_GRAPH_TENANT_ID)              { $script:MS_GRAPH_TENANT_ID }              else { "" }
    $msGraphClientId             = if ($script:MS_GRAPH_CLIENT_ID)              { $script:MS_GRAPH_CLIENT_ID }              else { "" }
    $msGraphClientSecret         = if ($script:MS_GRAPH_CLIENT_SECRET)          { $script:MS_GRAPH_CLIENT_SECRET }          else { "" }
    $sharepointSiteId            = if ($script:SHAREPOINT_SITE_ID)              { $script:SHAREPOINT_SITE_ID }              else { "" }
    $sharepointDriveId           = if ($script:SHAREPOINT_DRIVE_ID)             { $script:SHAREPOINT_DRIVE_ID }             else { "" }
    $sharepointLeadsFolderId     = if ($script:SHAREPOINT_LEADS_FOLDER_ID)      { $script:SHAREPOINT_LEADS_FOLDER_ID }      else { "" }
    $sharepointProposalsFolderId = if ($script:SHAREPOINT_PROPOSALS_FOLDER_ID)  { $script:SHAREPOINT_PROPOSALS_FOLDER_ID }  else { "" }
    $leadsTrackerFileId          = if ($script:LEADS_TRACKER_FILE_ID)           { $script:LEADS_TRACKER_FILE_ID }           else { "" }
    $sharepointKbFolderId        = if ($script:SHAREPOINT_KB_FOLDER_ID)         { $script:SHAREPOINT_KB_FOLDER_ID }         else { "" }
    $sharepointKbFileId          = if ($script:SHAREPOINT_KB_FILE_ID)           { $script:SHAREPOINT_KB_FILE_ID }           else { "" }
    $mailUserUpn                 = if ($script:MAIL_USER_UPN)                   { $script:MAIL_USER_UPN }                   else { "" }
    $azureOpenaiEndpoint         = if ($script:AZURE_OPENAI_ENDPOINT)           { $script:AZURE_OPENAI_ENDPOINT }           else { "" }
    $azureOpenaiApiKey           = if ($script:AZURE_OPENAI_API_KEY)            { $script:AZURE_OPENAI_API_KEY }            else { "" }
    $azureOpenaiChatDeployment   = if ($script:AZURE_OPENAI_CHAT_DEPLOYMENT)    { $script:AZURE_OPENAI_CHAT_DEPLOYMENT }    else { "" }
    $azureOpenaiApiVersion       = if ($script:AZURE_OPENAI_API_VERSION)        { $script:AZURE_OPENAI_API_VERSION }        else { "" }
    $emailCategoriesFileId       = if ($script:EMAIL_CATEGORIES_FILE_ID)       { $script:EMAIL_CATEGORIES_FILE_ID }       else { "" }
    $emailCategoriesTableName    = if ($script:EMAIL_CATEGORIES_TABLE_NAME)    { $script:EMAIL_CATEGORIES_TABLE_NAME }    else { "Categories" }

    # OpsBlueprint-specific SharePoint vars
    $obSharepointLeadsFolderId     = if ($script:OB_SHAREPOINT_LEADS_FOLDER_ID)     { $script:OB_SHAREPOINT_LEADS_FOLDER_ID }     else { "" }
    $obSharepointProposalsFolderId = if ($script:OB_SHAREPOINT_PROPOSALS_FOLDER_ID) { $script:OB_SHAREPOINT_PROPOSALS_FOLDER_ID } else { "" }
    $obLeadsTrackerFileId          = if ($script:OB_LEADS_TRACKER_FILE_ID)          { $script:OB_LEADS_TRACKER_FILE_ID }          else { "" }
    $obEmailCategoriesFileId       = if ($script:OB_EMAIL_CATEGORIES_FILE_ID)       { $script:OB_EMAIL_CATEGORIES_FILE_ID }       else { "" }
    $obEmailCategoriesTableName    = if ($script:OB_EMAIL_CATEGORIES_TABLE_NAME)    { $script:OB_EMAIL_CATEGORIES_TABLE_NAME }    else { "OBCategories" }
    $obSharepointKbFileId          = if ($script:OB_SHAREPOINT_KB_FILE_ID)          { $script:OB_SHAREPOINT_KB_FILE_ID }          else { "" }

    # Twilio SMS vars (for lead-intake workflows)
    $twilioAccountSid    = if ($script:TWILIO_ACCOUNT_SID)    { $script:TWILIO_ACCOUNT_SID }    else { "" }
    $twilioApiKeySid     = if ($script:TWILIO_API_KEY_SID)    { $script:TWILIO_API_KEY_SID }    else { "" }
    $twilioApiKeySecret  = if ($script:TWILIO_API_KEY_SECRET) { $script:TWILIO_API_KEY_SECRET } else { "" }
    $twilioPhoneNumber   = if ($script:TWILIO_PHONE_NUMBER)   { $script:TWILIO_PHONE_NUMBER }   else { "" }

    # Discord Bot vars
    $discordBotToken     = if ($script:DISCORD_BOT_TOKEN)    { $script:DISCORD_BOT_TOKEN }    else { "" }
    $discordGuildId      = if ($script:DISCORD_GUILD_ID)     { $script:DISCORD_GUILD_ID }     else { "" }
    $discordCmsRoleName  = if ($script:DISCORD_CMS_ROLE_NAME){ $script:DISCORD_CMS_ROLE_NAME }else { "CMS Admin" }

    $fernandoImage          = $script:FRONTEND_FERNANDO_IMAGE
    $jessicaImage           = $script:FRONTEND_JESSICA_IMAGE
    $busybeeImage           = $script:FRONTEND_BUSYBEE_IMAGE
    $executiveCateringImage = $script:FRONTEND_EXECUTIVE_CATERING_IMAGE
    $opsblueprintImage      = $script:FRONTEND_OPSBLUEPRINT_IMAGE
    $discordBotImage        = $script:DISCORD_BOT_IMAGE

    Log-Info "Deploying to $($script:DROPLET_IP)..."
    Log-Info "Using images:"
    Log-Info "  Backend:          $backendImage"
    Log-Info "  Frontend Fernando: $fernandoImage"
    Log-Info "  Frontend Jessica:  $jessicaImage"
    Log-Info "  Frontend BusyBee:  $busybeeImage"
    Log-Info "  Frontend Executive Catering: $executiveCateringImage"
    Log-Info "  Frontend OpsBlueprint: $opsblueprintImage"
    Log-Info "  n8n Python Helper: $n8nPythonHelperImage"
    Log-Info "  Discord Bot:   $discordBotImage"

    $domainFernandoDisplay          = if ($domainFernando)          { $domainFernando }          else { "localhost" }
    $domainJessicaDisplay           = if ($domainJessica)           { $domainJessica }           else { "jessica.localhost" }
    $domainBusybeeDisplay           = if ($domainBusybee)           { $domainBusybee }           else { "busybee.localhost" }
    $domain1stopwingsDisplay        = if ($domain1stopwings)        { $domain1stopwings }        else { "1stopwings.localhost" }
    $domainExecutiveCateringDisplay = if ($domainExecutiveCatering) { $domainExecutiveCatering } else { "executivecatering.localhost" }
    $domainOpsblueprintDisplay      = if ($domainOpsblueprint)      { $domainOpsblueprint }      else { "opsblueprint.localhost" }
    $domainAnalyticsDisplay         = if ($domainAnalytics)         { $domainAnalytics }         else { "analytics.localhost" }
    $domainGrafanaDisplay           = if ($domainGrafana)           { $domainGrafana }           else { "grafana.localhost" }
    $domainN8nDisplay               = if ($domainN8n)               { $domainN8n }               else { "n8n.localhost" }
    $domainBotDisplay               = if ($domainBot)               { $domainBot }               else { "bot.localhost" }

    Log-Info "Domains:"
    Log-Info "  Fernando: $domainFernandoDisplay"
    Log-Info "  Jessica:  $domainJessicaDisplay"
    Log-Info "  BusyBee:  $domainBusybeeDisplay"
    Log-Info "  1StopWings: $domain1stopwingsDisplay"
    Log-Info "  Executive Catering: $domainExecutiveCateringDisplay"
    Log-Info "  OpsBlueprint: $domainOpsblueprintDisplay"
    Log-Info "  Analytics: $domainAnalyticsDisplay"
    Log-Info "  Grafana:   $domainGrafanaDisplay"
    Log-Info "  n8n:       $domainN8nDisplay"
    Log-Info "  Bot:       $domainBotDisplay"

    # Build the docker-compose.yml content
    # NOTE: This uses single-quoted YAML inside the heredoc on the remote server.
    # Variables like backend_image are expanded locally before sending.
    $composeContent = @"
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
    image: $backendImage
    container_name: portfolio-backend
    volumes:
      - cms-data:/app/data
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ASPNETCORE_URLS=http://+:5000
      - CMS_DB_PATH=/app/data/cms.db
      - JWT_SECRET_KEY=$jwtSecretKey
      - CMS_ADMIN_PASSWORD=$cmsAdminPassword
      - ELASTICSEARCH_URL=$esUrl
      - AZURE_OPENAI_ENDPOINT=$aoaiEndpoint
      - AZURE_OPENAI_API_KEY=$aoaiKey
      - AZURE_OPENAI_EMBEDDING_DEPLOYMENT=$aoaiEmbedding
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
    image: $fernandoImage
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
    image: $jessicaImage
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
    image: $busybeeImage
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
    image: $executiveCateringImage
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
    image: $opsblueprintImage
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
      - BASE_URL=$plausibleBaseUrl
      - SECRET_KEY_BASE=$plausibleSecretKey
      - HTTP_PORT=8000
      - DISABLE_REGISTRATION=$plausibleDisableReg
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
      - GF_SECURITY_ADMIN_PASSWORD=$grafanaAdminPassword
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=https://$domainGrafanaDisplay
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
      - POSTGRES_USER=$n8nPostgresUser
      - POSTGRES_PASSWORD=$n8nPostgresPassword
      - POSTGRES_DB=$n8nPostgresDb
    volumes:
      - n8n-db-data:/var/lib/postgresql/data
    networks:
      - portfolio-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $n8nPostgresUser"]
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
      - DB_POSTGRESDB_DATABASE=$n8nPostgresDb
      - DB_POSTGRESDB_USER=$n8nPostgresUser
      - DB_POSTGRESDB_PASSWORD=$n8nPostgresPassword
      - N8N_ENCRYPTION_KEY=$n8nEncryptionKey
      - EXECUTIONS_MODE=regular
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_SECURE_COOKIE=false
      - N8N_BLOCK_ENV_ACCESS_IN_NODE=false
      - WEBHOOK_URL=https://$domainN8nDisplay/
      - N8N_EDITOR_BASE_URL=https://$domainN8nDisplay/
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_PERSONALIZATION_ENABLED=false
      - N8N_INSIGHTS_ENABLED=false
      - N8N_LOG_LEVEL=info
      - GENERIC_TIMEZONE=America/New_York
      # Workflow env vars (MS Graph, SharePoint, Azure OpenAI)
      - MS_GRAPH_TENANT_ID=$msGraphTenantId
      - MS_GRAPH_CLIENT_ID=$msGraphClientId
      - MS_GRAPH_CLIENT_SECRET=$msGraphClientSecret
      - SHAREPOINT_SITE_ID=$sharepointSiteId
      - SHAREPOINT_DRIVE_ID=$sharepointDriveId
      - SHAREPOINT_LEADS_FOLDER_ID=$sharepointLeadsFolderId
      - SHAREPOINT_PROPOSALS_FOLDER_ID=$sharepointProposalsFolderId
      - LEADS_TRACKER_FILE_ID=$leadsTrackerFileId
      - SHAREPOINT_KB_FOLDER_ID=$sharepointKbFolderId
      - SHAREPOINT_KB_FILE_ID=$sharepointKbFileId
      - MAIL_USER_UPN=$mailUserUpn
      - AZURE_OPENAI_ENDPOINT=$azureOpenaiEndpoint
      - AZURE_OPENAI_API_KEY=$azureOpenaiApiKey
      - AZURE_OPENAI_CHAT_DEPLOYMENT=$azureOpenaiChatDeployment
      - AZURE_OPENAI_API_VERSION=$azureOpenaiApiVersion
      - EMAIL_CATEGORIES_FILE_ID=$emailCategoriesFileId
      - EMAIL_CATEGORIES_TABLE_NAME=$emailCategoriesTableName
      # OpsBlueprint-specific SharePoint vars
      - OB_SHAREPOINT_LEADS_FOLDER_ID=$obSharepointLeadsFolderId
      - OB_SHAREPOINT_PROPOSALS_FOLDER_ID=$obSharepointProposalsFolderId
      - OB_LEADS_TRACKER_FILE_ID=$obLeadsTrackerFileId
      - OB_EMAIL_CATEGORIES_FILE_ID=$obEmailCategoriesFileId
      - OB_EMAIL_CATEGORIES_TABLE_NAME=$obEmailCategoriesTableName
      - OB_SHAREPOINT_KB_FILE_ID=$obSharepointKbFileId
      # Twilio SMS vars (for lead-intake workflows)
      - TWILIO_ACCOUNT_SID=$twilioAccountSid
      - TWILIO_API_KEY_SID=$twilioApiKeySid
      - TWILIO_API_KEY_SECRET=$twilioApiKeySecret
      - TWILIO_PHONE_NUMBER=$twilioPhoneNumber
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
    image: $n8nPythonHelperImage
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

  discord-bot:
    image: $discordBotImage
    container_name: portfolio-discord-bot
    environment:
      - DISCORD_BOT_TOKEN=$discordBotToken
      - DISCORD_GUILD_ID=$discordGuildId
      - DISCORD_CMS_ROLE_NAME=$discordCmsRoleName
      - CMS_API_URL=http://backend:5000/graphql
      - CMS_ADMIN_USERNAME=admin
      - CMS_ADMIN_PASSWORD=$cmsAdminPassword
      - N8N_WEBHOOK_BASE_URL=http://n8n:5678/webhook
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - portfolio-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:3100/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

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
      - discord-bot
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
"@

    # Build the Caddyfile content
    $caddyContent = @"
# Fernando Vargas Portfolio (main site + admin)
$domainFernandoDisplay {
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

www.$domainFernandoDisplay {
    redir https://$($domainFernandoDisplay){uri} permanent
}

# Jessica Sutherland Portfolio
$domainJessicaDisplay {
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

www.$domainJessicaDisplay {
    redir https://$($domainJessicaDisplay){uri} permanent
}

# Busy Bee Marketing Agency
$domainBusybeeDisplay {
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

www.$domainBusybeeDisplay {
    redir https://$($domainBusybeeDisplay){uri} permanent
}

# 1 Stop Wings (via Executive Catering container)
$domain1stopwingsDisplay {
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
$domainExecutiveCateringDisplay {
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
$domainOpsblueprintDisplay {
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
        reverse_proxy frontend-opsblueprint:80
    }
}

# Plausible Analytics
$domainAnalyticsDisplay {
    reverse_proxy plausible:8000
}

# Grafana Monitoring
$domainGrafanaDisplay {
    reverse_proxy grafana:3000
}

# n8n Workflow Automation
$domainN8nDisplay {
    reverse_proxy n8n:5678 {
        flush_interval -1
        transport http {
            keepalive 30s
        }
    }
}

# Discord Bot health/status page
$domainBotDisplay {
    reverse_proxy discord-bot:3100
}
"@

    # Build the remote deploy script
    # The heredoc delimiters are single-quoted so bash won't interpolate.
    # All variable expansion happens in PowerShell before sending.

    $deployScript = @"
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

# Write docker-compose.yml
cat > docker-compose.yml << 'COMPOSE__EOF'
$composeContent
COMPOSE__EOF

# Write Caddyfile
cat > Caddyfile << 'CADDY__EOF'
$caddyContent
CADDY__EOF

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
"@

    ($deployScript -replace "`r","") | ssh -o StrictHostKeyChecking=no "root@$($script:DROPLET_IP)" "bash -s"
    Assert-ExitCode "Remote deployment"

    Log-Success "Deployment complete!"
    Write-Host ""
    Log-Info "Your applications are now running at:"
    if ($domainFernando) {
        Write-Host "  Fernando: https://$domainFernando"
        Write-Host "  Fernando Admin: https://$domainFernando/admin"
    }
    if ($domainJessica)           { Write-Host "  Jessica: https://$domainJessica" }
    if ($domainBusybee)           { Write-Host "  BusyBee: https://$domainBusybee" }
    if ($domain1stopwings)        { Write-Host "  1StopWings: https://$domain1stopwings" }
    if ($domainExecutiveCatering) { Write-Host "  Executive Catering: https://$domainExecutiveCatering" }
    if ($domainAnalytics)         { Write-Host "  Analytics: https://$domainAnalytics" }
    if ($domainGrafana)           { Write-Host "  Grafana: https://$domainGrafana" }
    if ($domainBot)               { Write-Host "  Discord Bot: https://$domainBot" }
    Write-Host ""
    Log-Info "Make sure your DNS is configured for all domains to point to: $($script:DROPLET_IP)"
}

# ============================================
# Full Deploy (build locally + push + deploy)
# ============================================
function Full-Deploy {
    param([string]$Tag = "latest")

    Build-AndPush -Tag $Tag
    Deploy-ToServer -Tag $Tag
}

# ============================================
# Quick Deploy (rebuild + push + restart)
# ============================================
function Quick-Deploy {
    param([string]$Tag = "latest")

    Build-AndPush -Tag $Tag

    Log-Info "Restarting containers on server..."

    $quickScript = @'
set -e
cd /opt/portfolio
docker compose pull
docker compose up -d
docker compose ps
'@

    ($quickScript -replace "`r","") | ssh -o StrictHostKeyChecking=no "root@$($script:DROPLET_IP)" "bash -s"
    Assert-ExitCode "Quick deploy"

    Log-Success "Quick deploy complete!"
}

# ============================================
# Show Status
# ============================================
function Show-Status {
    if ([string]::IsNullOrEmpty($script:DROPLET_IP)) {
        Log-Error "No DROPLET_IP configured"
        exit 1
    }

    Log-Info "Checking status of $($script:DROPLET_IP)..."

    ssh -o StrictHostKeyChecking=no "root@$($script:DROPLET_IP)" "cd /opt/portfolio && echo '' && echo '=== Container Status ===' && docker compose ps && echo '' && echo '=== Recent Logs ===' && docker compose logs --tail=20"
}

# ============================================
# Show Logs
# ============================================
function Show-Logs {
    param([string]$Service = "")

    if ([string]::IsNullOrEmpty($script:DROPLET_IP)) {
        Log-Error "No DROPLET_IP configured"
        exit 1
    }

    ssh -o StrictHostKeyChecking=no "root@$($script:DROPLET_IP)" "cd /opt/portfolio && docker compose logs -f $Service"
}

# ============================================
# Backup Database
# ============================================
function Backup-Database {
    if ([string]::IsNullOrEmpty($script:DROPLET_IP)) {
        Log-Error "No DROPLET_IP configured"
        exit 1
    }

    $timestamp  = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backup_${timestamp}.db"
    $backupDir  = Join-Path $ScriptDir "backups"

    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }

    Log-Info "Backing up database from $($script:DROPLET_IP)..."

    ssh -o StrictHostKeyChecking=no "root@$($script:DROPLET_IP)" "docker cp portfolio-backend:/app/data/cms.db /tmp/cms_backup.db"
    Assert-ExitCode "Remote database copy"

    scp -o StrictHostKeyChecking=no "root@$($script:DROPLET_IP):/tmp/cms_backup.db" "$backupDir/$backupFile"
    Assert-ExitCode "Database download"

    Log-Success "Database backed up to $backupDir/$backupFile"
}

# ============================================
# Build Only (no push)
# ============================================
function Build-Only {
    param([string]$Tag = "latest")

    $dockerUser   = if ($script:DOCKER_USERNAME) { $script:DOCKER_USERNAME } else { "local" }
    $backendName  = if ($script:IMAGE_BACKEND)   { $script:IMAGE_BACKEND }   else { "portfolio-backend" }
    $backendImage = "${dockerUser}/${backendName}"

    Get-FrontendImages -Tag $Tag

    Log-Info "Building images locally..."

    # Build backend
    Log-Info "Building backend image: ${backendImage}:${Tag}"
    docker build -t "${backendImage}:${Tag}" -f "$ProjectRoot/backend/dotnet/Dockerfile" "$ProjectRoot/backend/dotnet"
    Assert-ExitCode "Backend build"

    # Build frontend - Fernando — uses repo root for pnpm workspace
    Log-Info "Building frontend image (Fernando): $($script:FRONTEND_FERNANDO_IMAGE)"
    docker build -t "$($script:FRONTEND_FERNANDO_IMAGE)" -f "$ProjectRoot/frontend/portfolio-react/Dockerfile" "$ProjectRoot"
    Assert-ExitCode "Frontend Fernando build"

    # Build frontend - Jessica — uses repo root for pnpm workspace
    Log-Info "Building frontend image (Jessica): $($script:FRONTEND_JESSICA_IMAGE)"
    docker build -t "$($script:FRONTEND_JESSICA_IMAGE)" -f "$ProjectRoot/frontend/portfolio-jessica/Dockerfile" "$ProjectRoot"
    Assert-ExitCode "Frontend Jessica build"

    # Build frontend - Busy Bee — uses repo root for pnpm workspace
    Log-Info "Building frontend image (Busy Bee): $($script:FRONTEND_BUSYBEE_IMAGE)"
    docker build -t "$($script:FRONTEND_BUSYBEE_IMAGE)" -f "$ProjectRoot/frontend/portfolio-busybee/Dockerfile" "$ProjectRoot"
    Assert-ExitCode "Frontend BusyBee build"

    # Build frontend - Executive Catering — no workspace deps, uses own dir
    Log-Info "Building frontend image (Executive Catering): $($script:FRONTEND_EXECUTIVE_CATERING_IMAGE)"
    docker build -t "$($script:FRONTEND_EXECUTIVE_CATERING_IMAGE)" -f "$ProjectRoot/frontend/portfolio-executive-catering/Dockerfile" "$ProjectRoot/frontend/portfolio-executive-catering"
    Assert-ExitCode "Frontend Executive Catering build"

    # Build frontend - OpsBlueprint — uses repo root for pnpm workspace
    Log-Info "Building frontend image (OpsBlueprint): $($script:FRONTEND_OPSBLUEPRINT_IMAGE)"
    docker build -t "$($script:FRONTEND_OPSBLUEPRINT_IMAGE)" -f "$ProjectRoot/frontend/portfolio-opsblueprint/Dockerfile" "$ProjectRoot"
    Assert-ExitCode "Frontend OpsBlueprint build"

    # Build n8n Python Helper
    Log-Info "Building n8n Python Helper image: $($script:N8N_PYTHON_HELPER_IMAGE)"
    docker build -t "$($script:N8N_PYTHON_HELPER_IMAGE)" -f "$ProjectRoot/n8n-agent/python-helper/Dockerfile" "$ProjectRoot/n8n-agent/python-helper"
    Assert-ExitCode "n8n Python Helper build"

    # Build Discord Bot
    Log-Info "Building Discord Bot image: $($script:DISCORD_BOT_IMAGE)"
    docker build -t "$($script:DISCORD_BOT_IMAGE)" -f "$ProjectRoot/discord-bot/Dockerfile" "$ProjectRoot/discord-bot"
    Assert-ExitCode "Discord Bot build"

    Log-Success "Images built successfully"
    Write-Host ""
    Log-Info "Images:"
    Write-Host "  ${backendImage}:${Tag}"
    Write-Host "  $($script:FRONTEND_FERNANDO_IMAGE)"
    Write-Host "  $($script:FRONTEND_JESSICA_IMAGE)"
    Write-Host "  $($script:FRONTEND_BUSYBEE_IMAGE)"
    Write-Host "  $($script:FRONTEND_EXECUTIVE_CATERING_IMAGE)"
    Write-Host "  $($script:FRONTEND_OPSBLUEPRINT_IMAGE)"
    Write-Host "  $($script:N8N_PYTHON_HELPER_IMAGE)"
    Write-Host "  $($script:DISCORD_BOT_IMAGE)"
}

# ============================================
# Print Usage
# ============================================
function Show-Usage {
    $scriptName = Split-Path -Leaf $MyInvocation.ScriptName
    Write-Host "Usage: .\$scriptName <command> [options]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  new             Create new droplet and deploy"
    Write-Host "  deploy          Build locally, push to Docker Hub, deploy to server"
    Write-Host "  quick           Quick deploy (build, push, restart containers)"
    Write-Host "  build           Build images locally (no push)"
    Write-Host "  push            Build and push images to Docker Hub"
    Write-Host "  status          Show container status on server"
    Write-Host "  logs [service]  Follow container logs"
    Write-Host "  backup          Backup database from server"
    Write-Host "  setup           Setup existing server (install Docker, etc.)"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Tag <tag>      Image tag (default: latest)"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\$scriptName new                    # Create droplet and deploy"
    Write-Host "  .\$scriptName deploy                 # Build locally + push + deploy"
    Write-Host "  .\$scriptName deploy -Tag v1.0.0     # Deploy with specific tag"
    Write-Host "  .\$scriptName quick                  # Quick redeploy"
    Write-Host "  .\$scriptName build                  # Build images only"
    Write-Host "  .\$scriptName logs backend           # Follow backend logs"
    Write-Host ""
    Write-Host "Required .env variables:"
    Write-Host "  DOCKER_USERNAME           Docker Hub username"
    Write-Host "  DROPLET_IP                Server IP (or use 'new' to create)"
    Write-Host "  CMS_ADMIN_PASSWORD        Admin password"
    Write-Host "  JWT_SECRET_KEY            JWT signing key"
    Write-Host ""
    Write-Host "Multi-tenant domain variables (optional):"
    Write-Host "  DOMAIN_FERNANDO           Domain for Fernando's portfolio (e.g., fernando-vargas.com)"
    Write-Host "  DOMAIN_JESSICA            Domain for Jessica's portfolio (e.g., jessicasutherland.me)"
    Write-Host "  DOMAIN_BUSYBEE            Domain for BusyBee's portfolio (e.g., thebusybeeweb.com)"
    Write-Host "  DOMAIN_1STOPWINGS         Domain for 1 Stop Wings (e.g., 1stopwings.executivecateringct.com)"
    Write-Host "  DOMAIN_EXECUTIVE_CATERING Domain for Executive Catering (e.g., executivecateringct.fernando-vargas.com)"
    Write-Host "  DOMAIN_ANALYTICS          Domain for Plausible Analytics (e.g., analytics.fernando-vargas.com)"
    Write-Host "  DOMAIN_GRAFANA            Domain for Grafana Monitoring (e.g., grafana.fernando-vargas.com)"
    Write-Host "  GRAFANA_ADMIN_PASSWORD    Grafana admin password"
    Write-Host ""
}

# ============================================
# Main
# ============================================
switch ($Command) {
    "new" {
        Load-Env
        Validate-Env
        Validate-Registry
        New-Droplet
        Setup-Server
        Full-Deploy -Tag $ImageTag
    }
    "deploy" {
        Load-Env
        Validate-Env
        Validate-Registry
        if ([string]::IsNullOrEmpty($script:DROPLET_IP)) {
            Log-Error "DROPLET_IP not set. Use 'new' to create a droplet first."
            exit 1
        }
        Full-Deploy -Tag $ImageTag
    }
    "quick" {
        Load-Env
        Validate-Registry
        if ([string]::IsNullOrEmpty($script:DROPLET_IP)) {
            Log-Error "DROPLET_IP not set"
            exit 1
        }
        Quick-Deploy -Tag $ImageTag
    }
    "build" {
        Load-Env
        Build-Only -Tag $ImageTag
    }
    "push" {
        Load-Env
        Validate-Registry
        Build-AndPush -Tag $ImageTag
    }
    "status" {
        Load-Env
        Show-Status
    }
    "logs" {
        Load-Env
        $service = if ($ExtraArgs -and $ExtraArgs.Count -gt 0) { $ExtraArgs[0] } else { "" }
        Show-Logs -Service $service
    }
    "backup" {
        Load-Env
        Backup-Database
    }
    "setup" {
        Load-Env
        if ([string]::IsNullOrEmpty($script:DROPLET_IP)) {
            Log-Error "DROPLET_IP not set"
            exit 1
        }
        Setup-Server
    }
    default {
        Show-Usage
        if ($Command) {
            Log-Error "Unknown command: $Command"
        }
        exit 1
    }
}
