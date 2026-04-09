$startDate = (Get-Date -Day 1).ToString('yyyy-MM-ddT00:00:00Z')
$endDate = (Get-Date).ToString('yyyy-MM-ddT23:59:59Z')
Write-Output "Start: $startDate"
Write-Output "End: $endDate"
