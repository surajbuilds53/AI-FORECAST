import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import api_router
from app.schemas.health import HealthResponse

app = FastAPI(
    title="AI Forecast API",
    description="Intelligent AI/ML Forecasting & Prediction Platform Backend",
    version="0.1.0",
)

# CORS configuration supporting environment variable or local dev defaults
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount aggregated API routes
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["General"])
def read_root():
    """Root endpoint welcoming visitors and providing documentation links."""
    return {
        "message": "Welcome to AI Forecast API",
        "docs_url": "/docs",
        "health_url": "/health",
        "api_health_url": "/api/health",
        "version": "0.1.0",
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check() -> HealthResponse:
    """Root health check endpoint to verify backend service status."""
    return HealthResponse(
        status="healthy",
        service="AI Forecast Backend",
        version="0.1.0",
    )
