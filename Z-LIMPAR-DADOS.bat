@echo off
title ZERAR DADOS DO CONTAI (NUVEM)
color 0C
echo ==========================================================
echo AVISO: ISSO VAI APAGAR TODOS OS DADOS DA CONTA NO SUPABASE
echo MANTENDO APENAS O SEU ACESSO DE ADMINISTRADOR (maiconbatn5@)
echo ISSO NAO PODE SER DESFEITO! Pressione Ctrl+C caso queira cancelar ou feche a tela.
echo ==========================================================
pause
echo Processando varredura termonuclear...

cd /d C:\Users\MaiconBatn\Downloads\BOTLP\Asset-Attachment-Manager
call npx node Z-WIPE-DB.mjs

echo.
echo ==========================================================
echo Operacao finalizada com sucesso! 
echo Agora de dois cliques no Z-REINICIAR-TUDO.bat para recriar 
echo apenas o seu usuario de administrador do zero absoluto.
echo ==========================================================
pause
