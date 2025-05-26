param (
    [string]$GraphQLEndpoint = "https://localhost:7007/graphql",
    [string]$FolderPath = ".\graphql-scripts"
)

Write-Host "`n🔁 Processing GraphQL scripts in: $FolderPath"
Write-Host "🎯 GraphQL Endpoint: $GraphQLEndpoint`n"

$headers = @{ "Content-Type" = "application/json" }

$files = Get-ChildItem -Path $FolderPath -Filter *.graphql | Sort-Object Name

foreach ($file in $files) {
    Write-Host "📄 Reading: $($file.Name)"

    $rawContent = Get-Content $file.FullName -Raw

    # Split on each mutation block
    $mutations = $rawContent -split "(?=mutation\s*{)" | Where-Object { $_.Trim() -ne "" }

    foreach ($mutation in $mutations) {
        $finalQuery = $mutation.Trim()
        if (-not $finalQuery.StartsWith("mutation")) {
            $finalQuery = "mutation " + $finalQuery
        }

        $body = @{
            query = $finalQuery
        } | ConvertTo-Json -Compress -Depth 10

        try {
            Write-Host "⚙️ Sending mutation..."
            $response = Invoke-RestMethod -Uri $GraphQLEndpoint -Method POST -Headers $headers -Body $body

            if ($response.errors) {
                Write-Host "❌ GraphQL Errors:"
                $response.errors | ForEach-Object { Write-Host " - $($_.message)" -ForegroundColor Red }
            } else {
                Write-Host "✅ Success:`n$($response | ConvertTo-Json -Depth 5)`n"
            }
        }
        catch {
            Write-Host "❌ Request failed:`n$($_.Exception.Message)" -ForegroundColor Red
            Write-Host "🔎 Body sent:`n$body`n"
        }

        Start-Sleep -Milliseconds 300
    }
}
