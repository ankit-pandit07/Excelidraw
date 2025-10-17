import { HTTP_BACKEND } from "@/config";
import axios from "axios";



export async function getExistingShapes(roomId: string) {
  const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
  //@ts-ignore
  const messages = res.data.messages;

  const shapes = messages
    .map((x: { message: string }) => {
      try {
        const parsed = JSON.parse(x.message);
        if (parsed && parsed.shape) {
          return parsed.shape;
        }
      } catch {
        // Not a shape JSON, ignore
      }
      return null;
    })
    .filter(Boolean);

  return shapes;
}
