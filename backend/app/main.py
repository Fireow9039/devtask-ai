from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.supabase_client import supabase
from app.projects import router as projects_router
from app.tasks import router as tasks_router
from app.ai import router as ai_router

app = FastAPI(title="DevTask AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://devtask-ai-pv1w.vercel.app",
        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router, prefix="/projects", tags=["Projects"])
app.include_router(tasks_router, prefix="/tasks", tags=["Tasks"])
app.include_router(ai_router, prefix="/ai", tags=["AI"])


@app.get("/")
def root():
    return {"message": "DevTask AI backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/test-supabase")
def test_supabase():
    result = supabase.table("projects").select("*").limit(5).execute()
    return {
        "message": "Supabase connected successfully",
        "data": result.data,
    }