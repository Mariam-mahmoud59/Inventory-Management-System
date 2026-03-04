from typing import List
from fastapi import Depends, HTTPException, status
from app.auth.middleware import get_current_user

def require_role(allowed_roles: List[str]):
    """
    Dependency to enforce RBAC based on user roles.
    """
    async def role_checker(user=Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user['role']}' is not authorized for this action. Allowed: {allowed_roles}"
            )
        return user
    return role_checker

def require_admin():
    return require_role(["admin"])

def require_manager():
    return require_role(["admin", "manager"])

def require_staff():
    return require_role(["admin", "manager", "staff"])
