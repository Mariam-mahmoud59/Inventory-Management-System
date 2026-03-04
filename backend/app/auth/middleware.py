import jwt
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.supabase import get_supabase_client
from app.config import settings

security = HTTPBearer()

async def get_current_user(auth: HTTPAuthorizationCredentials = Depends(security)):
    """
    Decodes the JWT and returns the user payload.
    Ensures the user session is set on the Supabase client.
    """
    token = auth.credentials
    supabase = get_supabase_client()
    
    try:
        # We use getting the user from Supabase Auth to verify the token
        # This also ensures the token is valid and not blacklisted/revoked
        # It's an extra network call but safer for Supabase RLS integration
        auth_response = supabase.auth.get_user(token)
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        
        # Fetch the user's profile to get the role and branch assignment
        profile_response = supabase.table("profiles").select("*").eq("id", auth_response.user.id).single().execute()
        
        user_data = {
            "id": auth_response.user.id,
            "email": auth_response.user.email,
            "role": profile_response.data.get("role", "staff") if profile_response.data else "staff",
            "branch_id": profile_response.data.get("branch_id") if profile_response.data else None,
            "jwt": token
        }
        
        return user_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )
