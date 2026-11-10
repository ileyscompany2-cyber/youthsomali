param(
    [switch]$SetupOnly,
    [switch]$Test
)

# This launcher installs nothing globally and never changes the machine PATH.
# A portable official Node runtime stays in the ignored project .tools directory.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$projectRoot = $PSScriptRoot
$toolsRoot = Join-Path $projectRoot '.tools'
$runtimeFile = Join-Path $toolsRoot 'node-path.txt'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodeExecutable = $null
$candidates = @()
if ($nodeCommand) { $candidates += $nodeCommand.Source }
# VS Code can retain an old PATH after Node is installed. Check standard locations too.
$candidates += @('C:\Program Files\nodejs\node.exe', (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe'), (Join-Path $env:LOCALAPPDATA 'Programs\node\node.exe'))
foreach ($candidate in ($candidates | Select-Object -Unique)) {
    if (-not (Test-Path -LiteralPath $candidate)) { continue }
    $major = & $candidate -p 'parseInt(process.versions.node)'
    if ($LASTEXITCODE -eq 0 -and [int]$major -ge 22) { $nodeExecutable = $candidate; break }
}
if (-not $nodeExecutable -and (Test-Path -LiteralPath $runtimeFile)) {
    $candidate = [System.IO.File]::ReadAllText($runtimeFile).Trim()
    $resolvedTools = [System.IO.Path]::GetFullPath($toolsRoot) + [System.IO.Path]::DirectorySeparatorChar
    if ($candidate.StartsWith($resolvedTools, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $candidate)) { $nodeExecutable = $candidate }
}
if (-not $nodeExecutable) {
    [System.IO.Directory]::CreateDirectory($toolsRoot) | Out-Null
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $architecture = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
    $releaseUrl = 'https://nodejs.org/dist/latest-v22.x/'
    Write-Host 'Preparing the local Node.js runtime from nodejs.org...'
    # Get the official SHA-256 list over HTTPS and verify the ZIP before extraction.
    $checksums = (Invoke-WebRequest -UseBasicParsing -Uri ($releaseUrl + 'SHASUMS256.txt') -TimeoutSec 30).Content
    $match = [regex]::Match($checksums, '(?m)^([a-f0-9]{64})\s+(node-v22\.[0-9]+\.[0-9]+-win-' + $architecture + '\.zip)\s*$')
    if (-not $match.Success) { throw 'The official Node.js checksum list did not contain the expected Windows release.' }
    $expectedHash = $match.Groups[1].Value
    $archiveName = $match.Groups[2].Value
    $archivePath = Join-Path $toolsRoot $archiveName
    try {
        Invoke-WebRequest -UseBasicParsing -Uri ($releaseUrl + $archiveName) -OutFile $archivePath -TimeoutSec 45
    } catch {
        throw 'Node download failed. Check your connection to nodejs.org, or install Node.js 22+ from https://nodejs.org/en/download and run this launcher again.'
    }
    if ((Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash -ne $expectedHash) { throw 'Node.js ZIP checksum verification failed. The archive will not be executed.' }
    Expand-Archive -LiteralPath $archivePath -DestinationPath $toolsRoot -Force
    $nodeExecutable = Join-Path (Join-Path $toolsRoot ([System.IO.Path]::GetFileNameWithoutExtension($archiveName))) 'node.exe'
    if (-not (Test-Path -LiteralPath $nodeExecutable)) { throw 'Node.js extraction did not produce node.exe.' }
    [System.IO.File]::WriteAllText($runtimeFile, $nodeExecutable)
}
Write-Host ('Node runtime: ' + (& $nodeExecutable --version))
if ($SetupOnly) { return }
Push-Location -LiteralPath $projectRoot
try {
    if ($Test) {
        & $nodeExecutable --test tests/local-server.test.mjs
    } else {
        Write-Host 'Choose your local login below. This does not connect to GitHub or Netlify.'
        & $nodeExecutable scripts/local-server.mjs
    }
    if ($LASTEXITCODE -ne 0) { throw ('Local command exited with code ' + $LASTEXITCODE) }
} finally { Pop-Location }
