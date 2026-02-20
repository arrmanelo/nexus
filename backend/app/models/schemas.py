from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SourceOut(BaseModel):
    id: str
    name: str
    type: str
    created_at: datetime
    enabled: bool = True

class ChatMessage(BaseModel):
    message: str
    source_ids: List[str]

class ChatResponse(BaseModel):
    answer: str
    sources_used: List[str]

class StudioRequest(BaseModel):
    source_ids: List[str]
    artifact_type: str  # test | cards | mindmap | summary | presentation | infographic

class StudioResponse(BaseModel):
    artifact_type: str
    content: dict
