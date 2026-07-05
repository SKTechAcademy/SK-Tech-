# SK Tech local static file server
# Run with: .\sktech-server.ps1
# Then open http://127.0.0.1:8080 in your browser

param(
    [int]$Port = 8080,
    [string]$Path = $PSScriptRoot
)

if (-not $Path) { $Path = (Get-Location).Path }

# Load System.Web for URL decoding
Add-Type -AssemblyName System.Web

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")

$mimeTypes = @{
    ".html" = "text/html"
    ".htm" = "text/html"
    ".css" = "text/css"
    ".js" = "application/javascript"
    ".json" = "application/json"
    ".png" = "image/png"
    ".jpg" = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif" = "image/gif"
    ".svg" = "image/svg+xml"
    ".ico" = "image/x-icon"
    ".txt" = "text/plain"
    ".csv" = "text/csv"
}

try {
    $listener.Start()
    Write-Host "SK Tech server running at http://127.0.0.1:$Port/" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop..." -ForegroundColor Yellow

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = $request.RawUrl
        if ($rawUrl -eq "/") { $rawUrl = "/index.html" }

        # Decode URL-encoded characters
        $decodedUrl = [System.Web.HttpUtility]::UrlDecode($rawUrl)
        $relativePath = $decodedUrl.TrimStart('/').Replace('/', '\')
        $localPath = Join-Path $Path $relativePath

        if ([System.IO.File]::Exists($localPath)) {
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            $contentType = $mimeTypes[$ext]
            if (-not $contentType) { $contentType = "application/octet-stream" }

            # Add UTF-8 charset for text-based files
            if ($ext -eq ".html" -or $ext -eq ".css" -or $ext -eq ".js" -or $ext -eq ".json" -or $ext -eq ".txt" -or $ext -eq ".csv") {
                $contentType = $contentType + "; charset=utf-8"
            }

            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $msg = "404 - File not found: $rawUrl"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
            $response.StatusCode = 404
            $response.ContentType = "text/plain"
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }

        $response.OutputStream.Close()
        $response.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
    Write-Host "Server stopped." -ForegroundColor Red
}
