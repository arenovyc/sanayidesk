#!/bin/bash
cd "$(dirname "$0")"
echo "Next.js / port 3000 kapatiliyor..."
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
lsof -ti:3000,3001 2>/dev/null | xargs kill -9 2>/dev/null
sleep 1
if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Hala acik. Terminal penceresine gecip Ctrl+C bas."
else
  echo "Tamam. 3000 bos — log akisi durmali."
fi
echo
read -r -p "Kapatmak icin Enter..."
