from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.api.deps import get_db
from app.models.training import TrainingLessonModel
from app.models.user import ChwModel
from app.models.notification import NotificationModel
from app.schemas.training import (
    TrainingLessonSchema,
    TrainingProgressUpdate,
    TrainingAssignRequest,
)

router = APIRouter()

def to_lesson_schema(l: TrainingLessonModel) -> TrainingLessonSchema:
    return TrainingLessonSchema(
        id=l.id,
        title=l.title,
        category=l.category,
        durationMinutes=l.duration_minutes,
        difficulty=l.difficulty,
        progress=l.progress,
        recommended=l.recommended,
        recommendationReason=l.recommendation_reason,
        slides=l.slides,
    )

@router.get("/lessons", response_model=List[TrainingLessonSchema])
def list_lessons(db: Session = Depends(get_db)):
    lessons = db.query(TrainingLessonModel).all()
    return [to_lesson_schema(l) for l in lessons]

@router.get("/lessons/{id}", response_model=TrainingLessonSchema)
def get_lesson(id: str, db: Session = Depends(get_db)):
    lesson = db.query(TrainingLessonModel).filter(TrainingLessonModel.id == id).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="LESSON_NOT_FOUND")
    return to_lesson_schema(lesson)

@router.post("/lessons/{id}/progress", response_model=TrainingLessonSchema)
def update_progress(id: str, payload: TrainingProgressUpdate, db: Session = Depends(get_db)):
    lesson = db.query(TrainingLessonModel).filter(TrainingLessonModel.id == id).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="LESSON_NOT_FOUND")

    lesson.progress = max(lesson.progress, round(payload.progress))
    db.commit()
    db.refresh(lesson)
    return to_lesson_schema(lesson)

@router.post("/lessons/{id}/assign", response_model=TrainingLessonSchema)
def assign_lesson(id: str, payload: TrainingAssignRequest, db: Session = Depends(get_db)):
    lesson = db.query(TrainingLessonModel).filter(TrainingLessonModel.id == id).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="LESSON_NOT_FOUND")

    chw = db.query(ChwModel).filter(ChwModel.id == payload.chwId).first() if payload.chwId else None
    assigned_name = f" to {chw.name}" if chw else ""

    now_iso = datetime.now(timezone.utc).isoformat()
    ntf_count = db.query(NotificationModel).count()
    new_ntf = NotificationModel(
        id=f"ntf-{ntf_count + 1}",
        category="TRAINING",
        title="New lesson assigned",
        body=f"{lesson.title} ({lesson.duration_minutes} min) was assigned{assigned_name}.",
        created_at=now_iso,
        read=False,
        audience="CHW",
    )
    db.add(new_ntf)

    db.commit()
    db.refresh(lesson)
    return to_lesson_schema(lesson)

@router.post("/lessons/{id}/reset", response_model=TrainingLessonSchema)
def reset_lesson(id: str, db: Session = Depends(get_db)):
    lesson = db.query(TrainingLessonModel).filter(TrainingLessonModel.id == id).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="LESSON_NOT_FOUND")

    lesson.progress = 0
    db.commit()
    db.refresh(lesson)
    return to_lesson_schema(lesson)
