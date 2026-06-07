from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.supabase_client import supabase

router = APIRouter()


class TaskCreate(BaseModel):
    project_id: str
    user_id: str
    title: str
    description: str | None = None
    type: str = "task"
    status: str = "backlog"
    priority: str = "medium"


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    type: str | None = None
    status: str | None = None
    priority: str | None = None
    ai_user_story: str | None = None
    ai_acceptance_criteria: str | None = None
    ai_test_cases: str | None = None


class TaskStatusUpdate(BaseModel):
    status: str


@router.post("/")
def create_task(task: TaskCreate):
    result = supabase.table("tasks").insert(task.model_dump()).execute()

    if not result.data:
        raise HTTPException(status_code=400, detail="Task could not be created")

    return result.data[0]


@router.get("/project/{project_id}")
def get_tasks_by_project(project_id: str):
    result = (
        supabase
        .table("tasks")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .execute()
    )

    return result.data


@router.get("/{task_id}")
def get_task(task_id: str):
    result = supabase.table("tasks").select("*").eq("id", task_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")

    return result.data[0]


@router.patch("/{task_id}")
def update_task(task_id: str, task: TaskUpdate):
    update_data = {
        key: value
        for key, value in task.model_dump().items()
        if value is not None
    }

    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    result = supabase.table("tasks").update(update_data).eq("id", task_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")

    return result.data[0]


@router.patch("/{task_id}/status")
def update_task_status(task_id: str, status_update: TaskStatusUpdate):
    allowed_statuses = ["backlog", "todo", "in_progress", "review", "done"]

    if status_update.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid task status")

    result = (
        supabase
        .table("tasks")
        .update({"status": status_update.status})
        .eq("id", task_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")

    return result.data[0]


@router.delete("/{task_id}")
def delete_task(task_id: str):
    result = supabase.table("tasks").delete().eq("id", task_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task deleted successfully"}