#!/bin/bash

cd "$(dirname "$0")/game"

if [ ! -d "node_modules" ]; then
    echo "node_modules wurde nicht gefunden."
    echo "Fuehre zuerst npm install aus..."
    npm install
fi

open http://localhost:5173

npm run dev