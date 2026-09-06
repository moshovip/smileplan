@echo off
echo Запускаю туннель...
ssh -o StrictHostKeyChecking=no -R 80:localhost:5173 nokey@localhost.run
pause
