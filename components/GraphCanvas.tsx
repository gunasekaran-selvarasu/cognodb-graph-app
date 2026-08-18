'use client';

import dynamic from 'next/dynamic';
import { useRef, useCallback, useEffect, useState } from 'react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface GraphCanvasProps {
    data: {
        nodes: Array<{ id: string; name: string; type: string;[key: string]: any }>;
        links: Array<{ source: any; target: any; type: string; role?: string }>;
    };
    selectedNode: any;
    onNodeSelect: (node: any) => void;
}

export default function GraphCanvas({ data, selectedNode, onNodeSelect }: GraphCanvasProps) {
    const fgRef = useRef<any>(null);
    const isInitialRender = useRef(true);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        isInitialRender.current = true;
        setIsReady(false);
    }, [data]);

    const handleEngineStop = useCallback(() => {
        if (isInitialRender.current && fgRef.current) {
            // First zoom to fit with padding, instantly
            fgRef.current.zoomToFit(0, 80);
            
            const currentCenter = fgRef.current.centerAt();
            const bbox = fgRef.current.getGraphBbox();
            
            if (bbox && bbox.x) {
                const graphWidth = bbox.x[1] - bbox.x[0];
                // Shift camera right by 25% of graph width to shift graph to the left (instantly to avoid visual glitch)
                const shiftX = graphWidth * 0.25;
                fgRef.current.centerAt(currentCenter.x + shiftX, currentCenter.y, 0);
            }
            isInitialRender.current = false;
            setIsReady(true);
        }
    }, []);

    const handleNodeClick = useCallback((node: any) => {
        onNodeSelect(node);
        if (fgRef.current) {
            // Centering the camera slightly to the right of the node
            // so the node is positioned in the left portion of the screen
            fgRef.current.centerAt(node.x + 80, node.y, 800);
            fgRef.current.zoom(2.5, 800);
        }
    }, [onNodeSelect]);

    const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const isSelected = selectedNode?.id === node.id;
        const isPerson = node.type === 'Person';
        const radius = isSelected ? 8 : isPerson ? 6 : 7;
        const fontSize = Math.max(10 / globalScale, 3.5);

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = isSelected ? '#38bdf8' : isPerson ? '#818cf8' : '#34d399';
        ctx.fill();

        if (isSelected) {
            ctx.lineWidth = 2 / globalScale;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
        }

        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(node.name, node.x, node.y + radius + fontSize + 1);
    }, [selectedNode]);

    return (
        <div className="relative w-full h-[600px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <div className={`w-full h-full transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
                <ForceGraph2D
                    ref={fgRef}
                    graphData={data}
                    nodeCanvasObject={paintNode}
                    nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
                        ctx.fill();
                    }}
                    linkColor={(link: any) => (link.type === 'DIRECTED' ? '#f59e0b' : '#475569')}
                    linkWidth={(link: any) => (link.type === 'DIRECTED' ? 1.8 : 1.2)}
                    linkDirectionalParticles={1}
                    linkDirectionalParticleWidth={2}
                    onNodeClick={handleNodeClick}
                    onEngineStop={handleEngineStop}
                    cooldownTicks={100}
                />
            </div>

            {!isReady && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-slate-400 z-10">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium tracking-wide animate-pulse">Calculating connection topology...</span>
                    </div>
                </div>
            )}

            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md p-3 rounded-lg border border-slate-700/60 text-xs flex gap-4 text-slate-300 pointer-events-none z-10">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block" /> Person
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> Movie
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 bg-amber-500 inline-block" /> Directed
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 bg-slate-600 inline-block" /> Acted In
                </div>
            </div>
        </div>
    );
}