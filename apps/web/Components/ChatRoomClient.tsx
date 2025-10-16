"use client";
import {useState,useEffect} from "react"
import { useSocket } from "../hooks/useSocket";

export function ChatRoomClient({
    messages,
    id
}:{
    messages:{message:string}[];
    id:string
}){
    const [chats,setChats]=useState(messages);
    const {socket,loading}=useSocket();
    const [currentmessage,setCurrentMessages]=useState("")
    useEffect(()=>{
        if(socket && !loading){

            socket.send(JSON.stringify({
                type:"join_room",
                roomId:id
            }))
            socket.onmessage=(event)=>{
                const parseData=JSON.parse(event.data);
                if(parseData.type==="chat"){
                    setChats(c=>[...c,{message:parseData.message}])
                }
            }
        }
    },[socket,loading,id])

    return <div>
       {chats.map(m =><div>{m.message}</div>)}

       <input type="text" value={currentmessage} onChange={e=>{
        setCurrentMessages(e.target.value);
       }}/>

       <button onClick={()=>{
        socket?.send(JSON.stringify({ 
            type:"chat",
            roomId:id,
            messages:currentmessage
        }))

        setCurrentMessages("");
       }}>
        Send Messages
       </button>
    </div>
}