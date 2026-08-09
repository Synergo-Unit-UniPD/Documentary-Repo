from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True, slots=True)
class Prompt:
    system_text: str
    user_text: str


@dataclass(frozen=True, slots=True)
class Proposal:
    content: str
    operation_type: str
    created_at: datetime
