$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$toolsRoot = Join-Path $projectRoot '.tools'
New-Item -ItemType Directory -Force -Path $toolsRoot | Out-Null
$zip = Join-Path $toolsRoot 'maven.zip'
Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.9/apache-maven-3.9.9-bin.zip' -OutFile $zip
Expand-Archive -LiteralPath $zip -DestinationPath $toolsRoot -Force
Write-Output 'Maven 3.9.9 is ready in .tools. Java 21+ is required.'
