"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white border rounded-xl p-6 space-y-4 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-gray-900">Login</h1>

        <input
          className="w-full border p-3 rounded-lg"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full border p-3 rounded-lg"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="w-full bg-black text-white p-3 rounded-lg">
          Login
        </button>

        <p className="text-sm text-gray-600 text-center">
          Do not have an account?{" "}
          <Link href="/signup" className="text-black underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}