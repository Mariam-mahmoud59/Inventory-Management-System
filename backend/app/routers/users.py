from fastapi import APIRouter, Depends, HTTPException
from app.db.supabase import get_supabase_client, get_admin_client
from app.auth.permissions import require_admin

router = APIRouter()

@router.get("/")
async def list_users(user=Depends(require_admin())):
    supabase = get_admin_client()
    # Profiles table extends auth.users
    result = supabase.table("profiles").select("*, branches(name)").execute()
    return result.data

@router.put("/{id}/role")
async def update_user_role(id: str, role_update: dict, user=Depends(require_admin())):
    if role_update.get("role") not in ["admin", "manager", "staff"]:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    supabase = get_admin_client()
    result = supabase.table("profiles").update({"role": role_update["role"]}).eq("id", id).execute()
    return result.data[0]
