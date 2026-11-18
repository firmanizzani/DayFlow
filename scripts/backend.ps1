param([ValidateSet('run','test','package')][string]$Action = 'run')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $projectRoot 'backend/.env'
if (Test-Path -LiteralPath $envFile) {
  foreach ($line in Get-Content -LiteralPath $envFile) {
    if ($line -match '^([A-Z_][A-Z0-9_]*)=(.*)$') {
      [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2].Trim('"').Trim("'"), 'Process')
    }
  }
}
if (-not $env:JAVA_HOME) {
  $bundledJava = 'C:/Program Files/Android/Android Studio/jbr'
  if (Test-Path "$bundledJava/bin/java.exe") { $env:JAVA_HOME = $bundledJava }
}
$maven = Join-Path $projectRoot '.tools/apache-maven-3.9.9/bin/mvn.cmd'
if (-not (Test-Path -LiteralPath $maven)) { throw 'Run scripts/setup-tools.ps1 first, or use an installed Maven 3.9+.' }
$env:PATH = "$env:JAVA_HOME/bin;$env:PATH"
$goal = if ($Action -eq 'run') { 'spring-boot:run' } else { $Action }
& $maven '-f' "$projectRoot/backend/pom.xml" "-Dmaven.repo.local=$projectRoot/.tools/m2" $goal
exit $LASTEXITCODE
