@echo off
echo ===================================================
echo   CERRANDO O SERVIDOR ANTIGO E LIGANDO O NOVO...
echo ===================================================
echo.
echo Fechando servidores antigos que estavam travando a porta...
taskkill /IM node.exe /F >nul 2>&1
echo.
echo Tudo limpo! Subindo o servidor com as integracoes do Supabase...
timeout /t 2 >nul
call "%~dp0iniciar-prospectalp.bat"
