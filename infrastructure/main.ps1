# Make sure you have Azure CLI installed and are logged in via: az login
# az account set --subscription e3b68316-2eba-46e3-a343-bca4e13726f7
# .\main.ps1 -ResourceGroupName "fv-lab" -DeploymentName "helloWorld"
# Permissions required contributor
## App Configuration Data Owner or App Configuration Data Reader

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,

    [Parameter(Mandatory=$true)]
    [string]$DeploymentName
)

# Adjust paths as needed
$TemplateFile = ".\main.bicep"
$ParameterFile = ".\main.test.parameters.bicepparam"

Write-Host "Deploying Bicep template to resource group: $ResourceGroupName"

az deployment group create `
    --name $DeploymentName `
    --resource-group $ResourceGroupName `
    --template-file $TemplateFile `
    --parameters $ParameterFile

Write-Host "Deployment complete."