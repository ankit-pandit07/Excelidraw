import { HTTP_BACKEND } from "@/config";
import axios from "axios";

type Shape =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    }
  | {
      type: "pencil";
      points: {
        x: number;
        y: number;
      }[];
    };

let scale = 1;
let setX = 0;
let setY = 0;
let panning = false;
let PanX = 0;
let PanY = 0;

export async function initDraw(
  canvas: HTMLCanvasElement,
  roomId: string,
  socket: WebSocket
) {
  const ctx = canvas.getContext("2d");

  let existingShapes: Shape[] = await getExistingShapes(roomId);

  if (!ctx) {
    return;
  }

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type == "chat") {
      const parseShape = JSON.parse(message.message);
      existingShapes.push(parseShape.shape);
      clearCanvas(existingShapes, canvas, ctx);
    }
  };

  clearCanvas(existingShapes, canvas, ctx);
  let painting = false;
  let pencilPoints: {
    x: number;
    y: number;
  }[] = [];
  let clicked = false;
  let startX = 0;
  let startY = 0;

  function screenToWorld(x: number, y: number) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    return {
      x: (canvasX - setX) / scale,
      y: (canvasY - setY) / scale,
    };
  }

  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 1) {
      panning = true;
      PanX = e.clientX;
      PanY = e.clientY;
      return;
    }

    //@ts-ignore
    const selectedTool = window.selectedTool;
    clicked = true;
    const coords = screenToWorld(e.clientX, e.clientY);
    startX = coords.x;
    startY = coords.y;

    if (selectedTool === "pencil") {
      painting = true;
      pencilPoints = [{ x: startX, y: startY }];
      ctx.beginPath();
      ctx.moveTo(startX, startY);
    }
  });
  canvas.addEventListener("mouseup", (e) => {
    if (panning) {
      panning = false;
      return;
    }

    clicked = false;
    const coords = screenToWorld(e.clientX, e.clientY);
    const width = coords.x - startX;
    const height = coords.y - startY;
    //@ts-ignore
    const selectedTool = window.selectedTool;
    let shape: Shape | null = null;
    if (selectedTool === "rect") {
      shape = {
        type: "rect",
        x: startX,
        y: startY,
        height,
        width,
      };
    } else if (selectedTool === "circle") {
      const radius = Math.max(width, height) / 2;
      shape = {
        type: "circle",
        radius: radius,
        centerX: startX + radius,
        centerY: startY + radius,
      };
    } else if (selectedTool === "pencil") {
      painting = false;
      ctx.closePath();
      shape = {
        type: "pencil",
        points: pencilPoints,
      };
    }
    if (!shape) {
      return;
    }
    existingShapes.push(shape);
    socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({
          shape,
        }),
        roomId,
      })
    );
  });

  canvas.addEventListener("mousemove", (e) => {
    if (panning) {
      const dx = e.clientX - PanX;
      const dy = e.clientY - PanY;
      setX += dx;
      setY += dy;
      PanX = e.clientX;
      PanY = e.clientY;
      clearCanvas(existingShapes, canvas, ctx);
      return;
    }

    if (clicked) {
      const coords = screenToWorld(e.clientX, e.clientY);
      const width = coords.x - startX;
      const height = coords.y - startY;
      clearCanvas(existingShapes, canvas, ctx);
      ctx.strokeStyle = "rgba(255,255,255)";
      //@ts-ignore
      const selectedTool = window.selectedTool;
      if (selectedTool === "rect") {
        ctx.strokeRect(startX, startY, width, height);
      } else if (selectedTool === "circle") {
        const radius = Math.max(width, height) / 2;
        const centerX = startX + radius;
        const centerY = startY + radius;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
      } else if (selectedTool === "pencil" && painting) {
        const coords = screenToWorld(e.clientX, e.clientY);
        const lastPoint = pencilPoints[pencilPoints.length - 1];
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.strokeStyle = "#ffffff";
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.closePath();

        pencilPoints.push({ x: coords.x, y: coords.y });
        return;
      }
    }
  });

  // Wheel handler for zoom
  const wheelHandler = (e: WheelEvent) => {
    e.preventDefault();

    const zoomFactor = 1.1;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - setX) / scale;
    const worldY = (mouseY - setY) / scale;

    const direction = e.deltaY < 0 ? 1 : -1;
    const newScale = scale * (direction > 0 ? zoomFactor : 1 / zoomFactor);

    setX = mouseX - worldX * newScale;
    setY = mouseY - worldY * newScale;

    scale = newScale;

    clearCanvas(existingShapes, canvas, ctx);
  };

  canvas.addEventListener("wheel", wheelHandler, { passive: false });
}

function clearCanvas(
  existingShapes: Shape[],
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  // Apply zoom/pan transformation
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, setX, setY);

  // Calculate world coordinates for clearing
  const worldLeft = -setX / scale;
  const worldTop = -setY / scale;
  const worldWidth = canvas.width / scale;
  const worldHeight = canvas.height / scale;

  ctx.clearRect(worldLeft, worldTop, worldWidth, worldHeight);
  ctx.fillStyle = "rgba(0,0,0)";
  ctx.fillRect(worldLeft, worldTop, worldWidth, worldHeight);

  existingShapes.map((shape) => {
    if (shape.type === "rect") {
      ctx.strokeStyle = "rgba(255,255,255)";
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === "circle") {
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.closePath();
    } else if (shape.type === "pencil") {
      ctx.beginPath();
      for (let i = 1; i < shape.points.length; i++) {
        const p1 = shape.points[i - 1];
        const p2 = shape.points[i];
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
      ctx.closePath();
    }
  });
  ctx.restore();
}

async function getExistingShapes(roomId: string) {
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
