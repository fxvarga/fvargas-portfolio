$resp = Invoke-RestMethod -Uri 'https://n8n.localhost/rest/workflows/catering-proposal-gen' -Method GET -WebSession $session -SkipCertificateCheck
# We need cookies first
$loginBody = @{emailOrLdapLoginId='fxvarga@gmail.com'; password='KUrrego123456'} | ConvertTo-Json
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginResp = Invoke-WebRequest -Uri 'https://n8n.localhost/rest/login' -Method POST -Body $loginBody -ContentType 'application/json' -WebSession $session -SkipCertificateCheck
Write-Output "Login: $($loginResp.StatusCode)"

# Get the workflow details
$wfResp = Invoke-RestMethod -Uri 'https://n8n.localhost/rest/workflows/catering-proposal-gen' -Method GET -WebSession $session -SkipCertificateCheck
$versionId = $wfResp.data.versionId
$nodeCount = $wfResp.data.nodes.Count
Write-Output "VersionId: $versionId"
Write-Output "NodeCount: $nodeCount"
Write-Output "Active: $($wfResp.data.active)"

# Activate it
$activateBody = @{versionId=$versionId} | ConvertTo-Json
$actResp = Invoke-RestMethod -Uri 'https://n8n.localhost/rest/workflows/catering-proposal-gen/activate' -Method POST -Body $activateBody -ContentType 'application/json' -WebSession $session -SkipCertificateCheck
Write-Output "Activated: $($actResp.data.active)"
