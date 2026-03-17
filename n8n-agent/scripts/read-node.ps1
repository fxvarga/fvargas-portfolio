$json = Get-Content 'C:\Users\fxvar\Source\dev\fvargas-portfolio\n8n-agent\workflows\catering-proposal-generator.json' -Raw | ConvertFrom-Json
$node = $json.nodes | Where-Object { $_.name -eq 'Build AI Proposal Prompt' }
Write-Output $node.parameters.jsCode
