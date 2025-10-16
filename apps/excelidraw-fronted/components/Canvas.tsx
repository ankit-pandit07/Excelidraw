import { useEffect, useRef } from "react";
import { initDraw } from "@/draw";

export function Canvas({
    roomId,
    socket
}:{
    socket:WebSocket;
    roomId:string;
}){
   const canvasRef=useRef<HTMLCanvasElement>(null);
    useEffect(()=>{
        if(canvasRef.current){
           
            initDraw(canvasRef.current,roomId,socket);

        }
    },[canvasRef])

    return <div>
         <canvas ref={canvasRef} width={2000} height={1000}></canvas>

    </div>
}