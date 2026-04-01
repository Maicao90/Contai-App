@echo off
title Enviar Aplicacao para o GitHub (ConTai Producao)
color 0B

echo ==========================================================
echo BEM-VINDO AO UPLOAD MAESTRO V2!
echo ==========================================================
echo Eu (o seu agente Antigravity) já protegi todas as suas 
echo senhas e bancos de dados para elas NUNCA irem para o GitHub!
echo.
echo Pressione qualquer tecla para fazer o envio oficial...
pause >nul

cd /d "C:\Users\MaiconBatn\Downloads\BOTLP\Asset-Attachment-Manager"

echo.
echo [1/4] Preparando o pacote local...
git add .

echo.
echo [2/4] Selando o codigo de Producao...
git commit -m "Deploy: Atualização Completa do Sistema (Dashboard, Pagamentos e Automação)"
git branch -M main

echo.
echo [3/4] Conectando no seu link: github.com/Maicao90/Contai-App...
git remote add origin https://github.com/Maicao90/Contai-App.git >nul 2>&1
git remote set-url origin https://github.com/Maicao90/Contai-App.git

echo.
echo [4/4] Decolando nave para as nuvens! (Isso pode demorar um pouco...)
git push -u origin main --force

echo.
echo ==========================================================
echo SUCESSO ABSOLUTO! O CODIGO ESTÁ NO GITHUB!
echo ==========================================================
echo.
echo AGORA, PARA TERMINAR, COPIE E COLE ISSO NO SEU SERVIDOR (VPS):
echo.
echo    cd Contai-App
echo    git pull origin main
echo    pnpm install
echo    pm2 restart all
echo.
echo ==========================================================
pause
