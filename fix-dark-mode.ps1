# PowerShell script to fix all remaining white backgrounds and improve dark mode
$appPath = "d:\GRADUATION PROJECT [GLOBAL LINK]\Front End\globallinkroleselection_2 ultimate\app"

# Get all .tsx files
$files = Get-ChildItem -Path $appPath -Filter *.tsx -Recurse -File

$replacements = @{
    'className="bg-white ' = 'className="bg-card '
    'className="bg-white"' = 'className="bg-card"'
    'bg-white '            = 'bg-card '
    'text-gray-900'        = 'text-foreground'
    'text-gray-800'        = 'text-foreground'
    'text-gray-700'        = 'text-foreground'
    'text-gray-600'        = 'text-muted-foreground'
    'text-gray-500'        = 'text-muted-foreground'
    'text-gray-400'        = 'text-muted-foreground'
    'bg-gray-50'           = 'bg-background'
    'bg-gray-100'          = 'bg-muted'
    'border-gray-200'      = 'border-border'
    'border-gray-300'      = 'border-border'
}

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $originalContent = $content
    $fileModified = $false
    
    foreach ($pattern in $replacements.Keys) {
        $replacement = $replacements[$pattern]
        if ($content -match [regex]::Escape($pattern)) {
            $content = $content -replace [regex]::Escape($pattern), $replacement
            $fileModified = $true
            $totalReplacements++
        }
    }
    
    if ($fileModified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✓ Updated: $($file.Name)" -ForegroundColor Green
        $totalFiles++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Dark Mode Fix Complete!" -ForegroundColor Cyan
Write-Host "Files updated: $totalFiles" -ForegroundColor Yellow
Write-Host "Total replacements: $totalReplacements" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
