from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.supabase_client import supabase

router = APIRouter()


class ProjectCreate(BaseModel):
    user_id: str
    name: str
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


@router.post("/")
def create_project(project: ProjectCreate):
    result = supabase.table("projects").insert(project.model_dump()).execute()

    if not result.data:
        raise HTTPException(status_code=400, detail="Project could not be created")

    return result.data[0]


@router.get("/user/{user_id}")
def get_projects_by_user(user_id: str):
    result = supabase.table("projects").select("*").eq("user_id", user_id).execute()
    return result.data


@router.get("/{project_id}")
def get_project(project_id: str):
    result = supabase.table("projects").select("*").eq("id", project_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    return result.data[0]


@router.patch("/{project_id}")
def update_project(project_id: str, project: ProjectUpdate):
    update_data = {
        key: value
        for key, value in project.model_dump().items()
        if value is not None
    }

    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    result = supabase.table("projects").update(update_data).eq("id", project_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    return result.data[0]


@router.delete("/{project_id}")
def delete_project(project_id: str):
    result = supabase.table("projects").delete().eq("id", project_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"message": "Project deleted successfully"}