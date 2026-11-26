# Project 5.1 - Container image for the Task Tracker API.
# Build from the level4 folder's parent:
#   docker build -f level5/Dockerfile -t task-tracker:1.0 level4/task_app
# Run:
#   docker run --rm -p 8000:8000 -v taskdata:/data task-tracker:1.0
FROM python:3.12-slim

WORKDIR /app
ENV TASK_DB=/data/tasks.db PIP_NO_CACHE_DIR=1

# Install dependencies first so Docker can cache this layer.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the application code (never secrets, never .db files).
COPY main.py .
COPY static/ static/

# Persist the SQLite database outside the container filesystem.
VOLUME ["/data"]
EXPOSE 8000

# Run as a non-root user; uvicorn binds 0.0.0.0 so the port mapping works.
RUN useradd --system appuser && mkdir -p /data && chown appuser /data
USER appuser
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
