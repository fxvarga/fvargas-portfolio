# Debug workflow script - login, get workflow, and test webhook

# Step 1: Login and get cookie
$loginBody = @{
    emailOrLdapLoginId = "fxvarga@gmail.com"
    password = "KUrrego123456"
} | ConvertTo-Json

$loginResp = Invoke-WebRequest -Uri "https://n8n.localhost/rest/login" `
    -Method POST -ContentType "application/json" -Body $loginBody `
    -SkipCertificateCheck -SessionVariable n8nSession

Write-Host "=== LOGIN STATUS: $($loginResp.StatusCode) ==="

# Step 2: Get the proposal generator workflow
$wfResp = Invoke-WebRequest -Uri "https://n8n.localhost/rest/workflows/catering-proposal-gen" `
    -Method GET -SkipCertificateCheck -WebSession $n8nSession

$wf = $wfResp.Content | ConvertFrom-Json
Write-Host "`n=== WORKFLOW: $($wf.data.name) ==="
Write-Host "Active: $($wf.data.active)"
Write-Host "VersionId: $($wf.data.versionId)"
Write-Host "Node count: $($wf.data.nodes.Count)"
Write-Host "`n=== NODES ==="
foreach ($node in $wf.data.nodes) {
    Write-Host "  [$($node.id)] $($node.name) ($($node.type) v$($node.typeVersion))"
}
Write-Host "`n=== CONNECTIONS ==="
$wf.data.connections | ConvertTo-Json -Depth 10

# Step 3: Save full workflow JSON for analysis
$wf.data | ConvertTo-Json -Depth 20 | Out-File -FilePath "C:\Users\fxvar\Source\dev\fvargas-portfolio\n8n-agent\scripts\current-workflow-dump.json" -Encoding UTF8
Write-Host "`n=== Full workflow saved to current-workflow-dump.json ==="

# Step 4: Fire a test webhook
Write-Host "`n=== FIRING TEST WEBHOOK ==="
$testBody = @{
    firstName = "Test"
    lastName = "Debug"
    email = "test@debug.com"
    phone = "555-0000"
    company = "Debug Corp"
    eventDate = "2026-06-01"
    guestCount = "50"
    budget = "5000"
    menuTier = "Standard"
} | ConvertTo-Json

try {
    $webhookResp = Invoke-WebRequest -Uri "https://n8n.localhost/webhook/generate-proposal" `
        -Method POST -ContentType "application/json" -Body $testBody `
        -SkipCertificateCheck -TimeoutSec 120
    Write-Host "Webhook Status: $($webhookResp.StatusCode)"
    Write-Host "Webhook Response: $($webhookResp.Content)"
} catch {
    Write-Host "Webhook FAILED: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        Write-Host "Error Body: $errBody"
    }
}
