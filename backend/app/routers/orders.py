from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from app.services.order_service import OrderService
from app.models.order import OrderCreate, OrderUpdate, OrderResponse
from app.auth.permissions import require_role, require_manager

router = APIRouter()

@router.get("/", response_model=List[dict])
async def list_orders(
    order_type: Optional[str] = None,
    status: Optional[str] = None,
    branch_id: Optional[UUID] = None,
    user=Depends(require_manager())
):
    # Restrict managers to their own branch if they aren't admins?
    # For now, following the blueprint: Managers see all orders
    return OrderService.list_orders(order_type, status, branch_id)

@router.get("/{id}", response_model=dict)
async def get_order(
    id: UUID,
    user=Depends(require_manager())
):
    return OrderService.get_order(id)

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_order(
    order: OrderCreate,
    user=Depends(require_manager())
):
    return OrderService.create_order(order, user["id"])

@router.put("/{id}/status", response_model=dict)
async def update_order_status(
    id: UUID,
    status_update: OrderUpdate,
    user=Depends(require_manager())
):
    if not status_update.status:
        raise HTTPException(status_code=400, detail="Status is required")
    return OrderService.update_order_status(id, status_update.status, user["id"])
