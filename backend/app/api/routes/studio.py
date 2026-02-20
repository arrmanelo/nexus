from fastapi import APIRouter
from app.models.schemas import StudioRequest, StudioResponse

router = APIRouter()

@router.post("/generate", response_model=StudioResponse)
async def generate(body: StudioRequest):
    # TODO: per artifact_type — build specific prompt → Gemini → parse output
    # artifact_type: test | cards | mindmap | summary | presentation | infographic
    return StudioResponse(artifact_type=body.artifact_type, content={})
