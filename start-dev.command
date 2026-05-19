#!/bin/bash

cd "$(dirname "$0")/game"

if [ ! -d "node_modules" ]; then
    echo "node_modules wurde nicht gefunden."
    echo "Fuehre zuerst npm install aus..."
    npm install || exit 1
fi

npm run dev >/tmp/sakuradia-vite.log 2>&1 &
vite_pid=$!

until nc -z 127.0.0.1 5173 >/dev/null 2>&1; do
    sleep 1
done

open http://localhost:5173

wait "$vite_pid"
