from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Literal, Any

Difficulty = Literal["Beginner", "Intermediate", "Advanced"]

class TrainingLessonSchema(BaseModel):
    id: str
    title: str
    category: str
    durationMinutes: int
    difficulty: Difficulty
    progress: int
    recommended: bool
    recommendationReason: Optional[str] = None
    slides: List[Any]
    model_config = ConfigDict(from_attributes=True)

class TrainingProgressUpdate(BaseModel):
    progress: int

class TrainingAssignRequest(BaseModel):
    chwId: Optional[str] = None
