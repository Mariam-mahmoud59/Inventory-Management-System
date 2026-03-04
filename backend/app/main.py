from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import products, stock, orders, branches, users, dashboard

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
