param(
    [Parameter(Mandatory = $true)]
    [string]$WorkerUrl,

    [Parameter(Mandatory = $true)]
    [string]$AdminApiKey,

    [string]$ChatId,
    [string]$Text = "Hermes conectado com sucesso ao Telegram."
)

$baseUrl = $WorkerUrl.TrimEnd("/")
$payload = @{ text = $Text }
if ($ChatId) { $payload.chatId = $ChatId }

try {
    Invoke-RestMethod `
        -Method Post `
        -Uri "$baseUrl/admin/telegram/send-test" `
        -Headers @{ Authorization = "Bearer $AdminApiKey" } `
        -ContentType "application/json" `
        -Body ($payload | ConvertTo-Json) | ConvertTo-Json -Depth 10
}
catch {
    Write-Error "Falha ao enviar mensagem de teste: $($_.Exception.Message)"
    exit 1
}
