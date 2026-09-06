#!/bin/bash

PORTS=(3000 3001 3002 3003 3004 3005 4200 4201 4202 4203 4204)

echo "🔍 Buscando procesos en puertos: ${PORTS[*]}"

for port in "${PORTS[@]}"; do
  pids=$(lsof -ti ":$port")
  if [ -n "$pids" ]; then
    echo "  ❌ Puerto $port — matando PID(s): $pids"
    echo "$pids" | xargs kill -9
  else
    echo "  ✅ Puerto $port — libre"
  fi
done

echo ""
echo "✅ Listo"
