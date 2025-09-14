#!/bin/bash

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
python manage.py migrate

# Start Gunicorn processes
exec gunicorn dosealert.wsgi:application --bind 0.0.0.0:8000 --workers 3
