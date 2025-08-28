from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, evaluation

app = FastAPI(title="SLP Evaluation System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(evaluation.router, prefix="/api/evaluation", tags=["evaluation"])

@app.get("/")
async def root():
    return {"message": "SLP Evaluation System API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)