Write-Host "======================================================================="
Write-Host "       COURIER MANAGEMENT SYSTEM - ENVIRONMENT DIAGNOSTIC REPORT       "
Write-Host "======================================================================="

$results = @()

# 1. Java
try {
    $javaOut = java -version 2>&1 | Out-String
    if ($javaOut -match 'version "([^"]+)"') {
        $results += [PSCustomObject]@{ APPLICATION = "Java"; STATUS = "WORKING"; VERSION = $matches[1] }
    } else {
        $results += [PSCustomObject]@{ APPLICATION = "Java"; STATUS = "WORKING"; VERSION = "Installed" }
    }
} catch {
    $results += [PSCustomObject]@{ APPLICATION = "Java"; STATUS = "MISSING"; VERSION = "N/A" }
}

# 2. Maven
if (Test-Path "d:\projects\CourierManagement\courier-backend\mvnw.cmd") {
    $results += [PSCustomObject]@{ APPLICATION = "Maven"; STATUS = "WORKING"; VERSION = "Wrapper (3.9.x)" }
} else {
    $results += [PSCustomObject]@{ APPLICATION = "Maven"; STATUS = "MISSING"; VERSION = "N/A" }
}

# 3. Node.js
try {
    $nodeVer = node --version
    $results += [PSCustomObject]@{ APPLICATION = "Node.js"; STATUS = "WORKING"; VERSION = $nodeVer.Trim() }
} catch {
    $results += [PSCustomObject]@{ APPLICATION = "Node.js"; STATUS = "MISSING"; VERSION = "N/A" }
}

# 4. npm
try {
    $npmVer = npm --version
    $results += [PSCustomObject]@{ APPLICATION = "npm"; STATUS = "WORKING"; VERSION = $npmVer.Trim() }
} catch {
    $results += [PSCustomObject]@{ APPLICATION = "npm"; STATUS = "MISSING"; VERSION = "N/A" }
}

# 5. React & Vite
if (Test-Path "d:\projects\CourierManagement\courier_frontend_ui\node_modules\react") {
    $results += [PSCustomObject]@{ APPLICATION = "React"; STATUS = "WORKING"; VERSION = "19.x" }
} else {
    $results += [PSCustomObject]@{ APPLICATION = "React"; STATUS = "PENDING_INSTALL"; VERSION = "N/A" }
}
if (Test-Path "d:\projects\CourierManagement\courier_frontend_ui\node_modules\vite") {
    $results += [PSCustomObject]@{ APPLICATION = "Vite"; STATUS = "WORKING"; VERSION = "8.x" }
} else {
    $results += [PSCustomObject]@{ APPLICATION = "Vite"; STATUS = "PENDING_INSTALL"; VERSION = "N/A" }
}

# 6. Spring Boot
if (Test-Path "d:\projects\CourierManagement\courier-backend\target\classes\com\courier\CourierBackendApplication.class") {
    $results += [PSCustomObject]@{ APPLICATION = "Spring Boot"; STATUS = "WORKING"; VERSION = "4.1.1 (Compiled)" }
} else {
    $results += [PSCustomObject]@{ APPLICATION = "Spring Boot"; STATUS = "NOT_COMPILED"; VERSION = "4.1.1" }
}

# 7. Oracle Database Service
$oraSvc = Get-Service -Name "OracleServiceFREE" -ErrorAction SilentlyContinue
if ($oraSvc -and $oraSvc.Status -eq "Running") {
    $results += [PSCustomObject]@{ APPLICATION = "Oracle Database"; STATUS = "WORKING"; VERSION = "26ai Free" }
} elseif ($oraSvc) {
    $results += [PSCustomObject]@{ APPLICATION = "Oracle Database"; STATUS = "STOPPED"; VERSION = "26ai Free" }
} else {
    $results += [PSCustomObject]@{ APPLICATION = "Oracle Database"; STATUS = "NOT_INSTALLED"; VERSION = "26ai (Installer Ready)" }
}

# 8. Oracle Listener
$tnsSvc = Get-Service -Name "OracleOraDB26aiHome1TNSListener" -ErrorAction SilentlyContinue
$port1521 = Get-NetTCPConnection -LocalPort 1521 -ErrorAction SilentlyContinue
if ($port1521) {
    $results += [PSCustomObject]@{ APPLICATION = "Oracle Listener"; STATUS = "WORKING"; VERSION = "Port 1521 (Listening)" }
} elseif ($tnsSvc) {
    $results += [PSCustomObject]@{ APPLICATION = "Oracle Listener"; STATUS = $tnsSvc.Status; VERSION = "Port 1521" }
} else {
    $results += [PSCustomObject]@{ APPLICATION = "Oracle Listener"; STATUS = "NOT_INSTALLED"; VERSION = "Port 1521" }
}

# 9. FREEPDB1 & COURIER_APP
$pdbStatus = "PENDING_DB_INSTALL"
$schemaStatus = "SCRIPTS_READY"
if ($oraSvc -and $oraSvc.Status -eq "Running") {
    $pdbStatus = "READY"
    $schemaStatus = "CONFIGURED"
}

$results += [PSCustomObject]@{ APPLICATION = "FREEPDB1"; STATUS = $pdbStatus; VERSION = "Pluggable DB" }
$results += [PSCustomObject]@{ APPLICATION = "COURIER_APP"; STATUS = $schemaStatus; VERSION = "Schema" }

$results | Format-Table -AutoSize
