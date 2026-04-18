import { useEffect, useRef, useState } from "react";
import { initDraw } from "@/draw";
import { IconButton } from "./Icons";
import { ArrowBigRight, Circle, Eraser, Pencil, RectangleHorizontal, Text, Triangle, Download, Upload, Undo, Redo, FileJson, MousePointer2, Palette } from "lucide-react";
import { Game } from "@/draw/Game";

export type Tool = "circle" | "rect" | "pencil" | "triangle" | "arrow" | "text" | "eraser" | "select";

export function Canvas({
    roomId,
    socket
}: {
    socket: WebSocket;
    roomId: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("select");
    const [showStylingPanel, setShowStylingPanel] = useState(false);
    const [selectedShapeCount, setSelectedShapeCount] = useState(0);

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    // Cursor polling to override default while respecting Game's spacebar panning
    useEffect(() => {
        if (!game || !canvasRef.current) return;
        const interval = setInterval(() => {
            const isSpacePressed = (game as any).isSpacePressed;
            if (isSpacePressed) return;
            
            let cursor = "default";
            switch (selectedTool) {
                case "pencil":
                case "rect":
                case "circle":
                case "triangle":
                case "arrow":
                    cursor = "crosshair";
                    break;
                case "text":
                    cursor = "text";
                    break;
                case "eraser":
                    cursor = "cell";
                    break;
            }
            if (canvasRef.current.style.cursor !== cursor) {
                canvasRef.current.style.cursor = cursor;
            }
        }, 100);
        return () => clearInterval(interval);
    }, [selectedTool, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            g.onSelectionChange = (ids) => {
                setSelectedShapeCount(ids.size);
            };
            setGame(g);

            return () => {
                g.destroy();
            }
        }
    }, [roomId, socket]);

    return (
        <div className="h-screen w-screen overflow-hidden bg-[#0f0f0f]">
            <canvas ref={canvasRef} width={2000} height={1000}></canvas>
            
            <Topbar roomId={roomId} game={game} />
            <LeftToolbar 
                selectedTool={selectedTool} 
                setSelectedTool={setSelectedTool} 
                showStylingPanel={showStylingPanel}
                setShowStylingPanel={setShowStylingPanel}
            />
            {showStylingPanel && selectedShapeCount > 0 && selectedTool !== "eraser" && <FloatingStylingPanel game={game} />}
        </div>
    );
}

function Topbar({ roomId, game }: { roomId: string, game?: Game }) {
    const [zoom, setZoom] = useState(100);

    // Poll for zoom scale without touching Game.ts
    useEffect(() => {
        if (!game) return;
        const interval = setInterval(() => {
            const scale = (game as any).scale;
            if (scale !== undefined) {
                setZoom(Math.round(scale * 100));
            }
        }, 100);
        return () => clearInterval(interval);
    }, [game]);

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center justify-between bg-[#1a1a1a]/80 backdrop-blur-md border border-[#2a2a2a] rounded-2xl shadow-lg px-4 py-3 w-[95%] max-w-6xl z-50 transition-all">
            {/* Left: Room Name */}
            <div className="flex items-center gap-4 text-white">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white text-black shadow-sm">
                    <span className="font-bold text-sm">Ex</span>
                </div>
                <span className="font-medium text-sm text-gray-200 truncate max-w-[150px] md:max-w-[300px]">
                    {roomId}
                </span>
            </div>

            {/* Center: Undo/Redo & Zoom */}
            <div className="flex items-center gap-2 border-l border-r border-[#2a2a2a] px-4">
                <IconButton 
                    title="Undo (Ctrl+Z)"
                    icon={<Undo size={18} />} 
                    onClick={() => game?.undo()} 
                />
                <IconButton 
                    title="Redo (Ctrl+Y)"
                    icon={<Redo size={18} />} 
                    onClick={() => game?.redo()} 
                />
                <div className="px-3 py-1 ml-2 bg-[#2f2f2f] rounded-lg text-xs font-medium text-gray-300 shadow-inner select-none cursor-default">
                    {zoom}%
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <IconButton 
                    title="Export as PNG"
                    icon={<Download size={18} />} 
                    onClick={() => game?.exportToPNG()} 
                />
                <IconButton 
                    title="Export as JSON"
                    icon={<FileJson size={18} />} 
                    onClick={() => game?.exportToJSON()} 
                />
                <label className="m-1 flex cursor-pointer items-center justify-center rounded-xl p-2.5 transition-all duration-200 ease-out hover:scale-105 active:scale-95 bg-transparent text-[#9ca3af] hover:bg-[#2f2f2f] hover:text-white" title="Import JSON">
                    <Upload size={18} />
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
                        e.target.value = '';
                    }} />
                </label>
            </div>
        </div>
    );
}

