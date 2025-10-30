"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User } from "lucide-react";
import axios from "axios";

export function Authpage({ isSignin }: { isSignin: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleAuth = async () => {
    setLoading(true);
    setMessage("");

    try {
      if (isSignin) {
        const res = await axios.post("/signin", {
          email: form.email,
          password: form.password,
        });
        //@ts-ignore
        setMessage(res.data.message || "Signed in successfully!");
        router.push("/canvas");
      } else {
        const res = await axios.post("/signup", {
          name: form.name,
          email: form.email,
          password: form.password,
        });
        //@ts-ignore
        setMessage(res.data.message || "Account created successfully!");
        router.push("/signin");
      }
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAuth = () => {
    router.push(isSignin ? "/signup" : "/signin");
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 px-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 transition-all hover:shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {isSignin ? "Welcome Back 👋" : "Create Account ✨"}
          </h1>
          <p className="text-gray-500 mt-2">
            {isSignin
              ? "Sign in to continue drawing and collaborating."
              : "Join us to start creating together."}
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {!isSignin && (
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>

          {isSignin && (
            <div className="text-right">
              <button className="text-sm text-indigo-600 hover:underline font-medium">
                Forgot password?
              </button>
            </div>
          )}

          {/* Auth Button */}
          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isSignin ? "Signing in..." : "Signing up..."}
              </>
            ) : (
              <>{isSignin ? "Sign In" : "Sign Up"}</>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px bg-gray-300 flex-grow" />
            <span className="text-gray-500 text-sm">or continue with</span>
            <div className="h-px bg-gray-300 flex-grow" />
          </div>

          {/* Social Buttons */}
          <div className="flex justify-center gap-4">
            <button className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2 hover:bg-gray-50 transition-all">
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              <span className="font-medium text-gray-700">Google</span>
            </button>
            <button className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2 hover:bg-gray-50 transition-all">
              <img
                src="https://www.svgrepo.com/show/475654/github-color.svg"
                alt="GitHub"
                className="w-6 h-6"
              />
              <span className="font-medium text-gray-700">GitHub</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          {isSignin ? (
            <>
              Don’t have an account?{" "}
              <span
                className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                onClick={handleSwitchAuth}
              >
                Sign up
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                onClick={handleSwitchAuth}
              >
                Sign in
              </span>
            </>
          )}
        </div>

        {/* Message */}
        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
}
