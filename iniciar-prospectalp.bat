@echo off
setlocal

cd /d C:\Users\MaiconBatn\Music\Contai\Contai-App

set API_PORT=3000
set PORT=5173
set BASE_PATH=/

rem Mantem um subdominio publico fixo para as demos sempre que o app subir.
set DEMO_TUNNEL_SUBDOMAIN=maiconbatn-prospectalp

call C:\Users\MaiconBatn\AppData\Roaming\npm\pnpm.cmd dev
