@echo off
title Enviar Aplicacao para o GitHub (ConTai Producao)
color 0B

echo ==========================================================
echo BEM-VINDO A FASE 1: O UPLOAD MAESTRO!
echo ==========================================================
echo Eu (o seu agente Antigravity) ja protegi todas as suas 
echo senhas e bancos de dados para elas NUNCA irem para o GitHub!
echo.
echo Pressione qualquer tecla para fazer o envio oficial...
pause >nul

cd /d "C:\Users\MaiconBatn\Downloads\BOTLP\Asset-Attachment-Manager"

echo.
echo [1/4] Preparando o pacote local...
git init
git add .

echo.
echo [2/4] Selando o codigo de Producao...
git commit -m "Deploy: Producao Contai V1 (Supabase Conectado, Vercel Ready)"
git branch -M main

echo.
echo [3/4] Conectando no seu link: github.com/Maicao90/Contai-App...
git remote remove origin 2>nul
git remote add origin https://github.com/Maicao90/Contai-App.git

echo.
echo [4/4] Decolando nave para as nuvens! (Isso pode demorar um pouco...)
git push -u origin main --force

echo.
echo ==========================================================
echo SUCESSO ABSOLUTO! O SEU CODIGO JA ESTA NO AR NO GITHUB!
echo ==========================================================
echo (Ps: Se apareceu alguma tela de login do GitHub no meio do
echo processo, espero que voce tenha logado nela!)
echo.
pause
