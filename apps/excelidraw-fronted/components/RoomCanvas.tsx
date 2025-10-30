"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";
import { WEBSOCKET_URL } from "@/config";

export function RoomCanvas({roomId}:{roomId:string}){
    const [socket,setSocket]=useState<WebSocket | null>(null);


    useEffect(()=>{
        const ws=new WebSocket(`${WEBSOCKET_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYjc5ZDE0MC1jMjRlLTRlOWYtYTU5Yy1jZTM4MzZkYzM4NDUiLCJpYXQiOjE3NjE3NDc2OTl9.7PaLRX3RaM7xCEF_ItQ221glVwepmN96uQ3Y9CfBhks`)

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