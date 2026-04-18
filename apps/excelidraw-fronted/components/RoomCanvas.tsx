"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";
import { WEBSOCKET_URL } from "@/config";

import { useRouter } from "next/navigation";

export function RoomCanvas({roomId}:{roomId:string}){
    const router = useRouter();
    const [socket,setSocket]=useState<WebSocket | null>(null);


    useEffect(()=>{
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/signin");
            return;
        }
        const ws=new WebSocket(`${WEBSOCKET_URL}?token=${token}`)

        ws.onopen=()=>{
            setSocket(ws)
           const data=JSON.stringify({
                type:"join_room",
                payload: { roomId }
            })
            ws.send(data);
        }

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "leave_room", payload: { roomId } }));
            }
            ws.close();
        }
    },[roomId])


    if(!socket){
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0f0f0f] text-[#9ca3af]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                <p className="text-sm font-medium tracking-wide animate-pulse">Connecting to server...</p>
            </div>
        )
    }
    return <div>
        <Canvas roomId={roomId} socket={socket}/>
    </div>
}