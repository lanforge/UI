# ============================================================
# LANForge Trade-In Scanner GUI
# Version 3.0.0
# ============================================================

$ErrorActionPreference = "SilentlyContinue"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$CompanyName = "LANForge, LLC."
$ToolName = "LANForge Trade-In Scanner"
$Version = "3.0.0"

$DesktopPath = [Environment]::GetFolderPath("Desktop")
$OutputRoot = Join-Path $DesktopPath "LANForge-TradeIn-Reports"

New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null

$Global:LastReport = $null
$Global:LastReportFolder = $null
$Global:LastZipPath = $null

function Safe-Value {
    param($Value)

    if ($null -eq $Value) {
        return ""
    }

    return ($Value | Out-String).Trim()
}

function Convert-BytesToGB {
    param($Bytes)

    if ($null -eq $Bytes -or $Bytes -eq 0) {
        return 0
    }

    return [math]::Round(($Bytes / 1GB), 2)
}

function Convert-BytesToTB {
    param($Bytes)

    if ($null -eq $Bytes -or $Bytes -eq 0) {
        return 0
    }

    return [math]::Round(($Bytes / 1TB), 2)
}

function Html-Encode {
    param($Value)

    if ($null -eq $Value) {
        return ""
    }

    return [System.Net.WebUtility]::HtmlEncode(($Value | Out-String).Trim())
}

