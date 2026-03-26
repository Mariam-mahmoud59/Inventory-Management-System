import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routers import products, stock, orders, branches, users, dashboard, notifications

app = FastAPI(
    title="Inventory Management System API",
    description="FastAPI backend for multi-tenant, role-based IMS",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Ensure CORS headers are always present, even on 500 errors."""
    tb = traceback.format_exc()
    print(f"UNHANDLED EXCEPTION on {request.method} {request.url}:\n{tb}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": tb.splitlines()[-3:]},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        },
    )

@app.get("/")
async def root():
    return {"message": "IMS API is live!"}

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy"}

# Include routers
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(stock.router, prefix="/api/v1/stock", tags=["Stock"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(branches.router, prefix="/api/v1/branches", tags=["Branches"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
