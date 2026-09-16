from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AI Forecast API",
    description="Intelligent AI/ML Forecasting & Prediction Platform Backend",
    version="0.1.0",
)

# CORS configuration to allow requests from the frontend development server
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Root endpoint welcoming visitors and providing documentation link."""
    return {
        "message": "Welcome to AI Forecast API",
        "docs_url": "/docs",
        "health_url": "/health",
        "version": "0.1.0",
    }


@app.get("/health")
def health_check():
    """Health check endpoint to verify backend service status."""
    return {
        "status": "healthy",
        "service": "AI Forecast Backend",
        "version": "0.1.0",
    }