function Get-AdminStatus {
    $currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentIdentity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-VramFromKnownGpuName {
    param([string]$GpuName)

    if ([string]::IsNullOrWhiteSpace($GpuName)) {
        return "Unknown"
    }

    $name = $GpuName.ToUpper()

    $knownVram = @{
        "RTX 4090" = 24
        "RTX 4080 SUPER" = 16
        "RTX 4080" = 16
        "RTX 4070 TI SUPER" = 16
        "RTX 4070 TI" = 12
        "RTX 4070 SUPER" = 12
        "RTX 4070" = 12
        "RTX 4060 TI" = "8 or 16"
        "RTX 4060" = 8
        "RTX 3090 TI" = 24
        "RTX 3090" = 24
        "RTX 3080 TI" = 12
        "RTX 3080" = "10 or 12"
        "RTX 3070 TI" = 8
        "RTX 3070" = 8
        "RTX 3060 TI" = 8
        "RTX 3060" = "8 or 12"
        "RTX 3050" = "6 or 8"
        "RX 7900 XTX" = 24
        "RX 7900 XT" = 20
        "RX 7900 GRE" = 16
        "RX 7800 XT" = 16
        "RX 7700 XT" = 12
        "RX 7600 XT" = 16
        "RX 7600" = 8
        "RX 6950 XT" = 16
        "RX 6900 XT" = 16
        "RX 6800 XT" = 16
        "RX 6800" = 16
        "RX 6750 XT" = 12
        "RX 6700 XT" = 12
        "RX 6650 XT" = 8
        "RX 6600 XT" = 8
        "RX 6600" = 8
        "ARC A770" = "8 or 16"
        "ARC A750" = 8
        "ARC A580" = 8
        "ARC A380" = 6
    }

    foreach ($key in $knownVram.Keys) {
        if ($name -like "*$key*") {
            return $knownVram[$key]
        }
    }

    return "Unknown"
}

function Add-Log {
    param(
        [System.Windows.Forms.TextBox]$LogBox,
        [string]$Message
    )

    $line = "$(Get-Date -Format "HH:mm:ss") - $Message"
    $LogBox.AppendText($line + [Environment]::NewLine)
    $LogBox.SelectionStart = $LogBox.Text.Length
    $LogBox.ScrollToCaret()
    [System.Windows.Forms.Application]::DoEvents()
}

function Resolve-TradeInApiUrl {
    param([string]$BaseUrl)

    $url = $BaseUrl.Trim().TrimEnd("/")

    if ($url.ToLower().EndsWith("/trade-ins")) {
        return $url
    }

    return "$url/trade-ins"
}

function Get-LANForgeScan {
    param(
        [string]$CustomerName,
        [string]$CustomerEmail,
        [string]$CustomerPhone,
        [string]$InputTradeCode,
        [System.Windows.Forms.TextBox]$LogBox
    )

    Add-Log $LogBox "Collecting system info..."

    $ReportId = "LF-TI-" + (Get-Date -Format "yyyyMMddHHmmss") + "-" + (Get-Random -Minimum 1000 -Maximum 9999)
    $ReportFolder = Join-Path $OutputRoot $ReportId
    $OptionalToolsOutput = Join-Path $ReportFolder "optional-tool-exports"

    New-Item -ItemType Directory -Force -Path $ReportFolder | Out-Null
    New-Item -ItemType Directory -Force -Path $OptionalToolsOutput | Out-Null

    $JsonPath = Join-Path $ReportFolder "lanforge-tradein-report.json"
    $TxtPath = Join-Path $ReportFolder "lanforge-tradein-report.txt"
    $HtmlPath = Join-Path $ReportFolder "lanforge-tradein-report.html"
    $ZipPath = Join-Path $OutputRoot "$ReportId.zip"

    $ComputerSystem = Get-CimInstance Win32_ComputerSystem
    $OperatingSystem = Get-CimInstance Win32_OperatingSystem
    $Processor = Get-CimInstance Win32_Processor
    $VideoControllers = Get-CimInstance Win32_VideoController
    $PhysicalMemory = Get-CimInstance Win32_PhysicalMemory
    $DiskDrives = Get-CimInstance Win32_DiskDrive
    $BaseBoard = Get-CimInstance Win32_BaseBoard
    $BIOS = Get-CimInstance Win32_BIOS

    $CpuInfo = @()

    foreach ($cpu in $Processor) {
        $CpuInfo += [PSCustomObject]@{
            name              = Safe-Value $cpu.Name
            manufacturer      = Safe-Value $cpu.Manufacturer
            cores             = $cpu.NumberOfCores
            logicalProcessors = $cpu.NumberOfLogicalProcessors
            maxClockMHz       = $cpu.MaxClockSpeed
            socket            = Safe-Value $cpu.SocketDesignation
            processorId       = Safe-Value $cpu.ProcessorId
        }
    }

    Add-Log $LogBox "CPU detected: $($CpuInfo[0].name)"

    $GpuInfo = @()

    foreach ($gpu in $VideoControllers) {
        $gpuName = Safe-Value $gpu.Name
        $gpuUpper = $gpuName.ToUpper()

        $isMicrosoftBasic = $gpuUpper -like "*MICROSOFT BASIC DISPLAY*"
        $isRemoteDisplay = $gpuUpper -like "*REMOTE DISPLAY*" -or $gpuUpper -like "*VIRTUAL*"
        $isLikelyRealGpu = -not $isMicrosoftBasic -and -not $isRemoteDisplay

        $rawAdapterRamGB = "Unknown"

        try {
            $rawValue = Convert-BytesToGB $gpu.AdapterRAM

            if ($rawValue -ge 6) {
                $rawAdapterRamGB = $rawValue
            } else {
                $rawAdapterRamGB = "Unreliable"
            }
        } catch {
            $rawAdapterRamGB = "Unknown"
        }

        $GpuInfo += [PSCustomObject]@{
            name                   = $gpuName
            isLikelyRealGpu         = $isLikelyRealGpu
            isMicrosoftBasicAdapter = $isMicrosoftBasic
            status                 = Safe-Value $gpu.Status
            driverVersion          = Safe-Value $gpu.DriverVersion
            rawAdapterRAMGB         = $rawAdapterRamGB
            vramGuessGB             = Get-VramFromKnownGpuName $gpuName
            videoProcessor          = Safe-Value $gpu.VideoProcessor
            resolution              = "$($gpu.CurrentHorizontalResolution)x$($gpu.CurrentVerticalResolution)"
            refreshRate             = $gpu.CurrentRefreshRate
            pnpDeviceId             = Safe-Value $gpu.PNPDeviceID
        }
    }

    $PrimaryGpu = $GpuInfo | Where-Object { $_.isLikelyRealGpu -eq $true } | Select-Object -First 1

    if ($PrimaryGpu) {
        Add-Log $LogBox "GPU detected: $($PrimaryGpu.name)"
    } else {
        Add-Log $LogBox "WARNING: No real gaming GPU confidently detected."
    }

    $RamInfo = @()
    $TotalRamBytes = 0

    foreach ($stick in $PhysicalMemory) {
        $TotalRamBytes += [int64]$stick.Capacity

        $memoryTypeReadable = "Unknown"

        switch ($stick.SMBIOSMemoryType) {
            20 { $memoryTypeReadable = "DDR" }
            21 { $memoryTypeReadable = "DDR2" }
            24 { $memoryTypeReadable = "DDR3" }
            26 { $memoryTypeReadable = "DDR4" }
            34 { $memoryTypeReadable = "DDR5" }
            default { $memoryTypeReadable = "Unknown" }
        }

        $RamInfo += [PSCustomObject]@{
            manufacturer  = Safe-Value $stick.Manufacturer
            partNumber    = Safe-Value $stick.PartNumber
            serialNumber  = Safe-Value $stick.SerialNumber
            capacityGB    = Convert-BytesToGB $stick.Capacity
            speedMHz      = $stick.Speed
            configuredMHz = $stick.ConfiguredClockSpeed
            memoryType    = $memoryTypeReadable
            slot          = Safe-Value $stick.DeviceLocator
            bank          = Safe-Value $stick.BankLabel
        }
    }

    $TotalRamGB = Convert-BytesToGB $TotalRamBytes
    Add-Log $LogBox "RAM detected: $TotalRamGB GB"

    $DiskInfo = @()
    $InternalStorageGB = 0

    foreach ($disk in $DiskDrives) {
        $isUsb = (Safe-Value $disk.InterfaceType).ToUpper() -eq "USB"
        $isRemovable = (Safe-Value $disk.MediaType).ToUpper() -like "*REMOVABLE*"
        $sizeGB = Convert-BytesToGB $disk.Size

        if (-not $isUsb -and -not $isRemovable) {
            $InternalStorageGB += $sizeGB
        }

        $DiskInfo += [PSCustomObject]@{
            model         = Safe-Value $disk.Model
            manufacturer  = Safe-Value $disk.Manufacturer
            serialNumber  = Safe-Value $disk.SerialNumber
            interfaceType = Safe-Value $disk.InterfaceType
            mediaType     = Safe-Value $disk.MediaType
            sizeGB        = $sizeGB
            sizeTB        = Convert-BytesToTB $disk.Size
            status        = Safe-Value $disk.Status
            isUSB         = $isUsb
            isRemovable   = $isRemovable
            firmware      = Safe-Value $disk.FirmwareRevision
        }
    }

    Add-Log $LogBox "Internal storage detected: $([math]::Round($InternalStorageGB, 2)) GB"

    $MotherboardInfo = [PSCustomObject]@{
        manufacturer = Safe-Value $BaseBoard.Manufacturer
        product      = Safe-Value $BaseBoard.Product
        version      = Safe-Value $BaseBoard.Version
        serialNumber = Safe-Value $BaseBoard.SerialNumber
    }

    $BiosInfo = [PSCustomObject]@{
        manufacturer = Safe-Value $BIOS.Manufacturer
        name         = Safe-Value $BIOS.Name
        version      = Safe-Value $BIOS.SMBIOSBIOSVersion
        serialNumber = Safe-Value $BIOS.SerialNumber
        releaseDate  = Safe-Value $BIOS.ReleaseDate
    }

    $SystemInfo = [PSCustomObject]@{
        manufacturer = Safe-Value $ComputerSystem.Manufacturer
        model        = Safe-Value $ComputerSystem.Model
        computerName = Safe-Value $ComputerSystem.Name
        systemType   = Safe-Value $ComputerSystem.SystemType
        isAdmin      = Get-AdminStatus
    }

    $WindowsInfo = [PSCustomObject]@{
        caption        = Safe-Value $OperatingSystem.Caption
        version        = Safe-Value $OperatingSystem.Version
        buildNumber    = Safe-Value $OperatingSystem.BuildNumber
        architecture   = Safe-Value $OperatingSystem.OSArchitecture
        installDate    = Safe-Value $OperatingSystem.InstallDate
        lastBootUpTime = Safe-Value $OperatingSystem.LastBootUpTime
    }

    $components = [PSCustomObject]@{
        cpu         = if ($CpuInfo.Count -gt 0) { $CpuInfo[0].name } else { "" }
        gpu         = if ($PrimaryGpu) { "$($PrimaryGpu.name) - VRAM Guess: $($PrimaryGpu.vramGuessGB) GB" } else { "" }
        ram         = "$TotalRamGB GB"
        storage     = "$([math]::Round($InternalStorageGB, 2)) GB internal storage"
        motherboard = "$($MotherboardInfo.manufacturer) $($MotherboardInfo.product)"
        psu         = ""
        case        = ""
        cooler      = ""
        other       = "Scanner Report ID: $ReportId; Customer-entered code: $InputTradeCode"
    }

    $warnings = @()

    if (-not $PrimaryGpu) {
        $warnings += "No valid gaming GPU confidently detected."
    }

    if (($GpuInfo | Where-Object { $_.isMicrosoftBasicAdapter -eq $true }).Count -gt 0) {
        $warnings += "Microsoft Basic Display Adapter detected. This may mean missing drivers, disabled GPU/iGPU, or driver conflict."
    }

    if ($TotalRamGB -lt 16) {
        $warnings += "RAM is below 16 GB."
    }

    if ($InternalStorageGB -lt 500) {
        $warnings += "Internal storage appears below 500 GB."
    }

    $Report = [PSCustomObject]@{
        reportMetadata = [PSCustomObject]@{
            companyName       = $CompanyName
            toolName          = $ToolName
            version           = $Version
            reportId          = $ReportId
            generatedAt       = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            generatedByUser   = $env:USERNAME
            computerName      = $env:COMPUTERNAME
            customerInputCode = $InputTradeCode
            note              = "This report is for estimated trade-in review only. Final value is subject to LANForge inspection."
        }
        customer = [PSCustomObject]@{
            name  = $CustomerName
            email = $CustomerEmail
            phone = $CustomerPhone
        }
        components  = $components
        system      = $SystemInfo
        windows     = $WindowsInfo
        motherboard = $MotherboardInfo
        bios        = $BiosInfo
        cpu         = $CpuInfo
        gpu         = $GpuInfo
        ram         = [PSCustomObject]@{
            totalGB = $TotalRamGB
            modules = $RamInfo
        }
        storage     = [PSCustomObject]@{
            internalStorageTotalGB = [math]::Round($InternalStorageGB, 2)
            physicalDisks          = $DiskInfo
        }
        warnings    = $warnings
    }

    Add-Log $LogBox "Saving local reports..."

    $Report | ConvertTo-Json -Depth 12 | Out-File -FilePath $JsonPath -Encoding UTF8

    $Txt = @"
============================================================
$ToolName
$CompanyName
Version: $Version
Report ID: $ReportId
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
============================================================

CUSTOMER
------------------------------------------------------------
Name: $CustomerName
Email: $CustomerEmail
Phone: $CustomerPhone
Customer Entered Code: $InputTradeCode

COMPONENTS SENT TO API
------------------------------------------------------------
CPU: $($components.cpu)
GPU: $($components.gpu)
RAM: $($components.ram)
Storage: $($components.storage)
Motherboard: $($components.motherboard)
Other: $($components.other)

SYSTEM
------------------------------------------------------------
Manufacturer: $($SystemInfo.manufacturer)
Model: $($SystemInfo.model)
Computer: $($SystemInfo.computerName)

WINDOWS
------------------------------------------------------------
OS: $($WindowsInfo.caption)
Version: $($WindowsInfo.version)
Build: $($WindowsInfo.buildNumber)

CPU
------------------------------------------------------------
$($CpuInfo | Format-List | Out-String)

GPU
------------------------------------------------------------
$($GpuInfo | Format-List | Out-String)

RAM
------------------------------------------------------------
Total RAM: $TotalRamGB GB
$($RamInfo | Format-List | Out-String)

STORAGE
------------------------------------------------------------
Internal Storage Total: $([math]::Round($InternalStorageGB, 2)) GB
$($DiskInfo | Format-List | Out-String)

WARNINGS
------------------------------------------------------------
$($warnings | Out-String)

NOTICE:
This report is for estimated trade-in review only.
Final value is subject to LANForge inspection.
"@

    $Txt | Out-File -FilePath $TxtPath -Encoding UTF8

    $WarningsHtml = ""

    if ($warnings.Count -gt 0) {
        foreach ($warning in $warnings) {
            $WarningsHtml += "<div class='warning'>$(Html-Encode $warning)</div>"
        }
    } else {
        $WarningsHtml = "<div class='pass'>No major scanner warnings detected.</div>"
    }

    $HtmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>$CompanyName Trade-In Report - $ReportId</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f4f6f8;
            color: #111827;
            padding: 30px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 14px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }

        h1 {
            margin-bottom: 5px;
        }

        h2 {
            margin-top: 35px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
        }

        .notice {
            background: #fff7ed;
            border: 1px solid #fed7aa;
            padding: 14px;
            border-radius: 10px;
            margin: 20px 0;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 14px;
            margin: 20px 0;
        }

        .card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 15px;
        }

        .card small {
            display: block;
            color: #6b7280;
            margin-bottom: 6px;
        }

        .card strong {
            font-size: 16px;
        }

        .warning {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        }

        .pass {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #86efac;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 8px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 14px;
        }

        th {
            background: #111827;
            color: #ffffff;
            text-align: left;
            padding: 10px;
        }

        td {
            border: 1px solid #e5e7eb;
            padding: 9px;
            vertical-align: top;
        }

        tr:nth-child(even) {
            background: #f9fafb;
        }

        .footer {
            margin-top: 40px;
            color: #6b7280;
            font-size: 13px;
        }
    </style>
