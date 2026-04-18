"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { HTTP_BACKEND } from "@/config";
import { Loader2, Plus, LogIn, LogOut, LayoutGrid, Clock, ArrowRight } from "lucide-react";

export default function CanvasDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roomSlug, setRoomSlug] = useState("");
  const [error, setError] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [username, setUsername] = useState("Anonymous");
  const [userId, setUserId] = useState<string | null>(null);
  const [recentRooms, setRecentRooms] = useState<{ id: string; name: string; lastAccessed: number }[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }
    
    // Decode token to get userId
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const uid = payload.userId || payload.id || "default_user";
      setUserId(uid);
      
      const storedName = localStorage.getItem("username");
      if (storedName) setUsername(storedName);

      // Load recent rooms
      const userRoomsJSON = localStorage.getItem(`rooms_${uid}`);
      if (userRoomsJSON) {
        setRecentRooms(JSON.parse(userRoomsJSON).rooms || []);
      }
    } catch (e) {
      console.error(e);
      setUserId("default_user");
    }

    // Simulate slight delay to show off beautiful skeleton
    setTimeout(() => setIsInitializing(false), 300);
  }, [router]);

  const saveRoomLocally = (roomId: string, roomName: string) => {
    if (!userId) return;
    const newRoom = { id: roomId.toString(), name: roomName, lastAccessed: Date.now() };
    
    setRecentRooms(prev => {
      const filtered = prev.filter(r => r.id !== newRoom.id);
      const updated = [newRoom, ...filtered].slice(0, 12); // Keep last 12
      
      localStorage.setItem(`rooms_${userId}`, JSON.stringify({ userId, rooms: updated }));
      return updated;
    });
  };

  const handleCreateRoom = async () => {
    if (!roomSlug) return setError("Room name is required");
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post<{ roomId: string | number }>(`${HTTP_BACKEND}/room`, { name: roomSlug }, {
        headers: { Authorization: token }
      });
      saveRoomLocally(res.data.roomId.toString(), roomSlug);
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
        saveRoomLocally(res.data.room.id.toString(), roomSlug);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/signin");
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen w-screen bg-[#0f0f0f] text-[#ffffff] font-sans">
        <nav className="flex items-center justify-between px-8 py-4 bg-[#1a1a1a] border-b border-[#2a2a2a] sticky top-0 z-50">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] animate-pulse"></div>
              <div className="w-24 h-6 bg-[#2a2a2a] rounded-md animate-pulse"></div>
          </div>
          <div className="w-32 h-10 bg-[#2a2a2a] rounded-full animate-pulse"></div>
        </nav>
        <main className="max-w-7xl mx-auto px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1">
                    <div className="h-[400px] bg-[#1a1a1a] rounded-2xl animate-pulse border border-[#2a2a2a]"></div>
                </div>
                <div className="lg:col-span-2">
                    <div className="w-48 h-8 bg-[#1a1a1a] rounded-lg mb-6 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-[#1a1a1a] rounded-2xl animate-pulse border border-[#2a2a2a]"></div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#0f0f0f] text-[#ffffff] font-sans">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-8 py-4 bg-[#1a1a1a] border-b border-[#2a2a2a] sticky top-0 z-50">
        <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white text-black shadow-lg">
                <span className="font-bold text-lg">Ex</span>
            </div>
            <span className="font-semibold text-xl tracking-tight">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-[#0f0f0f] border border-[#2a2a2a] px-3 py-1.5 rounded-full">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold shadow-inner">
                    {username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium pr-2 text-gray-200">{username}</span>
            </div>
            <button 
                onClick={handleLogout}
                className="p-2 text-[#9ca3af] hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                title="Logout"
            >
                <LogOut className="w-5 h-5" />
            </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Left Column: Actions */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 text-[#9ca3af]" />
                        Workspace
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Enter Room Name"
                                value={roomSlug}
                                onChange={(e) => setRoomSlug(e.target.value)}
                                className="w-full px-4 py-3 bg-[#0f0f0f] text-white border border-[#2a2a2a] rounded-xl focus:ring-2 focus:ring-white/20 focus:border-white/40 transition-all outline-none"
                            />
                        </div>
                        
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleCreateRoom}
                            disabled={loading || !roomSlug}
                            className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-md"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            Create New Room
                        </button>

                        <div className="flex items-center gap-3 py-2">
                            <div className="h-px bg-[#2a2a2a] flex-grow" />
                            <span className="text-[#9ca3af] text-xs font-medium uppercase tracking-wider">or</span>
                            <div className="h-px bg-[#2a2a2a] flex-grow" />
                        </div>

                        <button
                            onClick={handleJoinRoom}
                            disabled={loading || !roomSlug}
                            className="w-full flex items-center justify-center gap-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white font-semibold py-3.5 rounded-xl hover:bg-[#2f2f2f] hover:border-[#3a3a3a] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                            Join Existing
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Column: Recent Rooms */}
            <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-[#9ca3af]" />
                    <h2 className="text-xl font-bold">Recent Rooms</h2>
                </div>

                {recentRooms.length === 0 ? (
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center h-[300px]">
                        <div className="w-16 h-16 bg-[#0f0f0f] rounded-full flex items-center justify-center mb-4 border border-[#2a2a2a]">
                            <LayoutGrid className="w-8 h-8 text-[#9ca3af]" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">No recent rooms yet</h3>
                        <p className="text-[#9ca3af] max-w-sm">
                            Create a new room or join an existing one to see your history appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {recentRooms.map((room) => (
                            <div 
                                key={room.id}
                                onClick={() => router.push(`/canvas/${room.id}`)}
                                className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 hover:bg-[#2f2f2f] hover:border-[#3a3a3a] cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm flex flex-col"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#0f0f0f] border border-[#2a2a2a] flex items-center justify-center text-white font-bold text-sm">
                                        {room.name.charAt(0).toUpperCase()}
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-[#9ca3af] group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 duration-200" />
                                </div>
                                <h3 className="text-lg font-bold text-white truncate">{room.name}</h3>
                                <p className="text-xs text-[#9ca3af] mt-1">
                                    Last accessed: {new Date(room.lastAccessed).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
        </div>
      </main>
    </div>
  );
}
