"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { HTTP_BACKEND } from "@/config";

export function Authpage({ isSignin }: { isSignin: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleAuth = async () => {
    if (!form.email || !form.password || (!isSignin && !form.name)) {
        setMessage("Please fill in all fields.");
        setIsError(true);
        return;
    }
    
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      if (isSignin) {
        const res = await axios.post<{ message?: string; token?: string; name?: string }>(`${HTTP_BACKEND}/signin`, {
          email: form.email,
          password: form.password,
        });
        setMessage(res.data.message || "Signed in successfully!");
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
        }
        if (res.data.name) {
          localStorage.setItem("username", res.data.name);
        }
        router.push("/canvas");
      } else {
        const res = await axios.post<{ message?: string }>(`${HTTP_BACKEND}/signup`, {
          name: form.name,
          email: form.email,
          password: form.password,
        });
        setMessage(res.data.message || "Account created successfully!");
        router.push("/signin");
      }
    } catch (err: any) {
      setMessage(err.response?.data?.error || err.response?.data?.message || "Something went wrong.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAuth = () => {
    router.push(isSignin ? "/signup" : "/signin");
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#0f0f0f] px-6 text-[#ffffff]">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl p-8 transition-all hover:border-[#3a3a3a]">
        {/* Header */}
        <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white text-black shadow-lg">
                    <span className="font-bold text-xl">Ex</span>
                </div>
            </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isSignin ? "Welcome Back 👋" : "Create Account ✨"}
          </h1>
          <p className="text-[#9ca3af] mt-2 text-sm">
            {isSignin
              ? "Sign in to continue drawing and collaborating."
              : "Join us to start creating together."}
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {!isSignin && (
            <div className="relative group">
              <User className="absolute left-4 top-3.5 text-[#9ca3af] w-5 h-5 transition-colors group-focus-within:text-white" />
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-[#0f0f0f] text-white border border-[#2a2a2a] rounded-xl focus:ring-2 focus:ring-white/20 focus:border-white/40 transition-all outline-none"
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-3.5 text-[#9ca3af] w-5 h-5 transition-colors group-focus-within:text-white" />
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full pl-12 pr-4 py-3 bg-[#0f0f0f] text-white border border-[#2a2a2a] rounded-xl focus:ring-2 focus:ring-white/20 focus:border-white/40 transition-all outline-none"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-3.5 text-[#9ca3af] w-5 h-5 transition-colors group-focus-within:text-white" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full pl-12 pr-12 py-3 bg-[#0f0f0f] text-white border border-[#2a2a2a] rounded-xl focus:ring-2 focus:ring-white/20 focus:border-white/40 transition-all outline-none"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-[#9ca3af] hover:text-white transition-colors"
            >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {isSignin && (
            <div className="text-right">
              <button className="text-sm text-[#9ca3af] hover:text-white hover:underline font-medium transition-colors">
                Forgot password?
              </button>
            </div>
          )}

          {/* Auth Button */}
          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 font-semibold py-3 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isSignin ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              <>{isSignin ? "Sign In" : "Sign Up"}</>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px bg-[#2a2a2a] flex-grow" />
            <span className="text-[#9ca3af] text-xs font-medium uppercase tracking-wider">or</span>
            <div className="h-px bg-[#2a2a2a] flex-grow" />
          </div>

          {/* Social Buttons */}
          <div className="flex justify-center gap-4">
            <button className="flex items-center gap-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-2.5 hover:bg-[#2f2f2f] hover:border-[#3a3a3a] transition-all hover:scale-[1.02] active:scale-[0.98]">
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              <span className="font-medium text-sm">Google</span>
            </button>
            <button className="flex items-center gap-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-2.5 hover:bg-[#2f2f2f] hover:border-[#3a3a3a] transition-all hover:scale-[1.02] active:scale-[0.98]">
              <img
                src="https://www.svgrepo.com/show/512317/github-142.svg"
                alt="GitHub"
                className="w-5 h-5 filter invert opacity-80"
              />
              <span className="font-medium text-sm">GitHub</span>
            </button>
          </div>
        </div>

        {/* Message / Error */}
        {message && (
          <div className={`mt-6 p-3 rounded-xl text-center text-sm font-medium ${isError ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"}`}>
            {message}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-[#9ca3af]">
          {isSignin ? (
            <>
              Don’t have an account?{" "}
              <button
                className="text-white font-semibold hover:underline cursor-pointer transition-colors"
                onClick={handleSwitchAuth}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                className="text-white font-semibold hover:underline cursor-pointer transition-colors"
                onClick={handleSwitchAuth}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
