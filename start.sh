#!/bin/bash

# Check if required ports are already in use before starting Docker Compose
PORTS=(8000 3000 9200 6379)
CONFLICT=false

for PORT in "${PORTS[@]}"; do
  PID=$(lsof -ti :$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    echo "Port $PORT is already in use by process(es): $PID"
    lsof -i :$PORT 2>/dev/null
    echo ""
    CONFLICT=true
  fi
done

if [ "$CONFLICT" = true ]; then
  echo "Kill the above process(es) before starting, or press Ctrl+C to abort."
  read -p "Kill them automatically and continue? (y/N): " REPLY
  if [[ "$REPLY" =~ ^[Yy]$ ]]; then
    for PORT in "${PORTS[@]}"; do
      PID=$(lsof -ti :$PORT 2>/dev/null)
      if [ -n "$PID" ]; then
        kill $PID
        echo "Killed process(es) on port $PORT"
      fi
    done
    echo ""
  else
    exit 1
  fi
fi

docker compose up --build "$@"
