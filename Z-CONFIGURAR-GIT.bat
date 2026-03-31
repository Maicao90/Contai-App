@echo off
title Configurar Identidade do Git
color 0E

echo ==========================================================
echo CONFIGURANDO SUA IDENTIDADE (PASSO UNICO)
echo ==========================================================
echo.

git config --global user.email "maicon@exemplo.com"
git config --global user.name "Maicon"

echo.
echo [!] IDENTIDADE CONFIGURADA COM SUCESSO!
echo [!] Agora voce ja pode rodar o Z-UPLOAD-GITHUB.bat tranquilaamente.
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
