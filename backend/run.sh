#!/bin/bash

# Install dependencies using uv
uv sync --frozen

# Apply database migrations
uv run python manage.py migrate

# Start Gunicorn processes
exec uv run gunicorn dosealert.wsgi:application --bind 0.0.0.0:8000 --workers 3
