@echo off
cd /d "c:\Users\User\Desktop\Invitation Project"
powershell -ExecutionPolicy Bypass -NoProfile -Command "Get-Content db/schema.sql | railway ssh -s postgres 'psql -U postgres -d railway'"
