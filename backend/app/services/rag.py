from app.core.gemini import model
from app.core.supabase import supabase

def chunk_text(text: str, size: int = 1000, overlap: int = 150) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        chunks.append(text[start:start + size])
        start += size - overlap
    return [c for c in chunks if c.strip()]

async def store_chunks(source_id: str, chunks: list[str]):
    rows = [
        {"source_id": source_id, "content": chunk, "index": i}
        for i, chunk in enumerate(chunks)
    ]
    if rows:
        supabase.table("chunks").insert(rows).execute()

def retrieve_chunks(source_ids: list[str], limit: int = 8) -> list[str]:
    if not source_ids:
        return []
    try:
        res = (
            supabase.table("chunks")
            .select("content")
            .in_("source_id", source_ids)
            .limit(limit)
            .execute()
        )
        return [row["content"] for row in res.data]
    except Exception:
        return []

async def retrieve_and_answer(query: str, source_ids: list[str]) -> str:
    chunks = retrieve_chunks(source_ids)

    if not chunks:
        return "Источники не найдены или не содержат текста. Пожалуйста, загрузите документы и выберите их в панели слева."

    context = "\n\n---\n\n".join(chunks)

    prompt = f"""Ты — умный ассистент для работы с документами. 
Отвечай только на основе предоставленного контекста из документов пользователя.
Если ответа нет в контексте — так и скажи.
Отвечай на том же языке, на котором задан вопрос.

КОНТЕКСТ ИЗ ДОКУМЕНТОВ:
{context}

ВОПРОС ПОЛЬЗОВАТЕЛЯ:
{query}

ОТВЕТ:"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Ошибка при генерации ответа: {str(e)}"