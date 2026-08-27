from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Literal

AssessmentCategory = Literal["MATERNAL", "CHILD", "CHRONIC", "SURVEILLANCE"]
QuestionKind = Literal["choice", "measurement"]

class AssessmentQuestionDef(BaseModel):
    id: str
    prompt: str
    helpText: str
    options: List[str]
    kind: QuestionKind
    unit: Optional[str] = None

class AssessmentTemplateSchema(BaseModel):
    id: str
    category: AssessmentCategory
    name: str
    description: str
    durationMinutes: int
    questions: List[AssessmentQuestionDef]
    model_config = ConfigDict(from_attributes=True)

class AssessmentAnswer(BaseModel):
    questionId: str
    prompt: str
    value: str

class VitalsSchema(BaseModel):
    temperature: Optional[str] = None
    heartRate: Optional[str] = None
    respiratoryRate: Optional[str] = None
    oxygen: Optional[str] = None

class AssessmentSubmitRequest(BaseModel):
    patientId: str
    chwId: str
    templateId: str
    templateName: str
    answers: List[AssessmentAnswer]
    vitals: VitalsSchema
    notes: str
