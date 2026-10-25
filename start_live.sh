#!/bin/bash
# ================================================================
# EMBER EOC — Launch Live Online Website (Zero-Cost Public Tunnel)
# ================================================================

cd "$(dirname "$0")"

# Check if port 5001 is running
if ! lsof -i :5001 > /dev/null 2>&1; then
    echo "Starting EMBER backend server..."
    source .venv/bin/activate
    python app.py &
    sleep 2
fi

echo "=========================================================="
echo " Launching EMBER live to the world on Cloudflare Edge..."
echo "=========================================================="
./cloudflared tunnel --url http://127.0.0.1:5001
