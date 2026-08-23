#!/bin/bash
# Test di integrazione di deploy: verifica avvio immagini, avvio container
# e comunicazione reale tra frontend e backend via rete Docker.

set -e
cd "$(dirname "$0")"

# Su alcune macchine Windows, eseguire Docker da Git Bash/WSL fallisce perché
# non riesce a invocare il gestore di credenziali di Docker Desktop
# (docker-credential-desktop.exe) - errore "exec format error". Le immagini
# usate qui sono pubbliche e non richiedono alcuna credenziale, quindi si
# aggira il problema puntando Docker a una configurazione minima e temporanea
# (senza credsStore), valida solo per questa esecuzione dello script e senza
# toccare la configurazione Docker reale dell'utente.
export DOCKER_CONFIG="$(mktemp -d)"
echo '{}' > "$DOCKER_CONFIG/config.json"

echo "== 1. Avvio immagine: build =="
docker compose build

echo "== 2. Avvio container =="
docker compose up -d

# Attesa attiva (fino a 30s) finché il backend risponde, invece di una pausa
# fissa: subito dopo un rebuild, l'avvio di FastAPI può richiedere qualche
# secondo in più rispetto a un avvio "a freddo" con immagini già pronte.
echo "In attesa che il backend sia pronto..."
for i in $(seq 1 15); do
  if curl -sf http://localhost:8000/api/status > /dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "== 3. Verifica stato container =="
BACKEND_STATUS=$(docker inspect -f '{{.State.Running}}' backend_mvp)
FRONTEND_STATUS=$(docker inspect -f '{{.State.Running}}' frontend_mvp)

if [ "$BACKEND_STATUS" != "true" ] || [ "$FRONTEND_STATUS" != "true" ]; then
  echo "FALLITO: uno o entrambi i container non sono attivi"
  docker compose logs
  exit 1
fi
echo "OK: entrambi i container sono attivi"

echo "== 4. Comunicazione con il backend =="
if ! curl -sf http://localhost:8000/api/status > /dev/null; then
  echo "FALLITO: backend non risponde su /api/status"
  exit 1
fi
echo "OK: backend raggiungibile"

echo "== 5. Comunicazione con il frontend =="
if ! curl -sf http://localhost:5173 > /dev/null; then
  echo "FALLITO: frontend non risponde"
  exit 1
fi
echo "OK: frontend raggiungibile"

echo "== 6. Comunicazione frontend -> backend (rete interna Docker) =="
if ! docker exec frontend_mvp wget -qO- http://backend:8000/api/status > /dev/null; then
  echo "FALLITO: il frontend non riesce a raggiungere il backend sulla rete interna"
  exit 1
fi
echo "OK: comunicazione interna frontend->backend funzionante"

echo ""
echo "Tutti i test di deploy sono passati."