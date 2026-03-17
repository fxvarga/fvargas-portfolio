$loginBody = '{"emailOrLdapLoginId":"fxvarga@gmail.com","password":"KUrrego123456"}'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Disable SSL validation for localhost
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

$loginResp = Invoke-WebRequest -Uri 'https://n8n.localhost/rest/login' -Method POST -Body $loginBody -ContentType 'application/json' -WebSession $session
Write-Output "Login: $($loginResp.StatusCode)"

# Get current workflow
$wfResp = Invoke-RestMethod -Uri 'https://n8n.localhost/rest/workflows/catering-proposal-gen' -Method GET -WebSession $session
$wf = $wfResp.data

# Fix the Download KB node options - the double-nested response might be invalid
$dlNode = $wf.nodes | Where-Object { $_.name -eq 'Download Knowledge Base' }
Write-Output "Download KB node found: $($dlNode -ne $null)"
Write-Output "Current options: $(ConvertTo-Json $dlNode.parameters.options -Depth 5)"

# Update to simpler options structure
$dlNode.parameters.options = @{
    response = @{
        response = @{
            responseFormat = "text"
        }
    }
    timeout = 15000
}

# Get the version ID for the update
$versionId = $wf.versionId
Write-Output "VersionId: $versionId"

# Convert back to JSON and update
$updateBody = $wf | ConvertTo-Json -Depth 20
$updateResp = Invoke-RestMethod -Uri 'https://n8n.localhost/rest/workflows/catering-proposal-gen' -Method PATCH -Body $updateBody -ContentType 'application/json' -WebSession $session
Write-Output "Updated: $($updateResp.data.active)"
Write-Output "New versionId: $($updateResp.data.versionId)"
