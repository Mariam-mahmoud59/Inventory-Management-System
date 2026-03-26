from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from fastapi import HTTPException, status

from app.db.supabase import get_supabase_client, get_admin_client
from app.models.order import (
    OrderCreate,
    OrderUpdate,
    OrderResponse,
    OrderItemResponse,
    OrderType,
    OrderStatus,
)
from app.models.stock import StockAdjustmentRequest, TransactionType
from app.services.stock_service import StockService


class OrderService:
    @staticmethod
    def _map_order_record(record: dict) -> OrderResponse:
        """
        Convert a raw Supabase order record (with nested order_items)
        into a strongly-typed OrderResponse model.
        """
        items_raw = record.get("order_items", []) or []
        items_mapped = []
        for item in items_raw:
            if "products" in item:
                item["product"] = item.pop("products")
            items_mapped.append(item)
            
        items: List[OrderItemResponse] = [OrderItemResponse(**item) for item in items_mapped]

        if "branches" in record:
            record["branch"] = record.pop("branches")
        if "suppliers" in record:
            record["supplier"] = record.pop("suppliers")

        payload = {**record, "items": items}
        return OrderResponse(**payload)

    @staticmethod
    def list_orders(
        order_type: Optional[OrderType] = None,
        status: Optional[OrderStatus] = None,
        branch_id: Optional[UUID] = None,
    ) -> List[OrderResponse]:
        # Use admin client to prevent infinite RLS profile recursion
        supabase = get_admin_client()
        query = supabase.table("orders").select("*, order_items(*, products(name, sku)), branches(name), suppliers(name)")

        if order_type is not None:
            query = query.eq("order_type", order_type.value)
        if status is not None:
            query = query.eq("status", status.value)
        if branch_id is not None:
            query = query.eq("branch_id", str(branch_id))

        result = query.execute()
        records = result.data or []
        return [OrderService._map_order_record(rec) for rec in records]

    @staticmethod
    def get_order(order_id: UUID) -> OrderResponse:
        # Use admin client to prevent infinite RLS profile recursion
        supabase = get_admin_client()
        result = (
            supabase.table("orders")
            .select("*, order_items(*, products(name, sku)), branches(name), suppliers(name)")
            .eq("id", str(order_id))
            .single()
            .execute()
        )
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )
        return OrderService._map_order_record(result.data)

    @staticmethod
    def create_order(order: OrderCreate, created_by: UUID) -> OrderResponse:
        supabase = get_admin_client()

        # 1. Create order header — use mode='json' so UUIDs/Decimals become strings
        order_data = order.model_dump(exclude={"items"}, mode="json")
        order_data["created_by"] = str(created_by)
        # Ensure enum values are their string representations
        order_data["order_type"] = order.order_type.value
        order_data["status"] = order.status.value

        order_res = supabase.table("orders").insert(order_data).execute()
        if not order_res.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create order",
            )
        new_order = order_res.data[0]

        # 2. Create order items — serialize with mode='json' for safe types
        items_data = []
        total_amount = Decimal("0.00")
        for item in order.items:
            item_dict = item.model_dump(mode="json")
            item_dict["order_id"] = new_order["id"]
            # NOTE: subtotal is a GENERATED column in PostgreSQL — do NOT insert it
            items_data.append(item_dict)
            total_amount += item.unit_price * item.quantity


        if items_data:
            supabase.table("order_items").insert(items_data).execute()

        # 3. Update total amount on order header
        supabase.table("orders").update(
            {"total_amount": str(total_amount)}
        ).eq("id", new_order["id"]).execute()

        return OrderService.get_order(UUID(new_order["id"]))

    @staticmethod
    def update_order_status(
        order_id: UUID,
        new_status: OrderStatus,
        performed_by: UUID,
    ) -> OrderResponse:
        """
        Update the order status and, when transitioning to DELIVERED,
        adjust stock levels for each line item via StockService.

        Stock adjustments:
        - PURCHASE order + DELIVERED => stock IN (purchase_in)
        - SALE order + DELIVERED => stock OUT (sale_out)
        """
        # 1. Get current order as a typed model
        order = OrderService.get_order(order_id)
        current_status = order.status

        if current_status == new_status:
            return order

        # 2. On transition to DELIVERED, adjust stock for all items
        if new_status == OrderStatus.DELIVERED and current_status != OrderStatus.DELIVERED:
            branch_id = order.branch_id
            order_type = order.order_type

            for item in order.items:
                if order_type == OrderType.PURCHASE:
                    qty_change = item.quantity
                    txn_type = TransactionType.PURCHASE_IN
                else:
                    qty_change = -item.quantity
                    txn_type = TransactionType.SALE_OUT

                adj_req = StockAdjustmentRequest(
                    product_id=item.product_id,
                    branch_id=branch_id,
                    quantity_change=qty_change,
                    txn_type=txn_type,
                    notes=f"Processed from order {order.order_number} ({new_status.value})",
                )
                # If any adjustment fails, an HTTPException is raised and
                # the order status will not be updated.
                StockService.adjust_stock(adj_req, performed_by)

        # 3. Update status after successful stock adjustments
        supabase = get_admin_client()
        supabase.table("orders").update(
            {"status": new_status.value}
        ).eq("id", str(order_id)).execute()

        return OrderService.get_order(order_id)

