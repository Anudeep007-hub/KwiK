#!/bin/bash

# Start the Geo Worker in the background (the '&' is crucial here)
echo "Starting Geo Worker..."
python -m services.workers.geoWorker &

# Start the FastAPI Web Server in the foreground
# We use ${PORT:-8000} so Render can inject its own port dynamically
echo "Starting FastAPI Server..."
python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}