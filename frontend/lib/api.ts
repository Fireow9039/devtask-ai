const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL");
}

export async function getProjects(userId: string) {
  const res = await fetch(`${API_URL}/projects/user/${userId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch projects");
  }

  return res.json();
}

export async function createProject(data: {
  user_id: string;
  name: string;
  description?: string;
}) {
  const res = await fetch(`${API_URL}/projects/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create project");
  }

  return res.json();
}

export async function getTasks(projectId: string) {
  const res = await fetch(`${API_URL}/tasks/project/${projectId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return res.json();
}

export async function createTask(data: {
  project_id: string;
  user_id: string;
  title: string;
  description?: string;
  type?: string;
  status?: string;
  priority?: string;
}) {
  const res = await fetch(`${API_URL}/tasks/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create task");
  }

  return res.json();
}

export async function updateTaskStatus(taskId: string, status: string) {
  const res = await fetch(`${API_URL}/tasks/${taskId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error("Failed to update task status");
  }

  return res.json();
}

export async function generateUserStory(data: {
  task_id: string;
  title: string;
  description?: string;
}) {
  const res = await fetch(`${API_URL}/ai/user-story`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to generate user story");
  }

  return res.json();
}

export async function generateAcceptanceCriteria(data: {
  task_id: string;
  title: string;
  description?: string;
}) {
  const res = await fetch(`${API_URL}/ai/acceptance-criteria`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to generate acceptance criteria");
  }

  return res.json();
}

export async function generateTestCases(data: {
  task_id: string;
  title: string;
  description?: string;
}) {
  const res = await fetch(`${API_URL}/ai/test-cases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to generate test cases");
  }

  return res.json();
}