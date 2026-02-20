from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import sources, chat, studio, auth

app = FastAPI(title="OceanMind API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
