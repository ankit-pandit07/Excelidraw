import { HTTP_BACKEND } from "@/config";
import axios from "axios";



export async function getExistingShapes(roomId: string) {
  try {
    const res = await axios.get(`${HTTP_BACKEND}/canvas/${roomId}`);
    //@ts-ignore
    const elements = res.data.elements || [];

    const shapes = elements.map((el: any) => ({
      ...el.data,
      type: el.type,
      id: el.id,
      isDeleted: el.isDeleted
    }));

    return shapes;
  } catch (err) {
    console.error(err);
    return [];
  }
}
