from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from app.db.supabase import get_supabase_client, get_admin_client
from app.models.product import ProductCreate, ProductUpdate, ProductResponse

class ProductService:
    @staticmethod
    def list_products(
        category_id: Optional[UUID] = None,
        supplier_id: Optional[UUID] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[dict]:
        supabase = get_supabase_client()
        query = supabase.table("products").select("*, categories(name), suppliers(name)")
        
        if category_id:
            query = query.eq("category_id", str(category_id))
        if supplier_id:
            query = query.eq("supplier_id", str(supplier_id))
        if search:
            query = query.or_(f"name.ilike.%{search}%,sku.ilike.%{search}%")
            
        result = query.range(skip, skip + limit - 1).execute()
        return result.data

    @staticmethod
    def get_product(product_id: UUID) -> dict:
        supabase = get_supabase_client()
        result = supabase.table("products").select("*, categories(name), suppliers(name)").eq("id", str(product_id)).single().execute()
        if not result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return result.data

    @staticmethod
    def create_product(product: ProductCreate) -> dict:
        supabase = get_admin_client() # Bypass RLS for creation if needed, or use scoped client
        result = supabase.table("products").insert(product.model_dump()).execute()
        return result.data[0]

    @staticmethod
    def update_product(product_id: UUID, product: ProductUpdate) -> dict:
        supabase = get_admin_client()
        result = supabase.table("products").update(product.model_dump(exclude_unset=True)).eq("id", str(product_id)).execute()
        if not result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return result.data[0]

    @staticmethod
    def delete_product(product_id: UUID) -> bool:
        supabase = get_admin_client()
        # Soft delete by setting is_active to False
        result = supabase.table("products").update({"is_active": False}).eq("id", str(product_id)).execute()
        return len(result.data) > 0
