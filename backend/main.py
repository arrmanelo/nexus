from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import sources, chat, studio, auth
import os

app = FastAPI(title="OceanMind API", version="0.1.0")

cors_origins_raw = os.getenv("CORS_ORIGINS", "")
extra_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://nexuss-1.vercel.app",
] + extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,    prefix="/api/auth",    tags=["auth"])
app.include_router(sources.router, prefix="/api/sources", tags=["sources"])
app.include_router(chat.router,    prefix="/api/chat",    tags=["chat"])
app.include_router(studio.router,  prefix="/api/studio",  tags=["studio"])

@app.get("/api/health")
def health():
    return {"status": "ok"}