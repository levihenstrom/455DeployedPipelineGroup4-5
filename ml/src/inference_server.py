"""
HTTP inference API for Vercel + other hosts that cannot run Python inline.

Run from repo root (so ml/models resolves):
  pip install -r ml/requirements.txt
  cd ml/src && uvicorn inference_server:app --host 0.0.0.0 --port 8000

Production (e.g. Railway): set PORT; optional INFERENCE_API_KEY and send header x-api-key.
"""
from __future__ import annotations

import os
from typing import Literal

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from predict import predict

app = FastAPI(title="Shop ML inference", version="1.0.0")


class PredictBody(BaseModel):
    task: Literal["fraud", "delivery"]
    payload: dict


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict")
def predict_route(
    body: PredictBody,
    x_api_key: str | None = Header(default=None, alias="x-api-key"),
) -> dict:
    expected = os.getenv("INFERENCE_API_KEY", "").strip()
    if expected and (x_api_key or "").strip() != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    try:
        return predict(body.task, body.payload)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
