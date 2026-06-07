from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq

from app.config import GROQ_API_KEY
from app.supabase_client import supabase

router = APIRouter()


class AIRequest(BaseModel):
    task_id: str
    title: str
    description: str | None = None


class SprintSummaryRequest(BaseModel):
    project_id: str
    notes: str | None = None


def call_llm(prompt: str):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing from .env")

    client = Groq(api_key=GROQ_API_KEY)

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior software product manager, agile coach, and QA engineer.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.3,
            max_tokens=900,
        )

        return response.choices[0].message.content

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM request failed: {str(e)}")


@router.post("/user-story")
def generate_user_story(req: AIRequest):
    description = req.description or ""

    prompt = f"""
Convert the following software task into a clear Agile user story.

Task Title:
{req.title}

Task Description:
{description}

Return the output in this format:

User Story:
As a [type of user], I want [goal], so that [benefit].

Business Value:
- ...

Assumptions:
- ...
"""

    result = call_llm(prompt)

    supabase.table("tasks").update({
        "ai_user_story": result
    }).eq("id", req.task_id).execute()

    return {
        "task_id": req.task_id,
        "type": "user_story",
        "result": result,
    }


@router.post("/acceptance-criteria")
def generate_acceptance_criteria(req: AIRequest):
    description = req.description or ""

    prompt = f"""
Generate acceptance criteria for the following software task.

Task Title:
{req.title}

Task Description:
{description}

Use Given/When/Then format.

Return 5 to 8 acceptance criteria.
"""

    result = call_llm(prompt)

    supabase.table("tasks").update({
        "ai_acceptance_criteria": result
    }).eq("id", req.task_id).execute()

    return {
        "task_id": req.task_id,
        "type": "acceptance_criteria",
        "result": result,
    }


@router.post("/test-cases")
def generate_test_cases(req: AIRequest):
    description = req.description or ""

    prompt = f"""
Generate QA test cases for the following software task.

Task Title:
{req.title}

Task Description:
{description}

Return the output in this format:

Positive Test Cases:
1. ...

Negative Test Cases:
1. ...

Edge Cases:
1. ...

API Test Cases:
1. ...
"""

    result = call_llm(prompt)

    supabase.table("tasks").update({
        "ai_test_cases": result
    }).eq("id", req.task_id).execute()

    return {
        "task_id": req.task_id,
        "type": "test_cases",
        "result": result,
    }


@router.post("/sprint-summary")
def generate_sprint_summary(req: SprintSummaryRequest):
    task_result = (
        supabase
        .table("tasks")
        .select("*")
        .eq("project_id", req.project_id)
        .execute()
    )

    tasks = task_result.data or []

    completed_tasks = [
        task for task in tasks
        if task.get("status") == "done"
    ]

    task_text = "\n".join([
        f"- {task.get('title')} | {task.get('type')} | {task.get('priority')} | {task.get('status')}"
        for task in tasks
    ])

    completed_text = "\n".join([
        f"- {task.get('title')}: {task.get('description')}"
        for task in completed_tasks
    ])

    prompt = f"""
You are a Scrum Master.

Generate a sprint summary using the following project data.

Sprint Notes:
{req.notes or "No sprint notes provided."}

All Tasks:
{task_text or "No tasks found."}

Completed Tasks:
{completed_text or "No completed tasks found."}

Return the output in this format:

Sprint Summary:
...

Completed Work:
- ...

Current Progress:
- ...

Blockers / Risks:
- ...

Next Sprint Recommendations:
- ...
"""

    result = call_llm(prompt)

    supabase.table("sprint_notes").insert({
        "project_id": req.project_id,
        "user_id": "11111111-1111-1111-1111-111111111111",
        "title": "AI Sprint Summary",
        "notes": req.notes,
        "ai_summary": result,
    }).execute()

    return {
        "project_id": req.project_id,
        "type": "sprint_summary",
        "result": result,
    }