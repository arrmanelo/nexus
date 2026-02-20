from fastapi import APIRouter, HTTPException, Header
from app.models.schemas import ChatMessage, ChatResponse
from app.core.supabase import supabase
from app.core.gemini import model
from typing import Optional

router = APIRouter()

def get_user_id(authorization: str) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Не авторизован")

@router.post("/", response_model=ChatResponse)
async def chat(
    body: ChatMessage,
    authorization: Optional[str] = Header(None)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Не авторизован")

    user_id = get_user_id(authorization)

    # Достаём контент выбранных источников
    try:
        res = supabase.table("sources")\
            .select("id, name, content")\
            .in_("id", body.source_ids)\
            .eq("user_id", user_id)\
            .execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    sources = res.data
    print(f"Найдено источников: {len(sources)}")

    if not sources:
        raise HTTPException(
            status_code=400,
            detail="Источники не найдены. Загрузите документы и выберите их слева."
        )

    # Собираем контекст
    context_parts = []
    sources_used = []
    for s in sources:
        if s.get("content"):
            context_parts.append(f"=== {s['name']} ===\n{s['content']}")
            sources_used.append(s["id"])

    if not context_parts:
        raise HTTPException(
            status_code=400,
            detail="Выбранные источники не содержат текста."
        )

    context = "\n\n".join(context_parts)

    # Строим промпт
    prompt = f"""Ты умный ИИ-ассистент. Отвечай ТОЛЬКО на основе предоставленных документов.
Если ответа нет в документах — так и скажи.
Отвечай на том языке, на котором задан вопрос.

ДОКУМЕНТЫ:
{context[:40000]}

ВОПРОС: {body.message}

ОТВЕТ:"""

    try:
        response = model.generate_content(prompt)
        answer = response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка Gemini: {str(e)}")

    return ChatResponse(answer=answer, sources_used=sources_used)