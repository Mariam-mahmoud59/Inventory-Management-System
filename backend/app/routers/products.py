from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from app.services.product_service import ProductService
from app.models.product import ProductCreate, ProductUpdate, ProductResponse
from app.auth.permissions import require_role, require_manager

router = APIRouter()

@router.get("/", response_model=List[dict])
async def list_products(
    category_id: Optional[UUID] = None,
    supplier_id: Optional[UUID] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user=Depends(require_role(["admin", "manager", "staff"]))
):
    return ProductService.list_products(category_id, supplier_id, search, skip, limit)

@router.get("/{id}", response_model=dict)
async def get_product(
    id: UUID,
    user=Depends(require_role(["admin", "manager", "staff"]))
):
    return ProductService.get_product(id)

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    user=Depends(require_manager())
):
    return ProductService.create_product(product)

@router.put("/{id}", response_model=dict)
async def update_product(
    id: UUID,
    product: ProductUpdate,
    user=Depends(require_manager())
):
    return ProductService.update_product(id, product)

@router.delete("/{id}", response_model=dict)
async def delete_product(
    id: UUID,
    user=Depends(require_role(["admin"]))
):
    success = ProductService.delete_product(id)
    return {"success": success, "message": "Product deactivated" if success else "Product not found"}
