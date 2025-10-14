import {useState,useEffect} from "react"
import { WEBSOCKET_URL } from "../app/config"

export function useSocket(){
    const [loading,setLoading]=useState(true);
    const [socket,setSocket]=useState<WebSocket>();

    useEffect(() => {
  const ws=new WebSocket(`${WEBSOCKET_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWRlNGY0Yi03ODIyLTQ0NTYtOTlmZC01NDU0MWQyOGE4ODgiLCJpYXQiOjE3NjA0MTc1ODB9.a6Kia5hqUNqpSfMAUXNN5gwhPOg_9D9ToMfCeLE_xxY`);
  ws.onopen=()=>{
    setLoading(false);
    setSocket(ws)
  }
}, []);

return {
    socket,
    loading
}
}