</head>
<body>
<div class="container">
    <h1>$ToolName</h1>
    <strong>$CompanyName</strong>

    <div class="notice">
        This report is for estimated trade-in review only. Final value is subject to LANForge inspection.
    </div>

    <h2>Customer</h2>
    <div class="grid">
        <div class="card"><small>Name</small><strong>$(Html-Encode $CustomerName)</strong></div>
        <div class="card"><small>Email</small><strong>$(Html-Encode $CustomerEmail)</strong></div>
        <div class="card"><small>Phone</small><strong>$(Html-Encode $CustomerPhone)</strong></div>
        <div class="card"><small>Customer Code</small><strong>$(Html-Encode $InputTradeCode)</strong></div>
        <div class="card"><small>Report ID</small><strong>$(Html-Encode $ReportId)</strong></div>
    </div>

    <h2>Detected Components</h2>
    <div class="grid">
        <div class="card"><small>CPU</small><strong>$(Html-Encode $components.cpu)</strong></div>
        <div class="card"><small>GPU</small><strong>$(Html-Encode $components.gpu)</strong></div>
        <div class="card"><small>RAM</small><strong>$(Html-Encode $components.ram)</strong></div>
        <div class="card"><small>Storage</small><strong>$(Html-Encode $components.storage)</strong></div>
        <div class="card"><small>Motherboard</small><strong>$(Html-Encode $components.motherboard)</strong></div>
    </div>

    <h2>Warnings</h2>
    $WarningsHtml

    <h2>CPU Details</h2>
    $($CpuInfo | ConvertTo-Html -Fragment)

    <h2>GPU Details</h2>
    $($GpuInfo | ConvertTo-Html -Fragment)

    <h2>RAM Details</h2>
    $($RamInfo | ConvertTo-Html -Fragment)

    <h2>Storage Details</h2>
    $($DiskInfo | ConvertTo-Html -Fragment)

    <div class="footer">
        Generated by $ToolName v$Version for $CompanyName.
    </div>
