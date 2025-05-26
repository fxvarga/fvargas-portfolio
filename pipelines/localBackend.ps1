##.\localBackend.ps1 -ResourceGroupName "fv-lab" -AppServiceName "app-fv-portfolio-prod-eastus2"  -ProjectPath "../backend/dotnet/FV.Api"
param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,

    [Parameter(Mandatory = $true)]
    [string]$AppServiceName,

    [Parameter(Mandatory = $true)]
    [string]$ProjectPath
)
az webapp config access-restriction show --resource-group $ResourceGroupName --name $AppServiceName

Write-Host "Building .NET project..."
dotnet publish $ProjectPath -c Release -o .\publish

Write-Host "Zipping published output..."
Compress-Archive -Path .\publish\* -DestinationPath .\publish.zip -Force

Write-Host "ZipDeploy to Azure App Service..."
az webapp deployment source config-zip `
  --resource-group $ResourceGroupName `
  --name $AppServiceName `
  --src .\publish.zip

Write-Host "Deployment complete."