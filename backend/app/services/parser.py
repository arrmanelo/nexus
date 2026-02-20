from pathlib import Path

async def parse_file(path: str, mime_type: str) -> str:
    ext = Path(path).suffix.lower()

    try:
        if ext == ".pdf":
            return _parse_pdf(path)
        elif ext in (".docx", ".doc"):
            return _parse_docx(path)
        elif ext == ".txt":
            return _parse_txt(path)
        elif ext == ".csv":
            return _parse_txt(path)
        elif ext in (".jpg", ".jpeg", ".png", ".webp"):
            return await _parse_image(path)
        else:
            return _parse_txt(path)
    except Exception as e:
        return f"Ошибка парсинга файла: {str(e)}"

def _parse_pdf(path: str) -> str:
    from pypdf import PdfReader
    reader = PdfReader(path)
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n\n".join(pages)

def _parse_docx(path: str) -> str:
    from docx import Document
    doc = Document(path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)

def _parse_txt(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

async def _parse_image(path: str) -> str:
    from app.core.gemini import model
    import PIL.Image
    img = PIL.Image.open(path)
    response = model.generate_content([
        "Опиши подробно что написано и изображено на этом изображении. Извлеки весь текст если есть.",
        img
    ])
    return response.text