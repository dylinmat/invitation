@echo off
ECHO ==========================================================
ECHO EIOS Deployment Script
ECHO ==========================================================
ECHO.

REM Check if railway CLI is installed
WHERE railway >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    ECHO Railway CLI not found. Installing...
    npm install -g @railway/cli
)

ECHO Step 1: Building API...
cd apps/api
call npm run build
IF %ERRORLEVEL% NEQ 0 (
    ECHO API build failed!
    exit /b 1
)
cd ..\..

ECHO.
ECHO Step 2: Deploying API Service...
railway up --service api
IF %ERRORLEVEL% NEQ 0 (
    ECHO API deployment failed!
    exit /b 1
)

ECHO.
ECHO Step 3: Deploying Web Service...
railway up --service web
IF %ERRORLEVEL% NEQ 0 (
    ECHO Web deployment failed!
    exit /b 1
)

ECHO.
ECHO Step 4: Running Database Migrations...
railway run --service api npm run migrate
IF %ERRORLEVEL% NEQ 0 (
    ECHO Migration failed!
    exit /b 1
)

ECHO.
ECHO ==========================================================
ECHO Deployment Complete!
ECHO ==========================================================
ECHO.
ECHO Check your deployment at:
ECHO - API: https://invitation-production-db10.up.railway.app
ECHO - Web: https://invitation-production-db10.up.railway.app
ECHO.
PAUSE
