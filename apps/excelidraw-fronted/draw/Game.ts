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
   points:{
    x:number;
    y:number
   }[]
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
  private painting=true
  socket: WebSocket;

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
  }

  destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandle);

    this.canvas.removeEventListener("mouseup", this.mouseupHandler);

    this.canvas.removeEventListener("mousemove", this.mousemoveHandler);
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

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(0,0,0)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.existingShapes.map((shape) => {
      if (shape.type === "rect") {
        this.ctx.strokeStyle = "rgba(255,255,255)";
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
      }else if(shape.type==="pencil"){
            this.ctx.beginPath();
            for(let i=1;i<shape.points.length;i++){
                const p1=shape.points[i-1];
                const p2=shape.points[i];
                this.ctx.moveTo(p1.x,p1.y);
                this.ctx.lineTo(p2.x,p2.y)
            }
            this.ctx.stroke();
            this.ctx.closePath();
        }
    });
  }

  mouseDownHandle =(e)=> {
    this.clicked = true;
    this.startX = e.clientX;
    this.startY = e.clientY;

     if(this.selectedTool==="pencil"){
        this.painting=true;
        this.pencilPoints=[{x:this.startX,y:this.startY}];
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX,this.startY);
    }
  }

  mouseupHandler =(e)=> {
    this.clicked = false;
    const width = e.clientX - this.startX;
    const height = e.clientY - this.startY;
    const selectedTool = this.selectedTool;
    let shape: Shape | null = null;
    if (selectedTool === "rect") {
      shape = {
        type: "rect",
        x: this.startX,
        y: this.startY,
        height,
        width,
      };
    } else if (selectedTool === "circle") {
      const radius = Math.max(width, height) / 2;
      shape = {
        type: "circle",
        radius: radius,
        centerX: this.startX + radius,
        centerY: this.startY + radius,
      }
    }else if (selectedTool==="pencil"){
    this.painting=false;
    this.ctx.closePath();
    shape={
        type:"pencil",
        points:this.pencilPoints
    }
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
    )
  }

  mousemoveHandler =(e)=> {
    if (this.clicked) {
      const width = e.clientX - this.startX;
      const height = e.clientY - this.startY;
      this.clearCanvas();
      this.ctx.strokeStyle = "rgba(255,255,255)";
      const selectedTool = this.selectedTool;
      if (selectedTool === "rect") {
        this.ctx.strokeRect(this.startX, this.startY, width, height);
      } else if (selectedTool === "circle") {
        const radius = Math.max(width, height) / 2;
        const centerX = this.startX + radius;
        const centerY = this.startY + radius;

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
      }else if(selectedTool==="pencil" && this.painting){
        const x=e.clientX;
        const y=e.clientY;

        const lastPoint=this.pencilPoints[this.pencilPoints.length-1];
        this.ctx.beginPath();
        this.ctx.moveTo(lastPoint.x,lastPoint.y);
        this.ctx.lineTo(x,y);
        this.ctx.strokeStyle="#ffffff";
        this.ctx.lineCap="round";
        this.ctx.stroke();
        this.ctx.closePath();

        this.pencilPoints.push({x,y});
        return

    }
    }
  }
  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandle);

    this.canvas.addEventListener("mouseup", this.mouseupHandler);

    this.canvas.addEventListener("mousemove", this.mousemoveHandler);
  }
}