function LeftToolbar({ selectedTool, setSelectedTool, showStylingPanel, setShowStylingPanel }: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void,
    showStylingPanel: boolean,
    setShowStylingPanel: (s: boolean) => void
}) {
    return (
        <div className="fixed top-1/2 left-4 -translate-y-1/2 flex flex-col gap-2 bg-[#1a1a1a]/80 backdrop-blur-md border border-[#2a2a2a] rounded-2xl shadow-lg p-2 z-50 transition-all">
            <IconButton title="Toggle Styling" activated={showStylingPanel} icon={<Palette size={20} />} onClick={() => setShowStylingPanel(!showStylingPanel)} />
            <div className="w-full h-[1px] bg-[#2a2a2a] my-1"></div>
            <IconButton title="Select" activated={selectedTool === "select"} icon={<MousePointer2 size={20} />} onClick={() => setSelectedTool("select")} />
            <IconButton title="Pencil" activated={selectedTool === "pencil"} icon={<Pencil size={20} />} onClick={() => setSelectedTool("pencil")} />
            <IconButton title="Rectangle" activated={selectedTool === "rect"} icon={<RectangleHorizontal size={20} />} onClick={() => setSelectedTool("rect")} />
            <IconButton title="Circle" activated={selectedTool === "circle"} icon={<Circle size={20} />} onClick={() => setSelectedTool("circle")} />
            <IconButton title="Triangle" activated={selectedTool === "triangle"} icon={<Triangle size={20} />} onClick={() => setSelectedTool("triangle")} />
            <IconButton title="Arrow" activated={selectedTool === "arrow"} icon={<ArrowBigRight size={20} />} onClick={() => setSelectedTool("arrow")} />
            <IconButton title="Text" activated={selectedTool === "text"} icon={<Text size={20} />} onClick={() => setSelectedTool("text")} />
            <IconButton title="Eraser" activated={selectedTool === "eraser"} icon={<Eraser size={20} />} onClick={() => setSelectedTool("eraser")} />
        </div>
    );
}

function FloatingStylingPanel({ game }: { game?: Game }) {
    const [strokeColor, setStrokeColor] = useState("#ffffff");
    const [fillColor, setFillColor] = useState("transparent");
    const [strokeWidth, setStrokeWidth] = useState(2);

    useEffect(() => {
        if (!game) return;
        game.currentStrokeColor = strokeColor;
        game.currentFillColor = fillColor;
        game.currentStrokeWidth = strokeWidth;
        game.updateShapeStyle({ strokeColor, fillColor, strokeWidth });
    }, [strokeColor, fillColor, strokeWidth, game]);

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-[#1a1a1a]/90 backdrop-blur-md border border-[#2a2a2a] rounded-full shadow-xl px-6 py-3 z-50 flex flex-row items-center gap-6 text-white transition-all animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stroke</span>
                <div className="flex gap-2">
                    {["#ffffff", "#ef4444", "#3b82f6", "#22c55e", "#eab308"].map(c => (
                        <button key={c} onClick={() => setStrokeColor(c)} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${strokeColor === c ? 'border-white scale-110' : 'border-transparent'}`} style={{backgroundColor: c}}></button>
                    ))}
                </div>
            </div>
            
            <div className="w-[1px] h-6 bg-[#2a2a2a]"></div>

            <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fill</span>
                <div className="flex gap-2">
                    <button onClick={() => setFillColor("transparent")} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${fillColor === "transparent" ? 'border-white scale-110' : 'border-[#2a2a2a]'}`}>
                        <div className="w-full h-full bg-transparent rounded-full relative overflow-hidden"><div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500 -rotate-45 -translate-y-1/2"></div></div>
                    </button>
                    {["#ef4444", "#3b82f6", "#22c55e", "#eab308"].map(c => (
                        <button key={c} onClick={() => setFillColor(c)} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${fillColor === c ? 'border-white scale-110' : 'border-transparent'}`} style={{backgroundColor: c}}></button>
                    ))}
                </div>
            </div>

            <div className="w-[1px] h-6 bg-[#2a2a2a]"></div>

            <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Width</span>
                <input type="range" min="1" max="10" value={strokeWidth} onChange={(e) => setStrokeWidth(parseInt(e.target.value))} className="w-24 accent-white cursor-pointer" />
            </div>
        </div>
    );
}