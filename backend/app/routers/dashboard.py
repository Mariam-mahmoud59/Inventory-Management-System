from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth.permissions import require_role, require_staff
from app.auth.schemas import UserContext
from app.services.dashboard_service import DashboardService


class OrderSummary(BaseModel):
    pending: int
    delivered: int


class DashboardSummary(BaseModel):
    total_inventory_value: Decimal
    low_stock_alerts: list
    order_summary: OrderSummary
    recent_transactions: list


router = APIRouter()


@router.get(
    "/summary",
    response_model=DashboardSummary,
    summary="Get dashboard summary",
    description=(
        "Aggregate high-level KPIs for the inventory management dashboard, including:\n"
        "- Total inventory value\n"
        "- Low stock alerts\n"
        "- Current month's pending vs delivered orders\n"
        "- Recent stock movement transactions\n\n"
        "- **Roles**: Manager and Admin"
    ),
)
async def get_dashboard_summary(
    user: UserContext = Depends(require_staff())
) -> DashboardSummary:
    summary = DashboardService.get_summary()
    return DashboardSummary(**summary)


@router.get(
    "/analytics",
    summary="Get analytics charts telemetry",
    description=(
        "Return stock movement matrix by product category and live aggregated valuation metrics.\n\n"
        "- **Roles**: Manager and Admin"
    ),
)
async def get_dashboard_analytics(
    user: UserContext = Depends(require_staff())
) -> dict:
    return DashboardService.get_analytics()

