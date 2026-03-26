from fastapi import APIRouter, Depends
from app.db.supabase import get_admin_client
from app.auth.permissions import require_staff
from app.auth.middleware import get_current_user

router = APIRouter()


@router.get("/")
async def list_notifications(user=Depends(get_current_user)):
    supabase = get_admin_client()
    result = (
        supabase.table("notifications")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    return result.data or []


@router.post("/mark-all-read", status_code=204)
async def mark_all_read(user=Depends(get_current_user)):
    supabase = get_admin_client()
    supabase.table("notifications").update({"is_read": True}).eq("user_id", user["id"]).execute()
