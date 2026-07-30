param(
    [Parameter(Mandatory = $true)]
    [string]$WorkerUrl,

    [Parameter(Mandatory = $true)]
    [string]$AdminApiKey,

    [switch]$DropPendingUpdates
)

$baseUrl = $WorkerUrl.TrimEnd("/")
$body = @{ dropPendingUpdates = [bool]$DropPendingUpdates } | ConvertTo-Json

try {
    Invoke-RestMethod `
        -Method Post `
        -Uri "$baseUrl/admin/telegram/set-webhook" `
        -Headers @{ Authorization = "Bearer $AdminApiKey" } `
        -ContentType "application/json" `
        -Body $body | ConvertTo-Json -Depth 10
}
catch {
    Write-Error "Falha ao configurar webhook: $($_.Exception.Message)"
    exit 1
}
