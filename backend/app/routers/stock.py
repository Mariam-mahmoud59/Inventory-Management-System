from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status, HTTPException
from app.services.stock_service import StockService
from app.models.stock import StockAdjustmentRequest, StockTransferRequest
from app.auth.permissions import require_role, require_manager, require_staff

router = APIRouter()

@router.get("/", response_model=List[dict])
async def list_stock_levels(
    branch_id: Optional[UUID] = None,
    product_id: Optional[UUID] = None,
    user=Depends(require_role(["admin", "manager", "staff"]))
):
    # Enforce Staff branch isolation manually since we will bypass RLS
    if user["role"] == "staff":
        if branch_id and str(branch_id) != user["branch_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff can only view stock for their assigned branch"
            )
        branch_id = user["branch_id"]

    return StockService.list_stock_levels(branch_id, product_id)

@router.post(
    "/adjust",
    summary="Adjust stock level",
    description=(
        "Trigger a manual stock adjustment (e.g., for corrections, returns, or spoilage).\n"
        "Creates a transaction log and updates the current quantity for the specific branch.\n\n"
        "- **Roles**: Admin, Manager, and Staff"
    ),
    response_model=dict
)
async def adjust_stock(
    adjustment: StockAdjustmentRequest,
    user=Depends(require_staff())
):
    # Staff can only adjust stock for their assigned branch
    if user["role"] == "staff" and str(adjustment.branch_id) != user["branch_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff can only adjust stock for their own branch"
        )
    
    return StockService.adjust_stock(adjustment, user["id"])

@router.post("/transfer", response_model=dict)
async def transfer_stock(
    transfer: StockTransferRequest,
    user=Depends(require_manager())
):
    return StockService.transfer_stock(transfer, user["id"])