</div>
</body>
</html>
"@

    $HtmlContent | Out-File -FilePath $HtmlPath -Encoding UTF8

    $ReadmePath = Join-Path $ReportFolder "README.txt"

    $Readme = @"
LANForge Trade-In Scanner Report
================================

Report ID:
$ReportId

Customer-entered code:
$InputTradeCode

This folder contains:
- lanforge-tradein-report.html
- lanforge-tradein-report.txt
- lanforge-tradein-report.json

Important:
This report is for estimated trade-in review only.
Final value is subject to LANForge inspection.

Recommended photos:
1. Front of PC
2. Side panel with internals visible
3. Rear I/O
4. GPU area
5. Serial/order sticker if available
6. Any visible damage

Generated by:
$ToolName v$Version
$CompanyName
"@

    $Readme | Out-File -FilePath $ReadmePath -Encoding UTF8

    if (Test-Path $ZipPath) {
        Remove-Item $ZipPath -Force
    }

    Compress-Archive -Path "$ReportFolder\*" -DestinationPath $ZipPath -Force

    Add-Log $LogBox "Local ZIP created: $ZipPath"

    $Global:LastReport = $Report
    $Global:LastReportFolder = $ReportFolder
    $Global:LastZipPath = $ZipPath

    return $Report
}

function Submit-LANForgeTradeIn {
    param(
        [object]$Report,
        [string]$ApiBaseUrl,
        [System.Windows.Forms.TextBox]$LogBox
    )

    $apiUrl = Resolve-TradeInApiUrl $ApiBaseUrl

    Add-Log $LogBox "Submitting to API: $apiUrl"

    $payload = [PSCustomObject]@{
        tradeCode     = $Report.reportMetadata.customerInputCode
        customerName  = $Report.customer.name
        customerEmail = $Report.customer.email
        customerPhone = $Report.customer.phone
        components    = $Report.components
        notes         = "Scanner Report ID: $($Report.reportMetadata.reportId); Customer-entered code: $($Report.reportMetadata.customerInputCode); Generated: $($Report.reportMetadata.generatedAt)"
    }

    $json = $payload | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Body $json -ContentType "application/json"

        Add-Log $LogBox "Submitted successfully."

        if ($response.tradeCode) {
            Add-Log $LogBox "Server trade code: $($response.tradeCode)"
        }

        return $response
    } catch {
        Add-Log $LogBox "API submission failed."
        Add-Log $LogBox "$($_.Exception.Message)"

        if ($_.ErrorDetails.Message) {
            Add-Log $LogBox "$($_.ErrorDetails.Message)"
        }

        return $null
    }
}

