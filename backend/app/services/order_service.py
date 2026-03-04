from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from fastapi import HTTPException, status
from app.db.supabase import get_supabase_client, get_admin_client
from app.models.order import OrderCreate, OrderUpdate, OrderItemCreate
from app.services.stock_service import StockService
from app.models.stock import StockAdjustmentRequest

class OrderService:
    @staticmethod
    def list_orders(
        order_type: Optional[str] = None,
        status: Optional[str] = None,
        branch_id: Optional[UUID] = None
    ) -> List[dict]:
        supabase = get_supabase_client()
        query = supabase.table("orders").select("*, branches(name), suppliers(name)")
        
        if order_type:
            query = query.eq("order_type", order_type)
        if status:
            query = query.eq("status", status)
        if branch_id:
            query = query.eq("branch_id", str(branch_id))
            
        result = query.execute()
        return result.data

    @staticmethod
    def get_order(order_id: UUID) -> dict:
        supabase = get_supabase_client()
        result = supabase.table("orders").select("*, order_items(*, products(name, sku))").eq("id", str(order_id)).single().execute()
        if not result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return result.data

    @staticmethod
    def create_order(order: OrderCreate, created_by: UUID) -> dict:
        supabase = get_admin_client()
        
        # 1. Create order header
        order_data = order.model_dump(exclude={"items"})
        order_data["created_by"] = str(created_by)
        
        order_res = supabase.table("orders").insert(order_data).execute()
        new_order = order_res.data[0]
        
        # 2. Create order items
        items_data = []
        total_amount = Decimal("0.00")
        for item in order.items:
            item_dict = item.model_dump()
            item_dict["order_id"] = new_order["id"]
            items_data.append(item_dict)
            total_amount += item.unit_price * item.quantity
            
        supabase.table("order_items").insert(items_data).execute()
        
        # 3. Update total amount on order header
        supabase.table("orders").update({"total_amount": str(total_amount)}).eq("id", new_order["id"]).execute()
        
        return OrderService.get_order(new_order["id"])

    @staticmethod
    def update_order_status(order_id: UUID, new_status: str, performed_by: UUID) -> dict:
        supabase = get_admin_client()
        
        # 1. Get current order
        order = OrderService.get_order(order_id)
        current_status = order["status"]
        
        if current_status == new_status:
            return order
            
        # 2. Logic for stock fulfilment on status change
        # If moving to 'confirmed' or 'delivered' depending on flow
        if new_status == "confirmed" and current_status == "draft":
            # Automatically adjust stock for all items
            branch_id = order["branch_id"]
            order_type = order["order_type"]
            
            for item in order["order_items"]:
                qty_change = item["quantity"] if order_type == "purchase" else -item["quantity"]
                txn_type = "purchase_in" if order_type == "purchase" else "sale_out"
                
                from app.models.stock import StockAdjustmentRequest
                from app.models.stock import TransactionType
                
                adj_req = StockAdjustmentRequest(
                    product_id=item["product_id"],
                    branch_id=branch_id,
                    quantity_change=qty_change,
                    txn_type=TransactionType(txn_type),
                    notes=f"Processed from order {order['order_number']}"
                )
                StockService.adjust_stock(adj_req, performed_by)

        # 3. Update status
        supabase.table("orders").update({"status": new_status}).eq("id", str(order_id)).execute()
        
        return OrderService.get_order(order_id)
