'use client';

import { useState, useEffect } from 'react';
import GraphCanvas from '@/components/GraphCanvas';
import { Sparkles, Film, User, Network, AlertCircle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/graph');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load graph.');
      setGraphData({ nodes: json.nodes, links: json.links });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (personId: string) => {
    try {
      setRecLoading(true);
      const res = await fetch(`/api/graph?mode=recommend&personId=${personId}`);
      const json = await res.json();
      if (json.success) {
        setRecommendations(json.recommendations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  useEffect(() => {
    if (selectedNode && selectedNode.type === 'Person') {
      fetchRecommendations(selectedNode.id);
    } else {
      setRecommendations([]);
    }
  }, [selectedNode]);

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Network className="text-sky-400 h-6 w-6" /> CognoDB Graph Explorer
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Interactive multi-hop talent recommendations and connection topology.
            </p>
          </div>
          <button
            onClick={fetchGraph}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-sm transition border border-slate-700 w-fit"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Graph
          </button>
        </header>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Database unreachable: {error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {loading ? (
              <div className="w-full h-[600px] bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500">
                <span className="animate-pulse">Loading Graph Nodes...</span>
              </div>
            ) : (
              <GraphCanvas
                data={graphData}
                selectedNode={selectedNode}
                onNodeSelect={(node) => setSelectedNode(node)}
              />
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Entity Inspector
              </h2>
              {selectedNode ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {selectedNode.type === 'Person' ? (
                      <User className="h-5 w-5 text-indigo-400" />
                    ) : (
                      <Film className="h-5 w-5 text-emerald-400" />
                    )}
                    <span className="text-lg font-medium text-white">{selectedNode.name}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      ID: {selectedNode.id}
                    </span>
                    <span className="ml-2 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Type: {selectedNode.type}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Click on any node to view details.</p>
              )}
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <h2 className="text-xs uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> 2-Hop Recommendations
              </h2>

              {selectedNode?.type === 'Person' ? (
                recLoading ? (
                  <p className="text-xs text-slate-500 animate-pulse">Running Cypher traversal...</p>
                ) : recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm text-slate-200">{rec.title}</h4>
                          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                            ★ {rec.rating}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Via: <span className="text-slate-300">{rec.coActors.join(', ')}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No indirect suggestions found for this person.</p>
                )
              ) : (
                <p className="text-xs text-slate-500 italic">Select a Person node to evaluate indirect co-star recommendations.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}