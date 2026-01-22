import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Plus, Activity, Zap, Settings, Play, Pause } from 'lucide-react';
import { useResellerStore } from '../stores/resellerStore';
import { agentApi } from '../services/api';

interface Agent {
  id: string;
  name: string;
  agentType: string;
  model: string;
  status: string;
  outletName: string | null;
  tasksCompleted: number;
  tasksPending: number;
  lastActiveAt: string | null;
  isActive: boolean;
}

const AGENT_TYPES = [
  { value: 'outlet_manager', label: 'Outlet Manager', description: 'Manages outlet operations, approvals, and staff' },
  { value: 'sales_agent', label: 'Sales Agent', description: 'Handles customer orders and device registration' },
  { value: 'inventory_agent', label: 'Inventory Agent', description: 'Manages stock levels and reorders' },
  { value: 'support_agent', label: 'Support Agent', description: 'Handles returns, warranties, and customer issues' },
  { value: 'analytics_agent', label: 'Analytics Agent', description: 'Generates reports and insights' },
];

export default function AgentsPage() {
  const { currentReseller } = useResellerStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', agentType: 'sales_agent' });

  useEffect(() => {
    if (currentReseller?.id) {
      loadAgents();
    }
  }, [currentReseller]);

  const loadAgents = async () => {
    try {
      const response = await agentApi.getByReseller(currentReseller!.id);
      setAgents(response.data.data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async () => {
    if (!newAgent.name.trim()) return;

    try {
      await agentApi.create({
        resellerId: currentReseller!.id,
        name: newAgent.name,
        agentType: newAgent.agentType,
      });
      setShowCreateModal(false);
      setNewAgent({ name: '', agentType: 'sales_agent' });
      loadAgents();
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  const toggleAgentStatus = async (agent: Agent) => {
    try {
      const newStatus = agent.status === 'idle' ? 'busy' : 'idle';
      await agentApi.updateStatus(agent.id, newStatus);
      loadAgents();
    } catch (error) {
      console.error('Failed to update agent status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'busy': return 'bg-green-100 text-green-800';
      case 'idle': return 'bg-blue-100 text-blue-800';
      case 'offline': return 'bg-slate-100 text-slate-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getAgentTypeInfo = (type: string) => AGENT_TYPES.find(t => t.value === type);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Agents</h1>
          <p className="text-slate-500">Manage your autonomous AI agents</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Deploy Agent
        </button>
      </div>

      {/* Agent Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-slate-500">Total Agents</p>
          <p className="text-2xl font-bold text-slate-900">{agents.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {agents.filter(a => a.status === 'busy').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Idle</p>
          <p className="text-2xl font-bold text-blue-600">
            {agents.filter(a => a.status === 'idle').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Pending Tasks</p>
          <p className="text-2xl font-bold text-orange-600">
            {agents.reduce((sum, a) => sum + a.tasksPending, 0)}
          </p>
        </div>
      </div>

      {/* Agents Grid */}
      {agents.length === 0 ? (
        <div className="card text-center py-12">
          <Bot className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No Agents Yet</h3>
          <p className="text-slate-500 mb-4">Deploy your first AI agent to automate operations.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Deploy Your First Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const typeInfo = getAgentTypeInfo(agent.agentType);
            return (
              <div key={agent.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{agent.name}</h3>
                      <p className="text-sm text-slate-500">{typeInfo?.label}</p>
                    </div>
                  </div>
                  <span className={`badge ${getStatusColor(agent.status)}`}>
                    {agent.status === 'busy' && <Activity className="w-3 h-3 mr-1 animate-pulse" />}
                    {agent.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-slate-500">
                    <span>Model:</span>
                    <span className="text-slate-700">{agent.model}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tasks Completed:</span>
                    <span className="text-slate-700">{agent.tasksCompleted}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Pending Tasks:</span>
                    <span className="text-slate-700">{agent.tasksPending}</span>
                  </div>
                  {agent.outletName && (
                    <div className="flex justify-between text-slate-500">
                      <span>Assigned to:</span>
                      <span className="text-slate-700">{agent.outletName}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <Link
                    to={`/agents/${agent.id}`}
                    className="flex-1 text-center py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4 inline mr-1" />
                    Configure
                  </Link>
                  <button
                    onClick={() => toggleAgentStatus(agent)}
                    className="flex-1 text-center py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {agent.status === 'busy' ? (
                      <>
                        <Pause className="w-4 h-4 inline mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 inline mr-1" />
                        Start
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Deploy New Agent</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Agent Name</label>
                <input
                  type="text"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Sales Bot Alpha"
                />
              </div>

              <div>
                <label className="label">Agent Type</label>
                <select
                  value={newAgent.agentType}
                  onChange={(e) => setNewAgent({ ...newAgent, agentType: e.target.value })}
                  className="input"
                >
                  {AGENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {getAgentTypeInfo(newAgent.agentType)?.description}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={createAgent} className="btn-primary flex-1">
                <Zap className="w-4 h-4 inline mr-1" />
                Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
