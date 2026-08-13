[CmdletBinding()]
param(
  [switch]$SkipTests,
  [switch]$SkipBuild,
  [switch]$Serve,
  [ValidateRange(1024, 65535)]
  [int]$Port = 4173
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Fail([string]$Message) {
  Write-Error $Message
  exit 1
}

function Resolve-Tool([string[]]$Names) {
  foreach ($name in $Names) {
    $command = Get-Command $name -ErrorAction SilentlyContinue
    if ($null -ne $command) { return $command.Source }
  }
  return $null
}

function Invoke-Checked([string]$FilePath, [string[]]$Arguments) {
  Write-Host "> $FilePath $($Arguments -join ' ')" -ForegroundColor Cyan
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $repoRoot

$git = Resolve-Tool @("git.exe", "git")
$node = Resolve-Tool @("node.exe", "node")
$npm = Resolve-Tool @("npm.cmd", "npm")

if (-not $git) { Fail "Git is required. Install Git for Windows, then rerun this script." }
if (-not $node) { Fail "Node.js is required. Install Node.js 22 LTS (minimum supported: 20), then rerun this script." }
if (-not $npm) { Fail "npm is required and should be installed with Node.js." }

$nodeVersion = (& $node --version).Trim()
if ($nodeVersion -notmatch '^v(?<major>\d+)\.') { Fail "Unable to parse Node.js version: $nodeVersion" }
$nodeMajor = [int]$Matches.major
if ($nodeMajor -lt 20) { Fail "Node.js $nodeVersion is unsupported. Install Node.js 22 LTS (minimum 20)." }
if ($nodeMajor -ne 22) { Write-Warning "Repository prefers Node.js 22; detected $nodeVersion." }

Invoke-Checked $git @("rev-parse", "--is-inside-work-tree")
$originOutput = & $git remote get-url origin 2>$null
$origin = if ($LASTEXITCODE -eq 0) { ($originOutput | Out-String).Trim() } else { "" }
if ($origin -and $origin -notmatch 'alirezasafaei-dev/awesome-free-llm-apis-ir(\.git)?$') {
  Write-Warning "Unexpected origin remote: $origin"
}

Write-Host "Repository: $repoRoot"
Write-Host "Node: $nodeVersion"
Write-Host "npm: $((& $npm --version).Trim())"
Write-Host "Git: $((& $git --version).Trim())"

Invoke-Checked $npm @("ci")

$shimPath = (Resolve-Path (Join-Path $PSScriptRoot "npm-spawn-shim.cjs")).Path
$previousNodeOptions = $env:NODE_OPTIONS
$shimOption = "--require=$shimPath"
if ($previousNodeOptions) {
  if (-not $previousNodeOptions.Contains($shimPath)) { $env:NODE_OPTIONS = "$previousNodeOptions $shimOption" }
} else {
  $env:NODE_OPTIONS = $shimOption
}

try {
  if (-not $SkipTests) {
    Invoke-Checked $npm @("test")
  }

  if (-not $SkipBuild) {
    Invoke-Checked $npm @("run", "site:build")
    Invoke-Checked $npm @("run", "site:check")
  }
} finally {
  $env:NODE_OPTIONS = $previousNodeOptions
}

Write-Host ""
Write-Host "Windows bootstrap completed successfully." -ForegroundColor Green
Write-Host "Working tree:" -ForegroundColor DarkGray
& $git status --short

if ($Serve) {
  Invoke-Checked $node @("scripts/serve-site.mjs", "--port", "$Port")
} else {
  Write-Host "Local launch: node scripts/serve-site.mjs --port $Port"
  Write-Host "URL: http://127.0.0.1:$Port/"
}
