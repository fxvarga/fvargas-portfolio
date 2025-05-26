# Set the root directory of your project
$projectRoot = "C:\Users\fevargas\Source\repos\fernandovargas\frontend\portfolio-react"

# Directories to exclude
$excludeDirs = @("node_modules", "build", "dist", ".git")

# Get all .js files, excluding specified directories
$jsFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter "*.js" |
    Where-Object {
        $excluded = $false
        foreach ($dir in $excludeDirs) {
            if ($_.FullName -like "*\$dir\*") {
                $excluded = $true
                break
            }
        }
        -not $excluded
    }

# Counter for renamed files
$count = 0

# Rename each file
foreach ($file in $jsFiles) {
    # Check if file contains JSX syntax
    $content = Get-Content -Path $file.FullName -Raw
    $newExt = ".tsx" # Default to .tsx for React components

    # If you want to check for JSX syntax and only rename those to .tsx
    # (optional - you can remove this check if you want all .js to become .tsx)
    if (-not ($content -match "<.*>|React\.createElement|jsx")) {
        $newExt = ".ts" # Change to .ts for non-JSX files
    }

    $newName = $file.DirectoryName + "\" + $file.BaseName + $newExt

    # Rename the file
    Rename-Item -Path $file.FullName -NewName $newName -Force

    # Update import statements in the file
    $newContent = $content -replace '\.js"', '$newExt"' -replace "\.js'", "$newExt'"
    Set-Content -Path $newName -Value $newContent

    Write-Host "Renamed: $($file.FullName) -> $newName"
    $count++
}

Write-Host "Completed! Renamed $count files."

# Now update import statements in all TypeScript files
$tsFiles = Get-ChildItem -Path $projectRoot -Recurse -Include "*.ts", "*.tsx" |
    Where-Object {
        $excluded = $false
        foreach ($dir in $excludeDirs) {
            if ($_.FullName -like "*\$dir\*") {
                $excluded = $true
                break
            }
        }
        -not $excluded
    }

$updateCount = 0

foreach ($file in $tsFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $oldContent = $content

    # Update import paths from .js to .ts or .tsx
    $content = $content -replace 'from\s+[''"](.+?)\.js[''"]', 'from "$1.tsx"'

    # If content was changed, save it
    if ($content -ne $oldContent) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Updated imports in: $($file.FullName)"
        $updateCount++
    }
}

Write-Host "Updated imports in $updateCount files."