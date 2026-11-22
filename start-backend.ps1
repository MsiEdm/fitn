param(
    [ValidateSet('auth-service', 'fitness-service', 'statistics-service', 'api-gateway')]
    [string]$Module
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSCommandPath

if ($Module) {
    $maven = Get-Command mvn.cmd -ErrorAction Stop
    & $maven.Source -f (Join-Path $projectRoot 'backend\pom.xml') -pl $Module spring-boot:run
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Maven exited with code $LASTEXITCODE for $Module."
    }
    return
}

$modules = @('auth-service', 'fitness-service', 'statistics-service', 'api-gateway')
$ports = @(8080, 8081, 8082, 8083)

$maven = Get-Command mvn.cmd -ErrorAction Stop
$mysqlService = Get-Service -Name 'MySQL80' -ErrorAction SilentlyContinue
if ($mysqlService -and $mysqlService.Status -ne 'Running') {
    Start-Service -Name $mysqlService.Name
    (Get-Service -Name $mysqlService.Name).WaitForStatus(
        [System.ServiceProcess.ServiceControllerStatus]::Running,
        [TimeSpan]::FromSeconds(30)
    )
}

$mysqlConnection = Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue
if (-not $mysqlConnection.TcpTestSucceeded) {
    throw 'MySQL is not accepting connections on localhost:3306. Start MySQL and try again.'
}

$occupiedPorts = @(
    Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $ports -contains $_.LocalPort } |
        Select-Object -ExpandProperty LocalPort -Unique
)
if ($occupiedPorts.Count -gt 0) {
    throw "A backend port is already in use: $($occupiedPorts -join ', '). Stop the existing service before restarting."
}

$mysqlUsername = Read-Host 'MySQL username [fitness]'
if ([string]::IsNullOrWhiteSpace($mysqlUsername)) {
    $mysqlUsername = 'fitness'
}

$securePassword = Read-Host 'MySQL password' -AsSecureString
$passwordPointer = [IntPtr]::Zero
try {
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $mysqlPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
}
finally {
    if ($passwordPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
    $securePassword.Dispose()
}

$secretBytes = New-Object byte[] 48
$randomGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
try {
    $randomGenerator.GetBytes($secretBytes)
    $jwtSecret = [Convert]::ToBase64String($secretBytes)
}
finally {
    $randomGenerator.Dispose()
    [Array]::Clear($secretBytes, 0, $secretBytes.Length)
}

$environmentNames = @('MYSQL_USER', 'MYSQL_PASSWORD', 'JWT_SECRET')
$previousEnvironment = @{}
foreach ($name in $environmentNames) {
    $previousEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

try {
    $env:MYSQL_USER = $mysqlUsername
    $env:MYSQL_PASSWORD = $mysqlPassword
    $env:JWT_SECRET = $jwtSecret
    $mysqlPassword = $null

    foreach ($moduleName in $modules) {
        $arguments = @(
            '-NoExit',
            '-ExecutionPolicy', 'Bypass',
            '-File', ('"{0}"' -f $PSCommandPath),
            '-Module', $moduleName
        ) -join ' '

        $process = Start-Process `
            -FilePath (Join-Path $PSHOME 'powershell.exe') `
            -ArgumentList $arguments `
            -WorkingDirectory $projectRoot `
            -PassThru

        Write-Host "Started $moduleName in PowerShell window (PID $($process.Id))."
    }
}
finally {
    foreach ($name in $environmentNames) {
        [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], 'Process')
    }
}

Write-Host 'Backend launch commands were sent. Check each PowerShell window for startup errors.'
Write-Host 'Gateway: http://localhost:8080 | Auth: 8081 | Fitness: 8082 | Statistics: 8083'
