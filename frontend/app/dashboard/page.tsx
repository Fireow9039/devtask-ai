"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createProject, getProjects } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState<string | undefined>("");
  const [projects, setProjects] = useState<Project[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadUserAndProjects() {
    setLoading(true);

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
      return;
    }

    setUserId(data.user.id);
    setEmail(data.user.email);

    try {
      const projectData = await getProjects(data.user.id);
      setProjects(projectData);
    } catch (error) {
      console.error(error);
      alert("Could not load projects. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Project name is required.");
      return;
    }

    setCreating(true);

    try {
      await createProject({
        user_id: userId,
        name,
        description,
      });

      setName("");
      setDescription("");
      await loadUserAndProjects();
    } catch (error) {
      console.error(error);
      alert("Could not create project. Make sure backend is running.");
    } finally {
      setCreating(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    loadUserAndProjects();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold">
          DevTask AI
        </Link>

        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600 hidden md:block">{email}</p>

          <button
            onClick={handleLogout}
            className="bg-black text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </nav>

      <section className="p-8 space-y-8">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Create projects and manage tasks with AI assistance.
          </p>
        </div>

        <form
          onSubmit={handleCreateProject}
          className="bg-white border rounded-xl p-6 space-y-4 max-w-2xl"
        >
          <h3 className="text-xl font-semibold">Create New Project</h3>

          <input
            className="w-full border p-3 rounded-lg"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <textarea
            className="w-full border p-3 rounded-lg min-h-24"
            placeholder="Project description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button
            disabled={creating}
            className="bg-black text-white px-5 py-3 rounded-lg disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Project"}
          </button>
        </form>

        <section>
          <h3 className="text-xl font-semibold mb-4">Your Projects</h3>

          {loading ? (
            <p className="text-gray-600">Loading projects...</p>
          ) : projects.length === 0 ? (
            <div className="bg-white border rounded-xl p-6">
              <p className="text-gray-600">
                No projects yet. Create your first project above.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="bg-white border rounded-xl p-5 hover:shadow-md transition"
                >
                  <h4 className="font-bold text-lg">{project.name}</h4>

                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                    {project.description || "No description provided."}
                  </p>

                  <p className="text-xs text-gray-400 mt-4">
                    Created:{" "}
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}