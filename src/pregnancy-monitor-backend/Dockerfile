# Stage 1: Install Node.js production dependencies
FROM node:22-bookworm-slim AS node-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Final Python + Node.js runtime (runs FastAPI ML + Express API in one service)
FROM python:3.11-slim-bookworm
WORKDIR /app

# Copy Node.js binary from Stage 1
COPY --from=node-deps /usr/local/bin/node /usr/local/bin/node

# System libraries needed by OpenCV and PyTorch
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch first to avoid multi-GB CUDA dependencies
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Node dependencies and application files
COPY --from=node-deps /app/node_modules ./node_modules
COPY package.json server.js main.py risk_model.pkl best_attention_unet_resnet34.pth ./

# Ensure uploads directory is writable even under non-root runtimes (e.g. Hugging Face Spaces)
RUN mkdir -p /app/uploads && chmod -R 777 /app/uploads

ENV PORT=7860
EXPOSE 7860

CMD ["sh", "-c", "uvicorn main:app --host 127.0.0.1 --port 8000 & exec node server.js"]
