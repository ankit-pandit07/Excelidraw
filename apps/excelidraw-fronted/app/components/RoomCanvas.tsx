"use client";

import { useEffect, useRef, useState } from "react";

import { Canvas } from "./Canvas";
import { WEBSOCKET_URL } from "../config";

export function RoomCanvas({roomId}:{roomId:string}){
    const [socket,setSocket]=useState<WebSocket | null>(null);


    useEffect(()=>{
        const ws=new WebSocket(`${WEBSOCKET_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MGNjNzY0ZC0zNjIxLTQ3NmQtOGFiNC1hZWFmZGYxNjRkZmUiLCJpYXQiOjE3NjA1NDA5NTl9.scvlQcUNEFEdG_Myr_zu4ZLxZPYH0hwADnNtLkeUfjE`)

        ws.onopen=()=>{
            setSocket(ws)
            ws.send(JSON.stringify({
                type:"join_room",
                roomId
            }))
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