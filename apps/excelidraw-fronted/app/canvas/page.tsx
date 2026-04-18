"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { HTTP_BACKEND } from "@/config";
import { Loader2, Plus, LogIn } from "lucide-react";

export default function CanvasDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roomSlug, setRoomSlug] = useState("");
  const [error, setError] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
    } else {
      setIsInitializing(false);
    }
  }, [router]);

  const handleCreateRoom = async () => {
    if (!roomSlug) return setError("Room name is required");
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post<{ roomId: string | number }>(`${HTTP_BACKEND}/room`, { name: roomSlug }, {
        headers: { Authorization: token }
      });
      router.push(`/canvas/${res.data.roomId}`);
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to create room");
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomSlug) return setError("Room name is required");
    setLoading(true);
    setError("");
    try {
      const res = await axios.get<{ room?: { id: string | number } }>(`${HTTP_BACKEND}/room/${roomSlug}`);
      if (res.data.room) {
        router.push(`/canvas/${res.data.room.id}`);
      } else {
        setError("Room not found");
        setLoading(false);
      }
    } catch (e) {
      setError("Failed to join room");
      setLoading(false);
    }
  };

  if (isInitializing) return <div className="h-screen w-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Your Workspace</h1>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter Room Name / Slug"
            value={roomSlug}
            onChange={(e) => setRoomSlug(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Create Room
          </button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">OR</span></div>
          </div>
          
          <button
            onClick={handleJoinRoom}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white text-indigo-600 border border-indigo-600 font-semibold py-3 rounded-xl hover:bg-indigo-50 transition"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            Join Existing Room
          </button>
        </div>
      </div>
    </div>
  );
}
