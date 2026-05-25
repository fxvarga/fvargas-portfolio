# Infrastructure VM

Bicep IaC for provisioning an Azure VM to host the portfolio Docker workloads (mirrors the current DigitalOcean droplet).

## What Gets Created

| Resource | Purpose |
|----------|---------|
| VNet + Subnet | Network isolation (10.20.0.0/16) |
| NSG | Firewall — SSH (your IP only), HTTP/HTTPS (public) |
| Public IP (Standard, Static) | Stable IP for DNS A records |
| NIC | VM networking |
| VM (Standard_B2s_v2) | Ubuntu 24.04 LTS Docker host |
| OS Disk (64 GB Premium SSD) | Root filesystem |
| Data Disk (128 GB Premium SSD) | Mounted at /var/lib/docker |
| Key Vault | Stores Docker Hub PAT (VM reads via managed identity) |
| Log Analytics + DCR + AMA | Syslog + perf counters collection |
| Recovery Services Vault | Daily VM backup, 30-day retention |

## Prerequisites (One-Time Setup)

### 1. Create Azure App Registration for OIDC

```bash
# Create the app registration
az ad app create --display-name "gh-actions-fev-portfolio"

# Note the appId from output, then create service principal
az ad sp create --id <appId>

# Add federated credentials for GitHub Actions
az ad app federated-credential create --id <appId> --parameters '{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:fxvarga/fvargas-portfolio:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'

az ad app federated-credential create --id <appId> --parameters '{
  "name": "github-pr",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:fxvarga/fvargas-portfolio:pull_request",
  "audiences": ["api://AzureADTokenExchange"]
}'

az ad app federated-credential create --id <appId> --parameters '{
  "name": "github-env-infra-prod",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:fxvarga/fvargas-portfolio:environment:infra-prod",
  "audiences": ["api://AzureADTokenExchange"]
}'

az ad app federated-credential create --id <appId> --parameters '{
  "name": "github-env-infra-destroy",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:fxvarga/fvargas-portfolio:environment:infra-destroy",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

### 2. Assign RBAC on Resource Group

```bash
# Contributor (create/manage resources)
az role assignment create \
  --assignee <appId> \
  --role "Contributor" \
  --scope "/subscriptions/e3b68316-2eba-46e3-a343-bca4e13726f7/resourceGroups/rg-fev-fevargas"

# User Access Administrator (assign KV role to VM identity)
az role assignment create \
  --assignee <appId> \
  --role "User Access Administrator" \
  --scope "/subscriptions/e3b68316-2eba-46e3-a343-bca4e13726f7/resourceGroups/rg-fev-fevargas"
```

### 3. Create GitHub Environments

In your repo Settings → Environments:
- Create `infra-prod` with required reviewers (yourself)
- Create `infra-destroy` with required reviewers (yourself)

### 4. Set GitHub Secrets

| Secret | Value |
|--------|-------|
| `AZURE_CLIENT_ID` | App registration appId |
| `AZURE_TENANT_ID` | `721716cc-c3ac-4dd1-92b6-edfb36f0f950` |
| `AZURE_SUBSCRIPTION_ID` | `e3b68316-2eba-46e3-a343-bca4e13726f7` |
| `VM_SSH_PUBLIC_KEY` | Your ed25519 public key (e.g., `ssh-ed25519 AAAA...`) |
| `VM_SSH_PRIVATE_KEY` | Corresponding private key (for SCP from runner) |
| `DOCKERHUB_USERNAME` | `fxvarga` (already exists) |
| `DOCKERHUB_TOKEN` | Docker Hub PAT (already exists) |

## Usage

### Manual deploy (local)

```powershell
cd infrastructure-vm
.\main.ps1 -ResourceGroupName "rg-fev-fevargas" -DeploymentName "portfolio-vm-init"
```

### GitHub Actions

- **Push to main** (changes in `infrastructure-vm/`): auto-runs lint + what-if, then waits for `infra-prod` environment approval before applying.
- **PR**: runs lint + what-if, posts results as PR comment.
- **Manual dispatch**: go to Actions → "Infrastructure VM - Deploy" → Run workflow → select `plan`, `apply`, or `destroy`.

## Post-Deploy

After the first successful `apply`:

1. VM is provisioned with Docker + Docker Compose ready.
2. Cloud-init auto-logs into Docker Hub via Key Vault secret.
3. The workflow SCPs `deploy/` contents to `/opt/portfolio/` and runs `docker compose up -d`.
4. Update your DNS A records (Cloudflare) to point to the new VM public IP.

## Cost Estimate

~$90–100/mo total (VM + disks + IP + bandwidth + Log Analytics + Backup).

## Architecture

```
Internet → Public IP → NSG (22/80/443) → NIC → VM
                                                 ├── OS Disk (64GB)
                                                 ├── Data Disk (128GB → /var/lib/docker)
                                                 ├── System MI → Key Vault (docker-hub-pat)
                                                 └── AMA → Log Analytics (syslog + perf)

Recovery Services Vault → Daily backup of VM disks
```
