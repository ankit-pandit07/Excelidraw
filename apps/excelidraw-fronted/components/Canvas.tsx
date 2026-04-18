import { useEffect, useRef, useState } from "react";
import { initDraw } from "@/draw";
import { IconButton } from "./Icons";
import { ArrowBigRight, Circle, Eraser, Pencil, RectangleHorizontal, Text, Triangle, Download, Upload } from "lucide-react";
import { Game } from "@/draw/Game";

export type Tool="circle" | "rect" | "pencil" | "triangle" | "arrow" | "text" | "eraser";

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
    },[roomId, socket])

    return <div style={{
        height:"100vh",
        overflow:"hidden"
       
    }}>
         <canvas ref={canvasRef} width={2000} height={1000}></canvas>
         <Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool}/>
         <div style={{ position: "fixed", top: 10, right: 10, display: "flex", gap: "10px" }}>
            <button onClick={() => game?.exportToPNG()} className="bg-gray-800 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-gray-700 transition">
                <Download size={18} /> PNG
            </button>
            <button onClick={() => game?.exportToJSON()} className="bg-gray-800 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-gray-700 transition">
                <Download size={18} /> JSON
            </button>
            <label className="bg-gray-800 text-white px-3 py-2 rounded flex items-center gap-2 cursor-pointer hover:bg-gray-700 transition">
                <Upload size={18} /> Import
                <input type="file" accept=".json" className="hidden" style={{display: "none"}} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            if (typeof event.target?.result === "string") {
                                game?.importFromJSON(event.target.result);
                            }
                        };
                        reader.readAsText(file);
                    }
                    // clear input to allow importing same file again
                    e.target.value = '';
                }} />
            </label>
         </div>
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
<IconButton activated={selectedTool==="triangle"} icon={<Triangle/>} onClick={()=>{
    setSelectedTool("triangle")
}}/>
<IconButton activated={selectedTool==="arrow"} icon={<ArrowBigRight/>} onClick={()=>{
    setSelectedTool("arrow")
}}/>
<IconButton activated={selectedTool==="text"} icon={<Text/>} onClick={()=>{
    setSelectedTool("text")
}}/>
<IconButton activated={selectedTool==="eraser"} icon={<Eraser/>} onClick={()=>{
    setSelectedTool("eraser")
}}/>

</div>
</div>
}