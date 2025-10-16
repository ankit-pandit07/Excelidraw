"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";
import { WEBSOCKET_URL } from "@/config";

export function RoomCanvas({roomId}:{roomId:string}){
    const [socket,setSocket]=useState<WebSocket | null>(null);


    useEffect(()=>{
        const ws=new WebSocket(`${WEBSOCKET_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiZmU2YzM1NC0yNzQ0LTRjNGEtOWQ4NS1lYzJiNjkxNjAyZTAiLCJpYXQiOjE3NjA2MTE3Nzh9.S0b4u_oEWmgbl8jz8zIuxVR5IAwvdn54Dins4Jy0v6w`)

        ws.onopen=()=>{
            setSocket(ws)
           const data=JSON.stringify({
                type:"join_room",
                roomId
            })
            ws.send(data);
        }
    },[])


    if(!socket){
        return <div>
            connecting to server....
        </div>
    }
    return <div>
        <Canvas roomId={roomId} socket={socket}/>
    </div>
}