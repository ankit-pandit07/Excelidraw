import { useEffect, useRef, useState } from "react";
import { initDraw } from "@/draw";
import { IconButton } from "./Icons";
import { Circle, Pencil, RectangleHorizontal } from "lucide-react";
import { Game } from "@/draw/Game";

export type Tool="circle" | "rect" | "pencil";

export function Canvas({
    roomId,
    socket
}:{
    socket:WebSocket;
    roomId:string;
}){
   const canvasRef=useRef<HTMLCanvasElement>(null);
   const [game,setGame]=useState<Game>();
   const [selectedTool,setSelectedTool]=useState<Tool>("circle")

   useEffect(()=>{
   game?.setTool(selectedTool);
   },[selectedTool,game]);

    useEffect(()=>{
        if(canvasRef.current){
            const g=new Game(canvasRef.current,roomId,socket)
            setGame(g);

            return ()=>{
                g.destroy();
            }

        }
    },[canvasRef])

    return <div style={{
        height:"100vh",
        overflow:"hidden"
       
    }}>
         <canvas ref={canvasRef} width={2000} height={1000}></canvas>
         <Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool}/>
    </div>
}

function Topbar({selectedTool,setSelectedTool}:{
    selectedTool:Tool,
    setSelectedTool:(s:Tool)=>void
}){
   return <div style={{
    position:"fixed",
    top:10,
    left:10
}}>
    <div className="flex gap-t">
<IconButton activated={selectedTool==="pencil"} icon={<Pencil/>} onClick={()=>{
    setSelectedTool("pencil")
}}/>
<IconButton activated={selectedTool==="rect"} icon={<RectangleHorizontal/>} onClick={()=>{
    setSelectedTool("rect")
}}/>
<IconButton activated={selectedTool==="circle"} icon={<Circle/>} onClick={()=>{
    setSelectedTool("circle")
}}/>
</div>
</div>
}