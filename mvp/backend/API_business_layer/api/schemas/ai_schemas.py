from datetime import datetime

from pydantic import BaseModel, Field


class AIOperationRequest(BaseModel):
    type: str = Field(..., description="Identificativo dell'operazione, es. 'summarize', 'translate', 'hat_analysis'")
    text: str = Field(..., description="Testo su cui operare (selezione o intera nota)")
    params: dict = Field(default_factory=dict, description="Parametri specifici dell'operazione, es. target_language, hat_type, user_prompt")


class AIOperationResponse(BaseModel):
    content: str
    operation_type: str
    created_at: datetime
