$ErrorActionPreference = "Stop"

function Get-ToolStatus {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Name,
    [Parameter(Mandatory = $true)]
    [string] $Command,
    [string[]] $Arguments = @("--version")
  )

  $resolved = Get-Command $Command -ErrorAction SilentlyContinue
  if (-not $resolved) {
    return [pscustomobject]@{
      Tool = $Name
      Status = "missing"
      Version = ""
      Path = ""
    }
  }

  try {
    $version = (& $resolved.Source @Arguments 2>&1 | Select-Object -First 1) -join " "
  } catch {
    $version = "found, version check failed"
  }

  [pscustomobject]@{
    Tool = $Name
    Status = "ok"
    Version = $version
    Path = $resolved.Source
  }
}

$gitPaths = @(
  "$env:LOCALAPPDATA\GitHubDesktop\app-3.6.1\resources\app\git\cmd",
  "$env:LOCALAPPDATA\GitHubDesktop\app-3.6.2\resources\app\git\cmd",
  "$env:LOCALAPPDATA\Programs\Git\cmd",
  "$env:LOCALAPPDATA\Programs\node-v24.18.0-win-x64",
  "$env:LOCALAPPDATA\Programs\GitHub CLI\bin"
)

foreach ($toolPath in $gitPaths) {
  if (Test-Path $toolPath) {
    $remainingPaths = @($env:Path -split ";" | Where-Object { $_ -and $_ -ne $toolPath })
    $env:Path = (@($toolPath) + $remainingPaths) -join ";"
  }
}

@(
  Get-ToolStatus -Name "Git" -Command "git"
  Get-ToolStatus -Name "Node.js" -Command "node"
  Get-ToolStatus -Name "npm" -Command "npm"
  Get-ToolStatus -Name "Python" -Command "python"
  Get-ToolStatus -Name "GitHub CLI" -Command "gh"
) | Format-Table -AutoSize