# -----------------------------
# GUI
# -----------------------------
$form = New-Object System.Windows.Forms.Form
$form.Text = "$ToolName v$Version"
$form.Size = New-Object System.Drawing.Size(780, 720)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(244, 246, 248)

$title = New-Object System.Windows.Forms.Label
$title.Text = "LANForge Trade-In Scanner"
$title.Font = New-Object System.Drawing.Font("Arial", 18, [System.Drawing.FontStyle]::Bold)
$title.Location = New-Object System.Drawing.Point(20, 15)
$title.Size = New-Object System.Drawing.Size(720, 35)
$form.Controls.Add($title)

$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = "Enter customer details, scan this PC, generate reports, and submit to the LANForge API."
$subtitle.Font = New-Object System.Drawing.Font("Arial", 10)
$subtitle.Location = New-Object System.Drawing.Point(22, 50)
$subtitle.Size = New-Object System.Drawing.Size(720, 24)
$form.Controls.Add($subtitle)

function Add-Label {
    param($Text, $X, $Y)

    $label = New-Object System.Windows.Forms.Label
    $label.Text = $Text
    $label.Location = New-Object System.Drawing.Point($X, $Y)
    $label.Size = New-Object System.Drawing.Size(140, 22)
    $label.Font = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Bold)
    $form.Controls.Add($label)

    return $label
}

