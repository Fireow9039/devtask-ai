"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { supabase } from "@/lib/supabaseClient";
import {
  createTask,
  getProject,
  getTasks,
  updateTask,
  updateTaskStatus,
  generateUserStory,
  generateAcceptanceCriteria,
  generateTestCases,
  generateSprintSummary,
  deleteTask,
  deleteProject,
} from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
};


type Task = {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: "task" | "bug" | "story";
  status: "backlog" | "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "critical";
  ai_user_story: string | null;
  ai_acceptance_criteria: string | null;
  ai_test_cases: string | null;
  created_at: string;
};

type TaskStatus = Task["status"];

const columns = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "Todo" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
] as const;

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [userId, setUserId] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "task" | "bug" | "story"
  >("all");

  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "low" | "medium" | "high" | "critical"
  >("all");

  const [statusFilter, setStatusFilter] = useState<
    "all" | "backlog" | "todo" | "in_progress" | "review" | "done"
  >("all");






  const filteredTasks = tasks.filter((task) => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const matchesSearch =
      task.title.toLowerCase().includes(normalizedSearch) ||
      (task.description || "").toLowerCase().includes(normalizedSearch);

    const matchesType =
      typeFilter === "all" || task.type === typeFilter;

    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;

    return (
      matchesSearch &&
      matchesType &&
      matchesPriority &&
      matchesStatus
    );
  });









  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"task" | "bug" | "story">("task");
  const [priority, setPriority] =
    useState<"low" | "medium" | "high" | "critical">("medium");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState<"task" | "bug" | "story">("task");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [editStatus, setEditStatus] = useState<"backlog" | "todo" | "in_progress" | "review" | "done">("backlog");
  const [updatingTask, setUpdatingTask] = useState(false);



  const [generatingTaskId, setGeneratingTaskId] = useState<string | null>(null);
  const [selectedAIOutput, setSelectedAIOutput] = useState<string | null>(null);
  const [selectedAITitle, setSelectedAITitle] = useState("");

  const [sprintNotes, setSprintNotes] = useState("");
  const [generatingSprintSummary, setGeneratingSprintSummary] = useState(false);

  async function loadUserAndTasks() {
    setLoading(true);

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
      return;
    }

    setUserId(data.user.id);

    try {
      const [projectData, taskData] = await Promise.all([
        getProject(projectId),
        getTasks(projectId),
      ]);

      setProject(projectData);
      setTasks(taskData);

    } catch (error) {
      console.error(error);
      alert("Could not load tasks. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      alert("Task title is required.");
      return;
    }

    setCreating(true);

    try {
      await createTask({
        project_id: projectId,
        user_id: userId,
        title,
        description,
        type,
        status: "backlog",
        priority,
      });

      setTitle("");
      setDescription("");
      setType("task");
      setPriority("medium");

      await loadUserAndTasks();
    } catch (error) {
      console.error(error);
      alert("Could not create task.");
    } finally {
      setCreating(false);
    }
  }

  async function handleMoveTask(taskId: string, newStatus: string) {
    try {
      await updateTaskStatus(taskId, newStatus);
      await loadUserAndTasks();
    } catch (error) {
      console.error(error);
      alert("Could not update task status.");
    }
  }

  async function handleDeleteTask(taskId: string) {
    const confirmed = window.confirm("Are you sure you want to delete this task?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteTask(taskId);
      await loadUserAndTasks();
    } catch (error) {
      console.error(error);
      alert("Could not delete task.");
    }
  }

  async function handleGenerateUserStory(task: Task) {
    setGeneratingTaskId(task.id);

    try {
      const response = await generateUserStory({
        task_id: task.id,
        title: task.title,
        description: task.description || "",
      });

      setSelectedAITitle("Generated User Story");
      setSelectedAIOutput(response.result);

      await loadUserAndTasks();
    } catch (error) {
      console.error(error);
      alert("Could not generate user story. Check backend and Groq API key.");
    } finally {
      setGeneratingTaskId(null);
    }
  }

  async function handleGenerateAcceptanceCriteria(task: Task) {
    setGeneratingTaskId(task.id);

    try {
      const response = await generateAcceptanceCriteria({
        task_id: task.id,
        title: task.title,
        description: task.description || "",
      });

      setSelectedAITitle("Generated Acceptance Criteria");
      setSelectedAIOutput(response.result);

      await loadUserAndTasks();
    } catch (error) {
      console.error(error);
      alert("Could not generate acceptance criteria. Check backend and Groq API key.");
    } finally {
      setGeneratingTaskId(null);
    }
  }

  async function handleGenerateTestCases(task: Task) {
    setGeneratingTaskId(task.id);

    try {
      const response = await generateTestCases({
        task_id: task.id,
        title: task.title,
        description: task.description || "",
      });

      setSelectedAITitle("Generated Test Cases");
      setSelectedAIOutput(response.result);

      await loadUserAndTasks();
    } catch (error) {
      console.error(error);
      alert("Could not generate test cases. Check backend and Groq API key.");
    } finally {
      setGeneratingTaskId(null);
    }
  }
  async function handleGenerateSprintSummary(e: React.FormEvent) {
    e.preventDefault();

    setGeneratingSprintSummary(true);

    try {
      const response = await generateSprintSummary({
        project_id: projectId,
        notes: sprintNotes,
      });

      setSelectedAITitle("Generated Sprint Summary");
      setSelectedAIOutput(response.result);

      setSprintNotes("");
    } catch (error) {
      console.error(error);
      alert("Could not generate sprint summary. Check backend and Groq API key.");
    } finally {
      setGeneratingSprintSummary(false);
    }
  }

  async function handleDeleteProject() {
    const confirmed = window.confirm(
        "Are you sure you want to delete this project? This will also delete all tasks inside it."
    );

    if (!confirmed) {
        return;
    }

    try {
        await deleteProject(projectId);
        router.push("/dashboard");
    }   catch (error) {
        console.error(error);
        alert("Could not delete project.");
    }
  }


  function openEditTask(task: Task) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditType(task.type);
    setEditPriority(task.priority);
    setEditStatus(task.status);
  }

  function closeEditTask() {
    setEditingTask(null);
    setEditTitle("");
    setEditDescription("");
    setEditType("task");
    setEditPriority("medium");
    setEditStatus("backlog");
  }

  async function handleUpdateTask(e: React.FormEvent) {
    e.preventDefault();

    if (!editingTask) {
      return;
    }

    if (!editTitle.trim()) {
      alert("Task title is required.");
      return;
    }

    setUpdatingTask(true);

    try {
      await updateTask(editingTask.id, {
        title: editTitle,
        description: editDescription,
        type: editType,
        priority: editPriority,
        status: editStatus,
      });

      closeEditTask();
      await loadUserAndTasks();
    } catch (error) {
      console.error(error);
      alert("Could not update task.");
    } finally {
      setUpdatingTask(false);
    }
  }
  


  useEffect(() => {
    loadUserAndTasks();
  }, [projectId]);

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold">
          DevTask AI
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDeleteProject}
            className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
          >
            Delete Project
          </button>

          <Link href="/dashboard" className="border px-4 py-2 rounded-lg">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <section className="p-8 space-y-8">
        
        

        <div className="bg-white border rounded-xl p-6">
          <p className="text-sm text-gray-500">Project Board</p>

          <h1 className="text-3xl font-bold mt-1">
            {project?.name || "Loading project..."}
          </h1>

          <p className="text-gray-600 mt-2">
            {project?.description || "No project description provided."}
          </p>

          {project?.created_at && (
            <p className="text-xs text-gray-400 mt-4">
              Created: {new Date(project.created_at).toLocaleDateString()}
            </p>
          )}
        </div>


        

        <div className="grid md:grid-cols-5 gap-4">
          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm text-gray-500">Total Tasks</p>
            <p className="text-2xl font-bold">{tasks.length}</p>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm text-gray-500">Backlog</p>
            <p className="text-2xl font-bold">
              {tasks.filter((task) => task.status === "backlog").length}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold">
              {tasks.filter((task) => task.status === "in_progress").length}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm text-gray-500">Review</p>
            <p className="text-2xl font-bold">
              {tasks.filter((task) => task.status === "review").length}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm text-gray-500">Done</p>
            <p className="text-2xl font-bold">
              {tasks.filter((task) => task.status === "done").length}
            </p>
          </div>
        </div>
        



        <form
          onSubmit={handleCreateTask}
          className="bg-white border rounded-xl p-6 space-y-4 max-w-3xl"
        >
          <h2 className="text-xl font-semibold">Create Task / Bug / Story</h2>

          <input
            className="w-full border p-3 rounded-lg"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full border p-3 rounded-lg min-h-24"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <select
              className="w-full border p-3 rounded-lg"
              value={type}
              onChange={(e) =>
                setType(e.target.value as "task" | "bug" | "story")
              }
            >
              <option value="task">Task</option>
              <option value="bug">Bug</option>
              <option value="story">Story</option>
            </select>

            <select
              className="w-full border p-3 rounded-lg"
              value={priority}
              onChange={(e) =>
                setPriority(
                  e.target.value as "low" | "medium" | "high" | "critical"
                )
              }
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical Priority</option>
            </select>
          </div>

          <button
            disabled={creating}
            className="bg-black text-white px-5 py-3 rounded-lg disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Task"}
          </button>
        </form>

        


        <form
            onSubmit={handleGenerateSprintSummary}
            className="bg-white border rounded-xl p-6 space-y-4 max-w-3xl"
        >
          <div>
            <h2 className="text-xl font-semibold">Sprint Summary Generator</h2>
            <p className="text-sm text-gray-600 mt-1">
               Add sprint notes and generate an AI summary based on this project&apos;s tasks.
            </p>
          </div>

          <textarea
            className="w-full border p-3 rounded-lg min-h-28"
            placeholder="Example: This sprint focused on authentication, project setup, task APIs, and Kanban workflow."
            value={sprintNotes}
            onChange={(e) => setSprintNotes(e.target.value)}
          />

          <button
            disabled={generatingSprintSummary}
            className="bg-black text-white px-5 py-3 rounded-lg disabled:opacity-50"
        >
            {generatingSprintSummary ? "Generating Summary..." : "Generate Sprint Summary"}
          </button>
        </form>


        {editingTask && (
          <section className="bg-white border rounded-xl p-6 max-w-3xl">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold">Edit Task</h2>
                <p className="text-sm text-gray-600">
                  Update task details, priority, type, and status.
                </p>
              </div>

              <button
                onClick={closeEditTask}
                className="border px-3 py-1 rounded text-sm"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4">
              <input
                className="w-full border p-3 rounded-lg"
                placeholder="Task title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />

              <textarea
                className="w-full border p-3 rounded-lg min-h-24"
                placeholder="Task description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />

              <div className="grid md:grid-cols-3 gap-4">
                <select
                  className="w-full border p-3 rounded-lg"
                  value={editType}
                  onChange={(e) =>
                    setEditType(e.target.value as "task" | "bug" | "story")
                  }
                >
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="story">Story</option>
                </select>

                <select
                  className="w-full border p-3 rounded-lg"
                  value={editPriority}
                  onChange={(e) =>
                    setEditPriority(
                      e.target.value as "low" | "medium" | "high" | "critical"
                    )
                  }
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical Priority</option>
                </select>

                <select
                  className="w-full border p-3 rounded-lg"
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(
                      e.target.value as
                        | "backlog"
                        | "todo"
                        | "in_progress"
                        | "review"
                        | "done"
                    )
                  }
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                  </select>
                </div>

                <button
                  disabled={updatingTask}
                  className="bg-black text-white px-5 py-3 rounded-lg disabled:opacity-50"
                >
                  {updatingTask ? "Updating..." : "Update Task"}
                </button>
              </form>
            </section>
        )}
        

        <section className="bg-white border rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Filter Tasks</h2>
            <p className="text-sm text-gray-600 mt-1">
              Search and filter tasks by type, priority, or status.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <input
              className="w-full border p-3 rounded-lg"
              placeholder="Search title or description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              className="w-full border p-3 rounded-lg"
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value as "all" | "task" | "bug" | "story"
                )
              }
            >
              <option value="all">All Types</option>
              <option value="task">Task</option>
              <option value="bug">Bug</option>
              <option value="story">Story</option>
            </select>

            <select
              className="w-full border p-3 rounded-lg"
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(
                  e.target.value as
                    | "all"
                    | "low"
                    | "medium"
                    | "high"
                    | "critical"
                )
              }
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <select
              className="w-full border p-3 rounded-lg"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | "all"
                    | "backlog"
                    | "todo"
                    | "in_progress"
                    | "review"
                    | "done"
                )
              }
            >
              <option value="all">All Statuses</option>
              <option value="backlog">Backlog</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("all");
                setPriorityFilter("all");
                setStatusFilter("all");
              }}
              className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </section>



        


        



        <section>
          <h2 className="text-xl font-semibold mb-4">Kanban Board</h2>

          {loading ? (
            <p className="text-gray-600">Loading tasks...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {columns.map((column) => {
                const columnTasks = filteredTasks.filter(
                  (task) => task.status === column.key
                );

                return (
                  <div
                    key={column.key}
                    className="bg-white border rounded-xl p-4 min-h-96"
                  >
                    <h3 className="font-bold mb-4">
                      {column.label}{" "}
                      <span className="text-gray-400">
                        ({columnTasks.length})
                      </span>
                    </h3>

                    <div className="space-y-3">
                      {columnTasks.map((task) => (
                        <div
                          key={task.id}
                          className="border rounded-lg p-3 bg-gray-50 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-sm">
                              {task.title}
                            </h4>

                            <span className="text-xs border px-2 py-1 rounded">
                              {task.type}
                            </span>
                          </div>

                          <p className="text-xs text-gray-600">
                            {task.description || "No description provided."}
                          </p>

                          <p className="text-xs">
                            Priority:{" "}
                            <span className="font-medium">
                              {task.priority}
                            </span>
                          </p>

                          <select
                            className="w-full border p-2 rounded text-xs"
                            value={task.status}
                            onChange={(e) =>
                              handleMoveTask(
                                task.id,
                                e.target.value as TaskStatus
                              )
                            }
                          >
                            <option value="backlog">Backlog</option>
                            <option value="todo">Todo</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                            
                            <button
                              onClick={() => openEditTask(task)}
                              className="w-full border px-3 py-2 rounded text-xs bg-white hover:bg-gray-100"
                            >
                              Edit Task
                            </button>
                            
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="w-full border border-red-300 text-red-600 px-3 py-2 rounded text-xs bg-white hover:bg-red-50"
                            >
                              Delete Task
                            </button>


                                                    <div className="space-y-2 pt-2">
                            <button
                              type="button"
                              onClick={() => handleGenerateUserStory(task)}
                              disabled={generatingTaskId === task.id}
                              className="w-full border px-3 py-2 rounded text-xs bg-white hover:bg-gray-100 disabled:opacity-50"
                            >
                              Generate User Story
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleGenerateAcceptanceCriteria(task)
                              }
                              disabled={generatingTaskId === task.id}
                              className="w-full border px-3 py-2 rounded text-xs bg-white hover:bg-gray-100 disabled:opacity-50"
                            >
                              Generate Acceptance Criteria
                            </button>

                            <button
                              type="button"
                              onClick={() => handleGenerateTestCases(task)}
                              disabled={generatingTaskId === task.id}
                              className="w-full border px-3 py-2 rounded text-xs bg-white hover:bg-gray-100 disabled:opacity-50"
                            >
                              Generate Test Cases
                            </button>

                            {generatingTaskId === task.id && (
                              <p className="text-xs text-gray-500">
                                Generating AI output...
                              </p>
                            )}
                          </div>

                          <div className="space-y-1 pt-2">
                            {task.ai_user_story && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAITitle("Saved User Story");
                                  setSelectedAIOutput(task.ai_user_story);
                                }}
                                className="w-full text-left text-xs underline text-gray-700"
                              >
                                View User Story
                              </button>
                            )}

                            {task.ai_acceptance_criteria && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAITitle("Saved Acceptance Criteria");
                                  setSelectedAIOutput(task.ai_acceptance_criteria);
                                }}
                                className="w-full text-left text-xs underline text-gray-700"
                              >
                                View Acceptance Criteria
                              </button>
                            )}

                            {task.ai_test_cases && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAITitle("Saved Test Cases");
                                  setSelectedAIOutput(task.ai_test_cases);
                                }}
                                className="w-full text-left text-xs underline text-gray-700"
                              >
                                View Test Cases
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {columnTasks.length === 0 && (
                        <p className="text-sm text-gray-400">No tasks here.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        
        {selectedAIOutput && (
            <section className="bg-white border rounded-xl p-6 max-w-4xl">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h2 className="text-xl font-semibold">{selectedAITitle}</h2>
                      

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(selectedAIOutput);
                            alert("AI output copied.");
                          }}
                          className="border px-3 py-1 rounded text-sm hover:bg-gray-50"
                        >
                          Copy
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAIOutput(null);
                            setSelectedAITitle("");
                          }}
                          className="border px-3 py-1 rounded text-sm hover:bg-gray-50"
                        >
                          Close
                        </button>
                      </div>


                </div>

                <div className="bg-gray-50 border rounded-lg p-5 overflow-x-auto">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold mt-6 mb-3 first:mt-0">
                          {children}
                        </h1>
                      ),

                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold mt-5 mb-3 first:mt-0">
                          {children}
                        </h2>
                      ),

                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0">
                          {children}
                        </h3>
                      ),

                      p: ({ children }) => (
                        <p className="text-sm text-gray-700 leading-7 mb-3">
                          {children}
                        </p>
                      ),

                      strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900">
                          {children}
                      </strong>
                      ),

                      ul: ({ children }) => (
                        <ul className="list-disc pl-6 space-y-2 mb-4 text-sm text-gray-700">
                          {children}
                        </ul>
                      ),

                      ol: ({ children }) => (
                        <ol className="list-decimal pl-6 space-y-2 mb-4 text-sm text-gray-700">
                          {children}
                        </ol>
                      ),

                      li: ({ children }) => <li>{children}</li>,

                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">
                          {children}
                        </blockquote>
                      ),

                      code: ({ children }) => (
                        <code className="bg-gray-200 rounded px-1.5 py-0.5 text-sm font-mono">
                          {children}
                        </code>
                      ),

                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="w-full border-collapse border text-sm">
                            {children}
                          </table>
                        </div>
                      ),

                      th: ({ children }) => (
                        <th className="border bg-gray-100 px-3 py-2 text-left font-semibold">
                          {children}
                        </th>
                      ),

                      td: ({ children }) => (
                        <td className="border px-3 py-2 align-top">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {selectedAIOutput}
                  </ReactMarkdown>
                </div>
            </section>
        )}

      </section>
    </main>
  );
}