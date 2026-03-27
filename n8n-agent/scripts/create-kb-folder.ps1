# Requires environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
if (-not $env:AZURE_TENANT_ID -or -not $env:AZURE_CLIENT_ID -or -not $env:AZURE_CLIENT_SECRET) {
    Write-Error "Missing required environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
    exit 1
}
$tokenResp = Invoke-RestMethod -Uri "https://login.microsoftonline.com/$($env:AZURE_TENANT_ID)/oauth2/v2.0/token" -Method POST -Body @{
    client_id = $env:AZURE_CLIENT_ID
    client_secret = $env:AZURE_CLIENT_SECRET
    scope = 'https://graph.microsoft.com/.default'
    grant_type = 'client_credentials'
}
$token = $tokenResp.access_token
Write-Output "Got token: $($token.Substring(0,20))..."

$headers = @{
    Authorization = "Bearer $token"
    'Content-Type' = 'application/json'
}
$driveId = 'b!LoaIdx-UDUioY2UwZGxbhpULmgQk8CFCjcY2WDU2rLjQYRMdmY-AQo71DCJ7UF_x'

# Step 1: Create Knowledge Base folder
$body = '{"name":"Knowledge Base","folder":{},"@microsoft.graph.conflictBehavior":"fail"}'
$uri = "https://graph.microsoft.com/v1.0/drives/$driveId/root:/ExecutiveCatering:/children"
try {
    $folderResp = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body
    Write-Output "FOLDER CREATED"
    Write-Output "FOLDER_ID=$($folderResp.id)"
    $folderId = $folderResp.id
} catch {
    $errBody = $_.ErrorDetails.Message
    if ($errBody -match 'nameAlreadyExists') {
        Write-Output 'Folder already exists, fetching ID...'
        $getUri = "https://graph.microsoft.com/v1.0/drives/$driveId/root:/ExecutiveCatering/Knowledge Base"
        $existingFolder = Invoke-RestMethod -Uri $getUri -Method GET -Headers $headers
        Write-Output "FOLDER_ID=$($existingFolder.id)"
        $folderId = $existingFolder.id
    } else {
        Write-Output "ERROR: $errBody"
        exit 1
    }
}

# Step 2: Upload the knowledge base markdown file
$kbFilePath = "C:\Users\fxvar\Source\dev\fvargas-portfolio\n8n-agent\knowledge-base\executive-catering-kb.md"
$fileBytes = [System.IO.File]::ReadAllBytes($kbFilePath)
$uploadUri = "https://graph.microsoft.com/v1.0/drives/$driveId/root:/ExecutiveCatering/Knowledge Base/executive-catering-kb.md:/content"
$uploadHeaders = @{
    Authorization = "Bearer $token"
    'Content-Type' = 'text/markdown'
}
try {
    $uploadResp = Invoke-RestMethod -Uri $uploadUri -Method PUT -Headers $uploadHeaders -Body $fileBytes
    Write-Output "FILE UPLOADED"
    Write-Output "FILE_ID=$($uploadResp.id)"
    Write-Output "FILE_NAME=$($uploadResp.name)"
    Write-Output "FILE_SIZE=$($uploadResp.size)"
} catch {
    Write-Output "UPLOAD ERROR: $($_.ErrorDetails.Message)"
    exit 1
}

Write-Output "DONE"
