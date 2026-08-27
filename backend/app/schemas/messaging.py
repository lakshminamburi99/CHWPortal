from pydantic import BaseModel, ConfigDict
from datetime import datetime

class MessageCreate(BaseModel):
    recipientId: str
    content: str

class MessageSchema(BaseModel):
    id: str
    senderId: str
    recipientId: str
    content: str
    createdAt: datetime
    read: bool

    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_generator=lambda x: ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(x.split('_'))))
