from sqlalchemy import Column, String, Integer, Boolean, Text, JSON
from app.db.base import Base

class TrainingLessonModel(Base):
    __tablename__ = "training_lessons"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    difficulty = Column(String, nullable=False)  # Beginner, Intermediate, Advanced
    progress = Column(Integer, default=0)
    recommended = Column(Boolean, default=False)
    recommendation_reason = Column(String, nullable=True)
    slides = Column(JSON, nullable=False)  # List of slides
