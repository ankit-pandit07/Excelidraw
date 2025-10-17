import { useEffect, useRef, useState } from "react";
import { initDraw } from "@/draw";
import { IconButton } from "./Icons";
import { Circle, Pencil, RectangleHorizontal } from "lucide-react";

type Shape="circle" | "rect" | "pencil";

export function Canvas({
    roomId,
    socket
}:{
    socket:WebSocket;
    roomId:string;
}){
   const canvasRef=useRef<HTMLCanvasElement>(null);
   const [selectedTool,setSelectedTool]=useState<Shape>("circle")

   useEffect(()=>{
    //@ts-ignore
    window.selectedTool=selectedTool
   },[selectedTool]);

    useEffect(()=>{
        if(canvasRef.current){
           
            initDraw(canvasRef.current,roomId,socket);

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
    selectedTool:Shape,
    setSelectedTool:(s:Shape)=>void
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