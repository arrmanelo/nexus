from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from app.core.supabase import supabase
from app.services.parser import parse_file
from app.services.rag import chunk_text, store_chunks
from typing import Optional
import uuid, os, tempfile

router = APIRouter()

def get_user_id(authorization: str) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Не авторизован")

@router.get("/")
async def get_sources(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Не авторизован")
    user_id = get_user_id(authorization)
    try:
        res = supabase.table("sources").select("*").eq("user_id", user_id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_source(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Не авторизован")
    user_id = get_user_id(authorization)

    original_name = file.filename
    ext = original_name.split(".")[-1].lower() if "." in original_name else "txt"
    tmp_path = None

    try:
        content_bytes = await file.read()

        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
            tmp.write(content_bytes)
            tmp_path = tmp.name

        content_text = await parse_file(tmp_path, file.content_type or "")
        print(f"Parsed [{original_name}]: {len(content_text)} символов")

        source_id = str(uuid.uuid4())

        # Сохраняем источник
        res = supabase.table("sources").insert({
            "id": source_id,
            "user_id": user_id,
            "name": original_name,
            "type": ext,
            "content": content_text[:50000],
            "enabled": True,
        }).execute()

        # Нарезаем на чанки и сохраняем для RAG
        chunks = chunk_text(content_text)
        await store_chunks(source_id, chunks)
        print(f"Stored {len(chunks)} chunks for [{original_name}]")

        return res.data[0]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

@router.patch("/{source_id}/toggle")
async def toggle_source(source_id: str, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Не авторизован")
    user_id = get_user_id(authorization)
    try:
        current = supabase.table("sources").select("enabled").eq("id", source_id).eq("user_id", user_id).execute()
        if not current.data:
            raise HTTPException(status_code=404, detail="Источник не найден")
        new_val = not current.data[0]["enabled"]
        res = supabase.table("sources").update({"enabled": new_val}).eq("id", source_id).execute()
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{source_id}")
async def delete_source(source_id: str, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Не авторизован")
    user_id = get_user_id(authorization)
    try:
        supabase.table("sources").delete().eq("id", source_id).eq("user_id", user_id).execute()
        return {"deleted": source_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))