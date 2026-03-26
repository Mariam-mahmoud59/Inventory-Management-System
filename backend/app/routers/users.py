from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db.supabase import get_admin_client
from app.auth.permissions import require_admin

router = APIRouter()


class CreateUserRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "staff"
    branch_id: Optional[str] = None


@router.get("/")
async def list_users(user=Depends(require_admin())):
    supabase = get_admin_client()
    result = supabase.table("profiles").select("*, branches(name)").execute()
    return result.data


@router.post("/create", status_code=201)
async def create_user(payload: CreateUserRequest, user=Depends(require_admin())):
    supabase = get_admin_client()

    if payload.role not in ["admin", "manager", "staff"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Create auth user directly with password — no email confirmation needed
    try:
        res = supabase.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,  # Skip email verification
            "user_metadata": {"full_name": payload.full_name},
        })
        new_user = res.user
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"User creation failed: {str(e)}")

    if not new_user:
        raise HTTPException(status_code=500, detail="User creation returned no data")

    # Upsert profile with correct role and branch
    profile_data: dict = {
        "id": str(new_user.id),
        "full_name": payload.full_name,
        "role": payload.role,
        "is_active": True,
    }
    if payload.branch_id:
        profile_data["branch_id"] = payload.branch_id

    supabase.table("profiles").upsert(profile_data).execute()

    return {"message": f"User {payload.email} created successfully", "user_id": str(new_user.id)}


@router.delete("/{id}", status_code=204)
async def delete_user(id: str, user=Depends(require_admin())):
    """Admin-only: permanently delete a user from auth + profiles."""
    supabase = get_admin_client()
    try:
        supabase.auth.admin.delete_user(id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Delete failed: {str(e)}")


@router.put("/{id}/role")
async def update_user_role(id: str, role_update: dict, user=Depends(require_admin())):
    if role_update.get("role") not in ["admin", "manager", "staff"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    supabase = get_admin_client()
    result = supabase.table("profiles").update({"role": role_update["role"]}).eq("id", id).execute()
    return result.data[0]
