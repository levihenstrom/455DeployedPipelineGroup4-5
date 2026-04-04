# Inference API for fraud/delivery (FastAPI + scikit-learn).
# Build from REPOSITORY ROOT (required so paths match predict.py):
#   docker build -f ml/Dockerfile .
#
# Railway: New service → GitHub repo → Settings → set Dockerfile path to `ml/Dockerfile`
#   (leave root directory as repo root, or set build context to ".").
# Env: optional INFERENCE_API_KEY (require matching x-api-key from Next.js ML_INFERENCE_API_KEY).

FROM python:3.12-slim-bookworm

WORKDIR /app
COPY ml/requirements.txt ml/requirements.txt
RUN pip install --no-cache-dir -r ml/requirements.txt

COPY ml ml

WORKDIR /app/ml/src
ENV PYTHONUNBUFFERED=1

EXPOSE 8000
CMD ["sh", "-c", "exec uvicorn inference_server:app --host 0.0.0.0 --port ${PORT:-8000}"]