function Add-TextBox {
    param($X, $Y, $Width, $DefaultText = "")

    $box = New-Object System.Windows.Forms.TextBox
    $box.Location = New-Object System.Drawing.Point($X, $Y)
    $box.Size = New-Object System.Drawing.Size($Width, 24)
    $box.Text = $DefaultText
    $form.Controls.Add($box)

    return $box
}

Add-Label "Customer Name *" 25 95
$nameBox = Add-TextBox 170 92 550 ""

Add-Label "Customer Email *" 25 130
$emailBox = Add-TextBox 170 127 550 ""

Add-Label "Customer Phone" 25 165
$phoneBox = Add-TextBox 170 162 550 ""

Add-Label "Trade / Order Code" 25 200
$codeBox = Add-TextBox 170 197 550 ""

Add-Label "API Base URL" 25 235
$apiBox = Add-TextBox 170 232 550 "http://localhost:3000/api"

$notice = New-Object System.Windows.Forms.Label
$notice.Text = "Default submit endpoint becomes: http://localhost:3000/api/trade-ins"
$notice.Location = New-Object System.Drawing.Point(170, 260)
$notice.Size = New-Object System.Drawing.Size(550, 22)
$notice.ForeColor = [System.Drawing.Color]::FromArgb(107, 114, 128)
$form.Controls.Add($notice)

$scanButton = New-Object System.Windows.Forms.Button
$scanButton.Text = "Scan + Create Reports"
$scanButton.Location = New-Object System.Drawing.Point(25, 300)
$scanButton.Size = New-Object System.Drawing.Size(180, 38)
$scanButton.BackColor = [System.Drawing.Color]::FromArgb(17, 24, 39)
$scanButton.ForeColor = [System.Drawing.Color]::White
$form.Controls.Add($scanButton)

