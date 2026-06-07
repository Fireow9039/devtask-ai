import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <section className="max-w-3xl text-center space-y-6">
        <h1 className="text-5xl font-bold text-gray-900">
          DevTask AI
        </h1>

        <p className="text-lg text-gray-600">
          AI-powered project management assistant for creating projects,
          tasks, bugs, user stories, acceptance criteria, test cases, and
          sprint summaries.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-black text-white px-5 py-3 rounded-lg"
          >
            Get Started
          </Link>

          <Link
            href="/login"
            className="border border-gray-300 px-5 py-3 rounded-lg"
          >
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}