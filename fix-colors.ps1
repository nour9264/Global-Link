# PowerShell script to replace hardcoded colors with theme-aware classes
# This script will update all .tsx files in the app directory

$rootPath = "d:\GRADUATION PROJECT [GLOBAL LINK]\Front End\globallinkroleselection_2 ultimate\app"

# Define replacements
$replacements = @{
    'text-gray-900' = 'text-foreground'
    'text-gray-800' = 'text-foreground'
    'text-gray-700' = 'text-foreground'
    'text-gray-600' = 'text-muted-foreground'
    'text-gray-500' = 'text-muted-foreground'
    'text-gray-400' = 'text-muted-foreground'
    'bg-white' = 'bg-card'
    'bg-gray-50' = 'bg-background'
    'bg-gray-100' = 'bg-muted'
    'border-gray-200' = 'border-border'
    'border-gray-300' = 'border-border'
}

# Get all .tsx files
$files = Get-ChildItem -Path $rootPath -Filter *.tsx -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    foreach ($old in $replacements.Keys) {
        $new = $replacements[$old]
        if ($content -match $old) {
            $content = $content -replace $old, $new
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Color replacement complete!"
