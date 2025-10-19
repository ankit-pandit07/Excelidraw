import { getExistingShapes } from "./http";
import { Tool } from "@/components/Canvas";

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

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[];
  private roomId: string;
  private clicked: boolean;
  private startX = 0;
  private startY = 0;
  private selectedTool: Tool = "circle";
  private pencilPoints: { x: number; y: number }[] = [];
  private painting = true;
  socket: WebSocket;

  private scale = 1;
  private setX = 0;
  private setY = 0;
  private panning = false;
  private panX = 0;
  private panY = 0;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.roomId = roomId;
    this.clicked = false;
    this.socket = socket;
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
    this.initZoomAndPan();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandle);
    this.canvas.removeEventListener("mouseup", this.mouseupHandler);
    this.canvas.removeEventListener("mousemove", this.mousemoveHandler);
    this.canvas.removeEventListener("wheel", this.wheelHandler);
  }

  setTool(tool: "circle" | "pencil" | "rect") {
    this.selectedTool = tool;
  }
  
  async init() {
    this.existingShapes = await getExistingShapes(this.roomId);
    this.clearCanvas();
  }
  
  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type == "chat") {
        const parseShape = JSON.parse(message.message);
        this.existingShapes.push(parseShape.shape);
        this.clearCanvas();
      }
    };
  }
  
  private screenToWorld(x: number, y: number) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    return {
      x: (canvasX - this.setX) / this.scale,
      y: (canvasY - this.setY) / this.scale,
    };
  }

  clearCanvas() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for clearing
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(0,0,0)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    this.ctx.save();
    this.ctx.setTransform(
      this.scale,
      0,
      0,
      this.scale,
      this.setX,
      this.setY
    );

    // Draw all existing shapes with world coordinates
    this.existingShapes.forEach((shape) => {
      this.ctx.strokeStyle = "rgba(255,255,255)";
      
      if (shape.type === "rect") {
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === "circle") {
        this.ctx.beginPath();
        this.ctx.arc(
          shape.centerX,
          shape.centerY,
          Math.abs(shape.radius),
          0,
          Math.PI * 2
        );
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "pencil") {
        this.ctx.beginPath();
        if (shape.points.length > 0) {
          this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
        }
        this.ctx.stroke();
        this.ctx.closePath();
      }
    });

    this.ctx.restore();
  }

  mouseDownHandle = (e) => {
    if (e.button === 1) {
      this.panning = true;
      this.panX = e.clientX;
      this.panY = e.clientY;
      return;
    }

    this.clicked = true;
    const coords = this.screenToWorld(e.clientX, e.clientY);
    this.startX = coords.x;
    this.startY = coords.y;

    if (this.selectedTool === "pencil") {
      this.painting = true;
      this.pencilPoints = [{ x: this.startX, y: this.startY }];
    }
  };

  mouseupHandler = (e) => {
    if (this.panning) {
      this.panning = false;
      return;
    }

    if (!this.clicked) return;

    this.clicked = false;
    const coords = this.screenToWorld(e.clientX, e.clientY);
    const width = coords.x - this.startX;
    const height = coords.y - this.startY;
    
    let shape: Shape | null = null;
    
    if (this.selectedTool === "rect") {
      shape = {
        type: "rect",
        x: this.startX,
        y: this.startY,
        height,
        width,
      };
    } else if (this.selectedTool === "circle") {
      const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
      shape = {
        type: "circle",
        radius: radius,
        centerX: this.startX + (width / 2),
        centerY: this.startY + (height / 2),
      };
    } else if (this.selectedTool === "pencil") {
      this.painting = false;
      shape = {
        type: "pencil",
        points: [...this.pencilPoints], // Copy the array
      };
    }
    
    if (!shape) {
      return;
    }

    this.existingShapes.push(shape);
    this.socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({
          shape,
        }),
        roomId: this.roomId,
      })
    );
    
    this.clearCanvas();
  };

  mousemoveHandler = (e) => {
    if (this.panning) {
      const dx = e.clientX - this.panX;
      const dy = e.clientY - this.panY;
      this.setX += dx;
      this.setY += dy;
      this.panX = e.clientX;
      this.panY = e.clientY;
      this.clearCanvas();
      return;
    }

    if (this.clicked) {
      const coords = this.screenToWorld(e.clientX, e.clientY);
      const width = coords.x - this.startX;
      const height = coords.y - this.startY;
      
      this.clearCanvas();
      this.ctx.save();
      this.ctx.setTransform(this.scale, 0, 0, this.scale, this.setX, this.setY);
      this.ctx.strokeStyle = "rgba(255,255,255)";
      
      if (this.selectedTool === "rect") {
        this.ctx.strokeRect(this.startX, this.startY, width, height);
      } else if (this.selectedTool === "circle") {
        const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
        const centerX = this.startX + (width / 2);
        const centerY = this.startY + (height / 2);
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (this.selectedTool === "pencil" && this.painting) {
        const lastPoint = this.pencilPoints[this.pencilPoints.length - 1];
        this.ctx.beginPath();
        this.ctx.moveTo(lastPoint.x, lastPoint.y);
        this.ctx.lineTo(coords.x, coords.y);
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineCap = "round";
        this.ctx.stroke();
        this.ctx.closePath();
        this.pencilPoints.push({ x: coords.x, y: coords.y });
      }
      
      this.ctx.restore();
    }
  };

  wheelHandler = (e: WheelEvent) => {
    e.preventDefault();

    const zoomFactor = 1.1;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - this.setX) / this.scale;
    const worldY = (mouseY - this.setY) / this.scale;

    const direction = e.deltaY < 0 ? 1 : -1;
    let newScale = this.scale * (direction > 0 ? zoomFactor : 1 / zoomFactor);

    if (newScale < 0.5) {
      newScale = 0.5;
    }

    this.setX = mouseX - worldX * newScale;
    this.setY = mouseY - worldY * newScale;

    this.scale = newScale;

    this.clearCanvas();
  };

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandle);
    this.canvas.addEventListener("mouseup", this.mouseupHandler);
    this.canvas.addEventListener("mousemove", this.mousemoveHandler);
  }

  initZoomAndPan() {
    this.canvas.addEventListener("wheel", this.wheelHandler, {
      passive: false,
    });
  }
}