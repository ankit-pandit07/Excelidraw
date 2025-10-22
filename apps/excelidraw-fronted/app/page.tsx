import { Pencil, Share2, Users2, Sparkles, Github, Download } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900">
              Collaborative Whiteboarding
              <span className="block bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mt-2">
                Made Simple
              </span>
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-lg text-gray-600">
              Create, collaborate, and share beautiful diagrams and sketches with our intuitive drawing tool. 
              No sign-up required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-6">
              <Link href="/signin">
                <button className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white px-6 py-3 text-lg font-semibold shadow-md hover:bg-indigo-700 transition-all">
                  Sign In
                  <Pencil className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/signup">
                <button className="rounded-xl border border-indigo-600 text-indigo-600 px-6 py-3 text-lg font-semibold hover:bg-indigo-50 transition-all">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature Card */}
            <div className="group p-6 border rounded-2xl bg-white hover:border-indigo-500 transition-all hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
                  <Share2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Real-time Collaboration</h3>
              </div>
              <p className="mt-4 text-gray-600">
                Work together with your team in real-time. Share your drawings instantly with a simple link.
              </p>
            </div>

            <div className="group p-6 border rounded-2xl bg-white hover:border-indigo-500 transition-all hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
                  <Users2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Multiplayer Editing</h3>
              </div>
              <p className="mt-4 text-gray-600">
                Multiple users can edit the same canvas simultaneously. See who's drawing what in real-time.
              </p>
            </div>

            <div className="group p-6 border rounded-2xl bg-white hover:border-indigo-500 transition-all hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Smart Drawing</h3>
              </div>
              <p className="mt-4 text-gray-600">
                Intelligent shape recognition and drawing assistance helps you create perfect diagrams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-10 sm:p-16 shadow-lg">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold">Ready to start creating?</h2>
              <p className="mt-6 text-lg text-indigo-100">
                Join thousands of users who are already creating amazing diagrams and sketches.
              </p>
              <div className="mt-10 flex items-center justify-center gap-6">
                <button className="flex items-center justify-center gap-2 rounded-xl bg-white text-indigo-700 px-6 py-3 font-semibold hover:bg-gray-100 transition-all">
                  Open Canvas
                  <Pencil className="w-5 h-5" />
                </button>
                <button className="rounded-xl border border-white text-white px-6 py-3 font-semibold hover:bg-white hover:text-indigo-700 transition-all">
                  View Gallery
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-6 py-12 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-500">© 2025 Excalidraw Clone. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="https://github.com" target="_blank" className="text-gray-500 hover:text-indigo-600 transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">
              <Download className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
