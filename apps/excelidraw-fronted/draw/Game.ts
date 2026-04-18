import { getExistingShapes } from "./http";
import { Tool } from "@/components/Canvas";

type Shape = (
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
    }
  | {
      type: "triangle";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      x3: number;
      y3: number;
    }
  | {
      type: "arrow";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }
  | {
      type: "text";
      x: number;
      y: number;
      text: string;
      fontSize: number;
    }
) & { id: string; isDeleted?: boolean };

type Action = 
  | { type: "draw"; element: Shape }
  | { type: "erase"; elementId: string };

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private existingShapes: Map<string, Shape>;
  private roomId: string;
  private clicked: boolean;
  private startX = 0;
  private startY = 0;
  private selectedTool: Tool | "triangle" | "arrow" | "text" | "eraser" = "circle";
  private pencilPoints: { x: number; y: number }[] = [];
  private painting = true;
  socket: WebSocket;

  private scale = 1;
  private setX = 0;
  private setY = 0;
  private panning = false;
  private panX = 0;
  private panY = 0;
  private isSpacePressed = false;

  private isWritingText = false;
  private currentText = "";
  private textPosition = { x: 0, y: 0 };
  private showCursor = true;
  private cursorInterval: number | null = null;

  private undoStack: Action[] = [];
  private redoStack: Action[] = [];

  private cursors = new Map<string, { x: number; y: number; username: string }>();
  private lastCursorSendTime = 0;
  private myUsername = typeof window !== "undefined" ? (localStorage.getItem("username") || "Anonymous") : "Anonymous";
  private myUserId = "";
  private textInputRef: HTMLInputElement | null = null;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    const token = localStorage.getItem("token");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.myUserId = payload.userId || payload.id || "";
        } catch(e) {}
    }
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    this.offscreenCtx = this.offscreenCanvas.getContext("2d")!;

    this.existingShapes = new Map();
    this.roomId = roomId;
    this.clicked = false;
    this.socket = socket;
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
    this.initZoomAndPan();
    this.initKeyboardHandlers();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandle);
    this.canvas.removeEventListener("mouseup", this.mouseupHandler);
    this.canvas.removeEventListener("mousemove", this.mousemoveHandler);
    this.canvas.removeEventListener("wheel", this.wheelHandler);
    document.removeEventListener("keydown", this.globalKeyDownHandle);
    document.removeEventListener("keydown", this.globalKeyDownHandle);
    document.removeEventListener("keyup", this.globalKeyUpHandle);
    this.removeTextInput();
    
    this.cursors.clear();
    this.socket.onmessage = null;
  }

  setTool(tool: "circle" | "pencil" | "rect" | "triangle" | "arrow" | "text" | "eraser") {
    this.removeTextInput();
    this.selectedTool = tool;
  }

  async init() {
    const shapes = await getExistingShapes(this.roomId);
    shapes.forEach((s: Shape) => this.existingShapes.set(s.id, s));
    this.renderStaticBackground();
    this.clearCanvas();
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type == "draw") {
        const parseShape = message.payload.shape;
        this.existingShapes.set(parseShape.id, parseShape);
        this.renderStaticBackground();
        this.clearCanvas();
      } else if (message.type === "erase") {
        const shapeId = message.payload.id;
        const shape = this.existingShapes.get(shapeId);
        if (shape) {
          shape.isDeleted = true;
          this.renderStaticBackground();
          this.clearCanvas();
        }
      } else if (message.type === "undo" || message.type === "redo") {
        const shapeId = message.payload.id;
        const action = message.payload.action;
        const shape = this.existingShapes.get(shapeId);
        if (shape) {
          shape.isDeleted = action === "erase";
          this.renderStaticBackground();
          this.clearCanvas();
        }
      } else if (message.type === "cursor_move") {
        const { x, y, userId, username } = message.payload;
        if (userId) {
          this.cursors.set(userId, { x, y, username });
          this.clearCanvas();
        }
      } else if (message.type === "user_left") {
        const { userId } = message.payload;
        if (userId && this.cursors.has(userId)) {
          this.cursors.delete(userId);
          this.clearCanvas();
        }
      }
    };
  }

  private initKeyboardHandlers() {
    document.addEventListener("keydown", this.globalKeyDownHandle);
    document.addEventListener("keyup", this.globalKeyUpHandle);
  }

  private globalKeyDownHandle = (e: KeyboardEvent) => {
    if (this.isWritingText) return;

    if (e.code === "Space") {
      this.isSpacePressed = true;
      this.canvas.style.cursor = "grab";
      e.preventDefault();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      if (e.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
      e.preventDefault();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      this.redo();
      e.preventDefault();
    }
  };

  private globalKeyUpHandle = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      this.isSpacePressed = false;
      this.panning = false;
      this.canvas.style.cursor = "default";
      e.preventDefault();
    }
  };

  private screenToWorld(x: number, y: number) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    return {
      x: (canvasX - this.setX) / this.scale,
      y: (canvasY - this.setY) / this.scale,
    };
  }

  renderStaticBackground() {
    this.offscreenCtx.save();
    this.offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    this.offscreenCtx.fillStyle = "rgba(0,0,0)";
    this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    this.offscreenCtx.restore();

    this.offscreenCtx.save();
    this.offscreenCtx.setTransform(this.scale, 0, 0, this.scale, this.setX, this.setY);
    this.offscreenCtx.strokeStyle = "rgba(255,255,255)";
    this.offscreenCtx.fillStyle = "rgba(255,255,255)";

    this.existingShapes.forEach((shape) => {
      if (shape.isDeleted) return;

      if (shape.type === "rect") {
        this.offscreenCtx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === "circle") {
        this.offscreenCtx.beginPath();
        this.offscreenCtx.arc(
          shape.centerX,
          shape.centerY,
          Math.abs(shape.radius),
          0,
          Math.PI * 2
        );
        this.offscreenCtx.stroke();
        this.offscreenCtx.closePath();
      } else if (shape.type === "pencil") {
        this.offscreenCtx.beginPath();
        if (shape.points.length > 0) {
          this.offscreenCtx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            this.offscreenCtx.lineTo(shape.points[i].x, shape.points[i].y);
          }
        }
        this.offscreenCtx.stroke();
        this.offscreenCtx.closePath();
      } else if (shape.type === "triangle") {
        this.offscreenCtx.beginPath();
        this.offscreenCtx.moveTo(shape.x1, shape.y1);
        this.offscreenCtx.lineTo(shape.x2, shape.y2);
        this.offscreenCtx.lineTo(shape.x3, shape.y3);
        this.offscreenCtx.closePath();
        this.offscreenCtx.stroke();
      } else if (shape.type === "arrow") {
        this.drawArrow(this.offscreenCtx, shape.startX, shape.startY, shape.endX, shape.endY);
      } else if (shape.type === "text") {
        this.offscreenCtx.font = `${shape.fontSize}px Arial`;
        this.offscreenCtx.fillText(shape.text, shape.x, shape.y);
      }
    });

    this.offscreenCtx.restore();
  }

  clearCanvas() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    this.ctx.restore();

    this.ctx.save();
    this.ctx.setTransform(this.scale, 0, 0, this.scale, this.setX, this.setY);

    // Draw other users' cursors
    this.cursors.forEach((cursor, userId) => {
      if (userId === this.myUserId) return;

      this.ctx.beginPath();
      // Draw minimal pointer
      this.ctx.moveTo(cursor.x, cursor.y);
      this.ctx.lineTo(cursor.x + 8, cursor.y + 8);
      this.ctx.lineTo(cursor.x + 3, cursor.y + 8);
      this.ctx.lineTo(cursor.x + 3, cursor.y + 14);
      this.ctx.lineTo(cursor.x, cursor.y + 14);
      this.ctx.closePath();
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fill();

      // Draw minimal username text
      this.ctx.font = `${12 / this.scale}px Arial`;
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      this.ctx.fillText(cursor.username, cursor.x + 10, cursor.y + 16 / this.scale);
    });

    this.ctx.restore();
  }

  mouseDownHandle = (e: MouseEvent) => {
    if (this.isSpacePressed || e.button === 1) { // Space or Middle mouse button
      this.panning = true;
      this.panX = e.clientX;
      this.panY = e.clientY;
      this.canvas.style.cursor = "grabbing";
      return;
    }

    if (e.button !== 0) return;

    this.clicked = true;
    const coords = this.screenToWorld(e.clientX, e.clientY);
    this.startX = coords.x;
    this.startY = coords.y;

    if (this.selectedTool === "pencil") {
      this.painting = true;
      this.pencilPoints = [{ x: this.startX, y: this.startY }];
    } else if (this.selectedTool === "text") {
      const rect = this.canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      this.handleTextInput(coords.x, coords.y, canvasX, canvasY);
      return;
    } else if (this.selectedTool === "eraser") {
      const clickedShape = this.getClickedShape(coords.x, coords.y);
      if (clickedShape) {
        clickedShape.isDeleted = true;
        this.undoStack.push({ type: "erase", elementId: clickedShape.id });
        this.redoStack = [];

        this.socket.send(
          JSON.stringify({
            type: "erase",
            payload: { id: clickedShape.id, roomId: this.roomId }
          })
        );
        this.renderStaticBackground();
        this.clearCanvas();
      }
    }
  };

  mouseupHandler = (e: MouseEvent) => {
    if (this.panning) {
      this.panning = false;
      this.canvas.style.cursor = this.isSpacePressed ? "grab" : "default";
      return;
    }

    if (!this.clicked) return;

    this.clicked = false;
    const coords = this.screenToWorld(e.clientX, e.clientY);
    const width = coords.x - this.startX;
    const height = coords.y - this.startY;

    let shape: Shape | null = null;

    const shapeId = crypto.randomUUID();

    if (this.selectedTool === "rect") {
      shape = {
        id: shapeId,
        type: "rect",
        x: this.startX,
        y: this.startY,
        height,
        width,
      };
    } else if (this.selectedTool === "circle") {
      const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
      shape = {
        id: shapeId,
        type: "circle",
        radius: radius,
        centerX: this.startX + width / 2,
        centerY: this.startY + height / 2,
      };
    } else if (this.selectedTool === "triangle") {
      shape = {
        id: shapeId,
        type: "triangle",
        x1: this.startX + width / 2,
        y1: this.startY,
        x2: this.startX,
        y2: this.startY + height,
        x3: this.startX + width,
        y3: this.startY + height,
      };
    } else if (this.selectedTool === "pencil") {
      this.painting = false;
      shape = {
        id: shapeId,
        type: "pencil",
        points: [...this.pencilPoints],
      };
    } else if (this.selectedTool === "arrow") {
      shape = {
        id: shapeId,
        type: "arrow",
        startX: this.startX,
        startY: this.startY,
        endX: coords.x,
        endY: coords.y,
      };
    }

    if (!shape) return;

    this.existingShapes.set(shape.id, shape);
    this.undoStack.push({ type: "draw", element: shape });
    this.redoStack = [];

    this.renderStaticBackground();

    this.socket.send(
      JSON.stringify({
        type: "draw",
        payload: { shape, roomId: this.roomId },
      })
    );

    this.clearCanvas();
  };

  mousemoveHandler = (e: MouseEvent) => {
    const coords = this.screenToWorld(e.clientX, e.clientY);

    // Throttle cursor broadcast (approx 30ms ~ 30fps)
    const now = Date.now();
    if (now - this.lastCursorSendTime > 30) {
      this.lastCursorSendTime = now;
      this.socket.send(JSON.stringify({
        type: "cursor_move",
        payload: {
          x: coords.x,
          y: coords.y,
          roomId: this.roomId,
          username: this.myUsername
        }
      }));
    }

    if (this.panning) {
      const dx = e.clientX - this.panX;
      const dy = e.clientY - this.panY;
      this.setX += dx;
      this.setY += dy;
      this.panX = e.clientX;
      this.panY = e.clientY;
      this.renderStaticBackground();
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
        const centerX = this.startX + width / 2;
        const centerY = this.startY + height / 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (this.selectedTool === "triangle") {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX + width / 2, this.startY);
        this.ctx.lineTo(this.startX, this.startY + height);
        this.ctx.lineTo(this.startX + width, this.startY + height);
        this.ctx.closePath();
        this.ctx.stroke();
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
      } else if (this.selectedTool === "arrow") {
        this.drawArrow(this.ctx, this.startX, this.startY, coords.x, coords.y);
      }

      this.ctx.restore();
    }
  };

  wheelHandler = (e: WheelEvent) => {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomIntensity = 0.001;
    const wheel = e.deltaY < 0 ? 1 : -1;
    const zoom = Math.exp(wheel * zoomIntensity * 100);

    let newScale = this.scale * zoom;
    if (newScale < 0.2) newScale = 0.2;
    if (newScale > 4) newScale = 4;

    const worldX = (mouseX - this.setX) / this.scale;
    const worldY = (mouseY - this.setY) / this.scale;

    this.setX = mouseX - worldX * newScale;
    this.setY = mouseY - worldY * newScale;

    this.scale = newScale;
    this.renderStaticBackground();
    this.clearCanvas();
  };

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandle);
    this.canvas.addEventListener("mouseup", this.mouseupHandler);
    this.canvas.addEventListener("mousemove", this.mousemoveHandler);
  }

  undo() {
    const action = this.undoStack.pop();
    if (!action) return;
    this.redoStack.push(action);

    if (action.type === "draw") {
      const shape = this.existingShapes.get(action.element.id);
      if (shape) {
        shape.isDeleted = true;
        this.socket.send(JSON.stringify({ type: "undo", payload: { action: "erase", id: shape.id, roomId: this.roomId }}));
      }
    } else if (action.type === "erase") {
      const shape = this.existingShapes.get(action.elementId);
      if (shape) {
        shape.isDeleted = false;
        this.socket.send(JSON.stringify({ type: "undo", payload: { action: "restore", id: shape.id, roomId: this.roomId }}));
      }
    }
    this.renderStaticBackground();
    this.clearCanvas();
  }

  redo() {
    const action = this.redoStack.pop();
    if (!action) return;
    this.undoStack.push(action);

    if (action.type === "draw") {
      const shape = this.existingShapes.get(action.element.id);
      if (shape) {
        shape.isDeleted = false;
        this.socket.send(JSON.stringify({ type: "redo", payload: { action: "restore", id: shape.id, roomId: this.roomId }}));
      }
    } else if (action.type === "erase") {
      const shape = this.existingShapes.get(action.elementId);
      if (shape) {
        shape.isDeleted = true;
        this.socket.send(JSON.stringify({ type: "redo", payload: { action: "erase", id: shape.id, roomId: this.roomId }}));
      }
    }
    this.renderStaticBackground();
    this.clearCanvas();
  }

  initZoomAndPan() {
    this.canvas.addEventListener("wheel", this.wheelHandler, {
      passive: false,
    });
  }

  private drawArrow(ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number) {
    const headlen = 10;
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(
      tox - headlen * Math.cos(angle - Math.PI / 6),
      toy - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      tox - headlen * Math.cos(angle + Math.PI / 6),
      toy - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.lineTo(tox, toy);
    ctx.fillStyle = "white";
    ctx.fill();
  }

  exportToPNG() {
    const dataUrl = this.offscreenCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `excelidraw-canvas-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }

  exportToJSON() {
    const shapes = Array.from(this.existingShapes.values());
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shapes, null, 2));
    const link = document.createElement("a");
    link.download = `excelidraw-canvas-${Date.now()}.json`;
    link.href = dataStr;
    link.click();
  }

  importFromJSON(jsonStr: string) {
    try {
      const shapes: Shape[] = JSON.parse(jsonStr);
      shapes.forEach(shape => {
        if (!shape.id || !shape.type) return;
        const newShape = { ...shape, id: crypto.randomUUID() };
        this.existingShapes.set(newShape.id, newShape);
        this.socket.send(
          JSON.stringify({
            type: "draw",
            payload: { shape: newShape, roomId: this.roomId },
          })
        );
      });
      this.renderStaticBackground();
      this.clearCanvas();
    } catch (e) {
      console.error("Failed to parse imported JSON:", e);
      alert("Invalid JSON format");
    }
  }

  private removeTextInput() {
    if (this.textInputRef && this.textInputRef.parentNode) {
      this.textInputRef.parentNode.removeChild(this.textInputRef);
      this.textInputRef = null;
    }
    this.isWritingText = false;
    this.currentText = "";
  }

  private handleTextInput(x: number, y: number, canvasX: number, canvasY: number) {
    this.removeTextInput();

    const input = document.createElement("input");
    input.type = "text";
    input.style.position = "absolute";
    input.style.left = `${canvasX}px`;
    input.style.top = `${canvasY - 10}px`;
    input.style.background = "transparent";
    input.style.border = "none";
    input.style.outline = "none";
    input.style.color = "white";
    input.style.font = `${24 * this.scale}px Arial`;
    input.style.whiteSpace = "pre";
    input.style.minWidth = "10px";
    input.style.zIndex = "1000";
    
    if (this.canvas.parentElement) {
      this.canvas.parentElement.appendChild(input);
    } else {
      document.body.appendChild(input);
    }
    
    this.textInputRef = input;
    input.focus();

    const commitText = () => {
      const text = input.value.trim();
      if (text) {
        const shape: Shape = {
          id: crypto.randomUUID(),
          type: "text",
          x: x,
          y: y,
          text: text,
          fontSize: 24,
        };
        this.existingShapes.set(shape.id, shape);
        this.undoStack.push({ type: "draw", element: shape });
        this.redoStack = [];

        this.socket.send(
          JSON.stringify({
            type: "draw",
            payload: { shape, roomId: this.roomId },
          })
        );
        this.renderStaticBackground();
      }
      this.removeTextInput();
      this.clearCanvas();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitText();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.removeTextInput();
        this.clearCanvas();
      }
    });

    input.addEventListener("blur", () => {
      commitText();
    });

    this.isWritingText = true;
    this.textPosition = { x, y };
  }

  private getClickedShape(x: number, y: number): Shape | null {
    const shapes = Array.from(this.existingShapes.values());
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.isDeleted) continue;
      
      const hitTolerance = 15; 

      if (shape.type === "rect") {
        if (x >= shape.x - hitTolerance && x <= shape.x + shape.width + hitTolerance &&
            y >= shape.y - hitTolerance && y <= shape.y + shape.height + hitTolerance) return shape;
      } else if (shape.type === "circle") {
        const dx = x - shape.centerX;
        const dy = y - shape.centerY;
        if (dx * dx + dy * dy <= (shape.radius + hitTolerance) * (shape.radius + hitTolerance)) return shape;
      } else if (shape.type === "pencil" && shape.points.length > 0) {
        for (const p of shape.points) {
           const dx = x - p.x;
           const dy = y - p.y;
           if (dx * dx + dy * dy <= hitTolerance * hitTolerance) return shape;
        }
      } else if (shape.type === "triangle") {
        const minX = Math.min(shape.x1, shape.x2, shape.x3) - hitTolerance;
        const maxX = Math.max(shape.x1, shape.x2, shape.x3) + hitTolerance;
        const minY = Math.min(shape.y1, shape.y2, shape.y3) - hitTolerance;
        const maxY = Math.max(shape.y1, shape.y2, shape.y3) + hitTolerance;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) return shape;
      } else if (shape.type === "arrow") {
        const minX = Math.min(shape.startX, shape.endX) - hitTolerance;
        const maxX = Math.max(shape.startX, shape.endX) + hitTolerance;
        const minY = Math.min(shape.startY, shape.endY) - hitTolerance;
        const maxY = Math.max(shape.startY, shape.endY) + hitTolerance;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) return shape;
      } else if (shape.type === "text") {
        const width = shape.text.length * shape.fontSize * 0.6;
        const height = shape.fontSize;
        if (x >= shape.x - hitTolerance && x <= shape.x + width + hitTolerance &&
            y >= shape.y - height - hitTolerance && y <= shape.y + hitTolerance) return shape;
      }
    }
    return null;
  }
}
