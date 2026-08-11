from fastapi import APIRouter, Depends

from .schemas import AIOperationRequest, AIOperationResponse
from API_business_layer.di.providers import get_ai_service
from AI_Domain.service import AIService

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/operations", response_model=AIOperationResponse)
async def request_operation(
    request: AIOperationRequest,
    ai_service: AIService = Depends(get_ai_service),
) -> AIOperationResponse:
    proposal = await ai_service.request_operation(
        type=request.type,
        text=request.text,
        params=request.params,
    )
    return AIOperationResponse(
        content=proposal.content,
        operation_type=proposal.operation_type,
        created_at=proposal.created_at,
    )


@router.get("/operations", response_model=list[str])
async def list_operations(
    ai_service: AIService = Depends(get_ai_service),
) -> list[str]:
    return ai_service.list_operations()
