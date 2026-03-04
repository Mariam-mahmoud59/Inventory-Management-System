from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from enum import Enum

class TransactionType(str, Enum):
    PURCHASE_IN = "purchase_in"
    SALE_OUT = "sale_out"
    ADJUSTMENT_IN = "adjustment_in"
    ADJUSTMENT_OUT = "adjustment_out"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"

class StockLevelResponse(BaseModel):
    id: UUID
    product_id: UUID
    branch_id: UUID
    quantity: int
    updated_at: datetime
    
    # Nested info if needed
    product_name: Optional[str] = None
    branch_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class StockAdjustmentRequest(BaseModel):
    product_id: UUID
    branch_id: UUID
    quantity_change: int
    txn_type: TransactionType
    notes: Optional[str] = None

class StockTransferRequest(BaseModel):
    product_id: UUID
    from_branch_id: UUID
    to_branch_id: UUID
    quantity: int
    notes: Optional[str] = None
