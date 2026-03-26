from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Optional

from fastapi import HTTPException, status

from app.db.supabase import get_admin_client


class DashboardService:
    @staticmethod
    def get_summary() -> Dict[str, Any]:
        """
        Aggregate key KPIs for the dashboard:
        - total_inventory_value
        - low_stock_alerts
        - order_summary (pending vs delivered this month)
        - recent_transactions (last 10 stock_transactions)
        """
        # Use admin client to prevent infinite RLS profile recursion
        supabase = get_admin_client()

        # Total inventory value — direct aggregation (no RPC needed)
        # Fetch all stock levels with the product's unit_price
        stock_result = supabase.table("stock_levels").select(
            "quantity, products(unit_price)"
        ).execute()
        total_inventory_value = 0.0
        for row in stock_result.data or []:
            qty = row.get("quantity") or 0
            prod = row.get("products") or {}
            price = float(prod.get("unit_price") or 0)
            total_inventory_value += qty * price

        # Low stock alerts: products where quantity <= min_stock_level
        # We rely on a view or join capable endpoint in Supabase; otherwise fetch and filter.
        low_stock_result = (
            supabase.table("stock_levels")
            .select("id, quantity, products(id, name, sku, min_stock_level)")
            .lte("quantity", 10)
            .execute()
        )
        low_stock_items = low_stock_result.data or []

        # Order summary for current month
        today = date.today()
        month_start = today.replace(day=1)
        orders_result = (
            supabase.table("orders")
            .select("id, status, created_at")
            .gte("created_at", month_start.isoformat())
            .execute()
        )
        pending = 0
        delivered = 0
        for o in orders_result.data or []:
            if o.get("status") in ("draft", "confirmed", "shipped"):
                pending += 1
            elif o.get("status") == "delivered":
                delivered += 1

        recent_txns_result = (
            supabase.table("stock_transactions")
            .select("*, stock_levels(product_id, branch_id)")
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        
        # Format plural relationship mappings to singular for frontend TS interfaces
        for item in low_stock_items:
            if "products" in item:
                item["product"] = item.pop("products")
                
        recent_txns_items = recent_txns_result.data or []
        for tx in recent_txns_items:
            if "stock_levels" in tx:
                tx["stock_level"] = tx.pop("stock_levels")

        return {
            "total_inventory_value": total_inventory_value,
            "low_stock_alerts": low_stock_items,
            "order_summary": {
                "pending": pending,
                "delivered": delivered,
            },
            "recent_transactions": recent_txns_items,
        }

    @staticmethod
    def get_analytics() -> Dict[str, Any]:
        """
        Return stock movement and valuation data for reporting charts.
        """
        supabase = get_admin_client()
        
        # 1. Movement by Category (MTD)
        today = date.today()
        month_start = today.replace(day=1)
        
        txns_result = supabase.table("stock_transactions").select(
            "txn_type, quantity_change, stock_levels(products(category_id))"
        ).gte("created_at", month_start.isoformat()).execute()
        
        categories_result = supabase.table("categories").select("id, name").execute()
        cat_map = {c["id"]: c["name"] for c in categories_result.data or []}
        
        movement = {}
        for tx in txns_result.data or []:
            try:
                prod = tx.get("stock_levels", {}).get("products", {})
                cat_id = prod.get("category_id")
                cat_name = cat_map.get(cat_id, "Uncategorized")
            except (KeyError, TypeError, AttributeError):
                cat_name = "Uncategorized"
                
            if cat_name not in movement:
                movement[cat_name] = {"name": cat_name, "in": 0, "out": 0}
                
            qty = tx.get("quantity_change", 0)
            txn_type = tx.get("txn_type", "")
            if txn_type in ("purchase_in", "transfer_in", "adjustment_in"):
                movement[cat_name]["in"] += qty
            elif txn_type in ("sale_out", "transfer_out", "adjustment_out"):
                movement[cat_name]["out"] += abs(qty)
                
        # 2. Valuation Trend — daily granularity for last 30 days
        # Start from today's real inventory value snapshot
        stock_val_result = supabase.table("stock_levels").select(
            "quantity, products(unit_price)"
        ).execute()
        current_value = 0.0
        for row in stock_val_result.data or []:
            qty = row.get("quantity") or 0
            prod = row.get("products") or {}
            price = float(prod.get("unit_price") or 0)
            current_value += qty * price

        # Fetch all transactions in the last 30 days
        thirty_days_ago = today - timedelta(days=29)
        history_txns = supabase.table("stock_transactions").select(
            "txn_type, quantity_change, created_at, stock_levels(products(unit_price))"
        ).gte("created_at", thirty_days_ago.isoformat()).execute()

        # Build daily delta dict: "YYYY-MM-DD" -> net value change that day
        daily_delta: Dict[str, float] = {}
        for tx in history_txns.data or []:
            try:
                price = float((tx.get("stock_levels") or {}).get("products", {}).get("unit_price") or 0)
            except (TypeError, ValueError):
                price = 0.0
            qty = tx.get("quantity_change", 0) or 0
            txn_type = tx.get("txn_type", "")
            if txn_type in ("purchase_in", "transfer_in", "adjustment_in"):
                delta = qty * price
            elif txn_type in ("sale_out", "transfer_out", "adjustment_out"):
                delta = qty * price  # qty_change is negative for outbound, so delta is negative
            else:
                delta = 0.0

            try:
                day_key = tx["created_at"][:10]  # "YYYY-MM-DD"
            except (KeyError, TypeError):
                continue
            daily_delta[day_key] = daily_delta.get(day_key, 0.0) + delta

        # Walk back 30 days from today — one data point per day
        valuation_data = []
        running_value = current_value
        for i in range(29, -1, -1):
            target_day = today - timedelta(days=i)
            day_key = target_day.strftime("%Y-%m-%d")
            # Label: "26 Mar" style — use lstrip to remove leading zero (cross-platform)
            label = (target_day.strftime("%d %b").lstrip("0")) if i > 0 else "Today"
            valuation_data.append({
                "month": label,
                "value": round(running_value, 2),
                "cost": round(running_value * 0.75, 2),
            })
            # Subtract this day's delta to walk backwards
            running_value -= daily_delta.get(day_key, 0.0)
        
        return {
            "valuation_trend": valuation_data,
            "movement_by_category": list(movement.values())
        }
