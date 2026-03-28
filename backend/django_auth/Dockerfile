# 1. Use a lightweight Python image
FROM python:3.11-slim

# 2. Set environment variables to keep Python clean
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 3. Set the working directory inside the container
WORKDIR /app

# 4. Install system dependencies (needed for Postgres and some Python libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 5. Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn  # Production-grade server

# 6. Copy the rest of your Django code
COPY . /app/

# 7. Start the application using Gunicorn
# Cloud Run provides the port via the $PORT environment variable
CMD gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2