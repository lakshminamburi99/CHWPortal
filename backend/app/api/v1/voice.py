from fastapi import APIRouter
from app.schemas.notification import VoiceTranscribeRequest, VoiceTranscribeResponse
import random

router = APIRouter()

MOCK_TRANSCRIPTS = [
    "The child has been vomiting.",
    "She has had a fever since yesterday.",
    "He is breathing quickly and seems tired.",
    "The caregiver says he is drinking a little water.",
]

@router.post("/transcribe", response_model=VoiceTranscribeResponse)
def transcribe_voice(payload: VoiceTranscribeRequest):
    transcript = random.choice(MOCK_TRANSCRIPTS)
    suggested_option = payload.options[0] if payload.options else None
    return VoiceTranscribeResponse(
        transcript=transcript,
        suggestedOption=suggested_option
    )
