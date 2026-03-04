from fastapi import APIRouter, Depends
from app.db.supabase import get_supabase_client
from app.auth.permissions import require_manager

router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary(user=Depends(require_manager())):
    supabase = get_supabase_client()
    
    # 1. Total Products
    products_count = supabase.table("products").select("id", count="exact").execute()
    
    # 2. Total Stock Value (simplified)
    # SUM(stock_levels.quantity * products.cost_price)
    # Supabase/PostgREST doesn't support complex aggregations directly easily without RPC
    # So we'll use a simple query or assume an RPC exists.
    # For now, let's just get count of low stock items.
    
    low_stock = supabase.table("stock_levels").select("id", count="exact").filter("quantity", "lte", 10).execute() # placeholder logic
    
    # 3. Recent Transactions
    recent_txns = supabase.table("stock_transactions").select("*, stock_levels(products(name))").order("created_at", desc=True).limit(5).execute()
    
    return {
        "total_products": products_count.count,
        "low_stock_alerts": low_stock.count,
        "recent_transactions": recent_txns.data,
        "system_status": "operational"
    }
