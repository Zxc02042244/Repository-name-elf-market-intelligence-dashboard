$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot

$toolPaths = @(
  "$env:LOCALAPPDATA\GitHubDesktop\app-3.6.1\resources\app\git\cmd",
  "$env:LOCALAPPDATA\GitHubDesktop\app-3.6.2\resources\app\git\cmd",
  "$env:LOCALAPPDATA\Programs\Git\cmd",
  "$env:LOCALAPPDATA\Programs\node-v24.18.0-win-x64",
  "$env:LOCALAPPDATA\Programs\GitHub CLI\bin"
)

foreach ($toolPath in $toolPaths) {
  if (Test-Path $toolPath) {
    $remainingPaths = @($env:Path -split ";" | Where-Object { $_ -and $_ -ne $toolPath })
    $env:Path = (@($toolPath) + $remainingPaths) -join ";"
  }
}

Write-Host "Project root: $projectRoot"
Write-Host "Tool paths loaded for this PowerShell session."

$git = Get-Command git -ErrorAction SilentlyContinue
if ($git) {
  Write-Host "Git: $($git.Source)"
  git --version
} else {
  Write-Warning "Git was not found. Install Git for Windows or check tools/README.md."
}

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  Write-Host "Node.js: $($node.Source)"
  node --version
}

$gh = Get-Command gh -ErrorAction SilentlyContinue
if ($gh) {
  Write-Host "GitHub CLI: $($gh.Source)"
  gh --version | Select-Object -First 1
}