$submitButton = New-Object System.Windows.Forms.Button
$submitButton.Text = "Submit to API"
$submitButton.Location = New-Object System.Drawing.Point(220, 300)
$submitButton.Size = New-Object System.Drawing.Size(160, 38)
$submitButton.Enabled = $false
$form.Controls.Add($submitButton)

$openFolderButton = New-Object System.Windows.Forms.Button
$openFolderButton.Text = "Open Report Folder"
$openFolderButton.Location = New-Object System.Drawing.Point(395, 300)
$openFolderButton.Size = New-Object System.Drawing.Size(170, 38)
$openFolderButton.Enabled = $false
$form.Controls.Add($openFolderButton)

$exitButton = New-Object System.Windows.Forms.Button
$exitButton.Text = "Exit"
$exitButton.Location = New-Object System.Drawing.Point(580, 300)
$exitButton.Size = New-Object System.Drawing.Size(140, 38)
$form.Controls.Add($exitButton)

$logLabel = New-Object System.Windows.Forms.Label
$logLabel.Text = "Scanner Log"
$logLabel.Font = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)
$logLabel.Location = New-Object System.Drawing.Point(25, 360)
$logLabel.Size = New-Object System.Drawing.Size(200, 24)
$form.Controls.Add($logLabel)

$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Location = New-Object System.Drawing.Point(25, 390)
$logBox.Size = New-Object System.Drawing.Size(695, 245)
$logBox.Multiline = $true
$logBox.ScrollBars = "Vertical"
$logBox.ReadOnly = $true
$logBox.BackColor = [System.Drawing.Color]::White
$form.Controls.Add($logBox)

$footer = New-Object System.Windows.Forms.Label
$footer.Text = "$CompanyName - $ToolName v$Version"
$footer.Location = New-Object System.Drawing.Point(25, 648)
$footer.Size = New-Object System.Drawing.Size(695, 24)
$footer.ForeColor = [System.Drawing.Color]::FromArgb(107, 114, 128)
$form.Controls.Add($footer)

$scanButton.Add_Click({
    if ([string]::IsNullOrWhiteSpace($nameBox.Text)) {
        [System.Windows.Forms.MessageBox]::Show("Customer name is required.", "Missing Info")
        return
    }

    if ([string]::IsNullOrWhiteSpace($emailBox.Text)) {
        [System.Windows.Forms.MessageBox]::Show("Customer email is required.", "Missing Info")
        return
    }

    $scanButton.Enabled = $false
    $submitButton.Enabled = $false
    $openFolderButton.Enabled = $false

    try {
        Add-Log $logBox "Starting scan..."

        $report = Get-LANForgeScan `
            -CustomerName $nameBox.Text `
            -CustomerEmail $emailBox.Text `
            -CustomerPhone $phoneBox.Text `
            -InputTradeCode $codeBox.Text `
            -LogBox $logBox

        Add-Log $logBox "Scan complete."
        Add-Log $logBox "ZIP ready: $Global:LastZipPath"

        $submitButton.Enabled = $true
        $openFolderButton.Enabled = $true

        [System.Windows.Forms.MessageBox]::Show("Scan complete. You can now submit to the API.", "LANForge Scanner")
    } catch {
        Add-Log $logBox "Scan failed: $($_.Exception.Message)"
        [System.Windows.Forms.MessageBox]::Show("Scan failed: $($_.Exception.Message)", "Error")
    }

    $scanButton.Enabled = $true
})

$submitButton.Add_Click({
    if ($null -eq $Global:LastReport) {
        [System.Windows.Forms.MessageBox]::Show("Run a scan first.", "No Report")
        return
    }

    $submitButton.Enabled = $false

    $response = Submit-LANForgeTradeIn `
        -Report $Global:LastReport `
        -ApiBaseUrl $apiBox.Text `
        -LogBox $logBox

    if ($response) {
        [System.Windows.Forms.MessageBox]::Show("Trade-in submitted successfully.", "Submitted")
    } else {
        [System.Windows.Forms.MessageBox]::Show("Submission failed. Check the log.", "API Error")
    }

    $submitButton.Enabled = $true
})

$openFolderButton.Add_Click({
    if ($Global:LastReportFolder -and (Test-Path $Global:LastReportFolder)) {
        Start-Process explorer.exe $Global:LastReportFolder
    }
})

$exitButton.Add_Click({
    $form.Close()
})

Add-Log $logBox "Ready."
Add-Log $logBox "Run as Administrator for best results."

[void]$form.ShowDialog()