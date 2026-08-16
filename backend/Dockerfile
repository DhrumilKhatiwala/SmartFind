FROM python:3.10-slim

WORKDIR /app

# Set environment variables for Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=7860

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source and data
COPY . .

# Expose standard Hugging Face Spaces port
EXPOSE 7860

# Start FastAPI application with uvicorn on port 7860
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "7860"]
