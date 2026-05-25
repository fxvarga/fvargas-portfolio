# infrastructure-vm deployment script
# Usage: .\main.ps1 -ResourceGroupName "rg-fev-fevargas" -DeploymentName "portfolio-vm"
# Requires: az login, Contributor + User Access Administrator on the target RG

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,

    [Parameter(Mandatory=$true)]
    [string]$DeploymentName,

    [Parameter(Mandatory=$false)]
    [string]$SshPublicKeyPath = "$env:USERPROFILE\.ssh\id_ed25519.pub"
)

$TemplateFile = ".\main.bicep"
$ParameterFile = ".\main.parameters.bicepparam"

# Set SSH public key as environment variable for bicepparam
$env:VM_SSH_PUBLIC_KEY = Get-Content $SshPublicKeyPath -Raw
$env:VM_SSH_PUBLIC_KEY = $env:VM_SSH_PUBLIC_KEY.Trim()

Write-Host "Deploying VM infrastructure to resource group: $ResourceGroupName"
Write-Host "Using SSH key from: $SshPublicKeyPath"

az deployment group create `
    --name $DeploymentName `
    --resource-group $ResourceGroupName `
    --template-file $TemplateFile `
    --parameters $ParameterFile `
    --query "properties.outputs" `
    --output table

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDeployment complete. Outputs above show VM IP and SSH command."
    Write-Host "Next steps:"
    Write-Host "  1. Upload Docker Hub PAT to Key Vault:"
    Write-Host "     az keyvault secret set --vault-name <kvName> --name docker-hub-pat --value <your-pat>"
    Write-Host "  2. Tag the Key Vault name on the VM (for cloud-init auto-login):"
    Write-Host "     az vm update -g $ResourceGroupName -n <vmName> --set tags.keyVaultName=<kvName>"
    Write-Host "  3. SCP your docker-compose.yml + Caddyfile to /opt/portfolio/"
    Write-Host "  4. SSH in and run: cd /opt/portfolio && docker compose pull && docker compose up -d"
} else {
    Write-Host "Deployment failed. Check errors above." -ForegroundColor Red
}
