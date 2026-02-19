FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install c2patool (v0.26.1)
RUN wget -q https://github.com/contentauth/c2pa-rs/releases/download/c2patool-v0.26.1/c2patool-v0.26.1-x86_64-unknown-linux-gnu.tar.gz \
    && tar -xzf c2patool-v0.26.1-x86_64-unknown-linux-gnu.tar.gz \
    && mv c2patool-v0.26.1-x86_64-unknown-linux-gnu/c2patool /usr/local/bin/ \
    && rm c2patool-v0.26.1-x86_64-unknown-linux-gnu.tar.gz \
    && rm -rf c2patool-v0.26.1-x86_64-unknown-linux-gnu

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
