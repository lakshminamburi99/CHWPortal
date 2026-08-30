from fastapi import APIRouter
from app.schemas.notification import VoiceTranscribeRequest, VoiceTranscribeResponse
from app.services.ai_service import GeminiAIService

router = APIRouter()

@router.post("/transcribe", response_model=VoiceTranscribeResponse)
def transcribe_voice(payload: VoiceTranscribeRequest):
    result = GeminiAIService.transcribe_and_extract_entities(options=payload.options)
    return VoiceTranscribeResponse(
        transcript=result["transcript"],
        suggestedOption=result["suggestedOption"]
    )
