import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { CheckCircle2, Circle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function RoadmapNode({ data }) {
  const isCompleted = data.isCompleted;

  return (
    <div
      className={`bg-black border-2 p-4 min-w-[200px] cursor-pointer ${
        isCompleted ? 'border-[#00ff00]' : 'border-white'
      } hover:border-[#00ff00] transition-colors duration-0`}
      onClick={data.onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        {isCompleted ? (
          <CheckCircle2 className="text-[#00ff00] w-5 h-5" />
        ) : (
          <Circle className="text-white w-5 h-5" />
        )}
        <div className={`font-['Press_Start_2P'] text-xs ${
          isCompleted ? 'text-[#00ff00]' : 'text-white'
        }`}>
          {data.label}
        </div>
      </div>
      {data.description && (
        <div className="text-white font-['VT323'] text-sm mt-2">
          {data.description}
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  roadmapNode: RoadmapNode,
};

export default function RoadmapDetailPage() {
  const { roadmapId } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [progress, setProgress] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [roadmapRes, progressRes] = await Promise.all([
        axios.get(`${API}/roadmaps/${roadmapId}`),
        axios.get(`${API}/progress`, { withCredentials: true }).catch(() => ({ data: [] }))
      ]);

      setRoadmap(roadmapRes.data);
      const userProgress = progressRes.data.find(p => p.roadmap_id === roadmapId);
      setProgress(userProgress || { completed_nodes: [] });

      const flowNodes = roadmapRes.data.nodes.map((node, index) => ({
        id: node.id,
        type: 'roadmapNode',
        position: { x: (index % 3) * 300, y: Math.floor(index / 3) * 200 },
        data: {
          label: node.label,
          description: node.description,
          isCompleted: userProgress?.completed_nodes.includes(node.id) || false,
          onClick: () => handleNodeClick(node)
        }
      }));

      const flowEdges = [];
      for (let i = 0; i < flowNodes.length - 1; i++) {
        flowEdges.push({
          id: `e${i}`,
          source: flowNodes[i].id,
          target: flowNodes[i + 1].id,
          type: 'smoothstep',
          style: { stroke: '#fff', strokeWidth: 2 },
          animated: false
        });
      }

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Error fetching roadmap:', error);
      toast.error('Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  }, [roadmapId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleCompleteNode = async () => {
    if (!selectedNode) return;

    try {
      await axios.post(
        `${API}/progress/${roadmapId}/complete-node`,
        { node_id: selectedNode.id },
        { withCredentials: true }
      );
      toast.success(`Completed: ${selectedNode.label}! +10 XP`);
      fetchData();
      setSelectedNode(null);
    } catch (error) {
      console.error('Error completing node:', error);
      toast.error('Failed to complete node');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-['Press_Start_2P'] text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="border-b-4 border-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white font-['Press_Start_2P'] text-2xl md:text-3xl mb-2" data-testid="roadmap-title">
            {roadmap?.title}
          </h1>
          <p className="text-white font-['VT323'] text-xl mb-4">{roadmap?.description}</p>
          <div className="flex flex-wrap gap-4">
            <div className="text-white font-['VT323'] text-lg">
              Difficulty: <span className="text-[#00ff00]">{roadmap?.difficulty}</span>
            </div>
            <div className="text-white font-['VT323'] text-lg">
              Estimated Time: <span className="text-[#00ff00]">{roadmap?.estimated_time}</span>
            </div>
            <div className="text-white font-['VT323'] text-lg">
              Progress: <span className="text-[#00ff00]">{progress?.progress_percentage?.toFixed(0) || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-250px)]">
        <div className="lg:col-span-2 border-r-0 lg:border-r-4 border-white" data-testid="roadmap-flow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            style={{ background: '#000' }}
          >
            <Background color="#333" gap={16} />
            <Controls style={{ button: { background: '#000', borderColor: '#fff', color: '#fff' } }} />
            <MiniMap
              nodeColor={() => '#fff'}
              maskColor="rgba(0, 0, 0, 0.8)"
              style={{ background: '#000', border: '2px solid #fff' }}
            />
          </ReactFlow>
        </div>

        <div className="bg-black p-6 overflow-y-auto" data-testid="node-details">
          {selectedNode ? (
            <div>
              <h2 className="text-white font-['Press_Start_2P'] text-lg mb-4">{selectedNode.label}</h2>
              <p className="text-white font-['VT323'] text-xl mb-6">{selectedNode.description}</p>

              {selectedNode.resources && selectedNode.resources.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-white font-['Press_Start_2P'] text-sm mb-4">Resources</h3>
                  <div className="space-y-3">
                    {selectedNode.resources.map((resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-black border-2 border-white hover:border-[#00ff00] p-3 transition-colors duration-0"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="text-white w-4 h-4" />
                          <span className="text-white font-['VT323'] text-lg">{resource.title}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleCompleteNode}
                className="w-full pixel-button"
                data-testid="complete-node-btn"
              >
                Mark as Complete
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-white font-['VT323'] text-xl">
                Click on a node to view details
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}