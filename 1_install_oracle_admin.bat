@echo off
echo =======================================================================
echo Launching Oracle AI Database Free 26ai Installer with Admin Elevation
echo =======================================================================
powershell -Command "Start-Process -FilePath '%USERPROFILE%\Downloads\oracle-ai-database-free-26ai-23.26.3.windows.x64\install_oracle_admin.bat' -Verb RunAs"
