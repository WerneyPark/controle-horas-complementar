$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$AppDir = $PSScriptRoot

# Atalho no Desktop
$ShortcutPath = Join-Path $DesktopPath "Controle de Horas Complementares.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = Join-Path $AppDir "Iniciar.bat"
$Shortcut.WorkingDirectory = $AppDir
$Shortcut.WindowStyle = 7 # Minimized para nao piscar prompt
$Shortcut.Description = "Aplicativo de Controle de Horas Complementares"

$IconPath = Join-Path $AppDir "src-tauri\icons\icon.ico"
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = "$IconPath,0"
}
$Shortcut.Save()

Write-Host "Atalho criado com sucesso na Area de Trabalho: $ShortcutPath"
