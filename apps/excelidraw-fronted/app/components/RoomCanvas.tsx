"use client";

import { useEffect, useRef, useState } from "react";

import { Canvas } from "./Canvas";
import { WEBSOCKET_URL } from "../config";

export function RoomCanvas({roomId}:{roomId:string}){
    const [socket,setSocket]=useState<WebSocket | null>(null);


    useEffect(()=>{
        const ws=new WebSocket(`${WEBSOCKET_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0MjgwYjVjNS0yMmYyLTQ1ZjktOWEyYy1lYTdmZGJhYjVkMGMiLCJpYXQiOjE3NjA2MDAxODR9.xBBpPXaQFSZY8X0WrQE9ytjWYFEnFzaIFalzJ4Hj9uM`)

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