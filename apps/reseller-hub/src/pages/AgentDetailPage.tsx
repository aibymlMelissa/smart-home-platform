import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Activity, CheckCircle, XCircle, Zap } from 'lucide-react';
import { agentApi } from '../services/api';

interface AgentDetail {
  id: string;
  name: string;
  agentType: string;
  model: string;
  status: string;
  capabilities: string[];
  resellerName: string;
  outletName: string | null;
  recentTasks: Array<{
    id: string;
    taskType: string;
    status: string;
    priority: number;
    createdAt: string;
    completedAt: string | null;
  }>;
  recentActions: Array<{
    id: string;
    actionType: string;
    description: string;
    success: boolean;
    durationMs: number;
    createdAt: string;
  }>;
}

interface Metrics {
  last30Days: {
    tasks: { total: number; completed: number; failed: number; successRate: string };
    actions: { total: number; successful: number; successRate: string; avgDurationMs: string };
  };
}

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskInput, setTaskInput] = useState({ taskType: '', priority: 5 });

  useEffect(() => {
    if (id) loadAgent();
  }, [id]);

  const loadAgent = async () => {
    try {
      const [agentRes, metricsRes] = await Promise.all([
        agentApi.getById(id!),
        agentApi.getMetrics(id!),
      ]);
      setAgent(agentRes.data.data);
      setMetrics(metricsRes.data.data);
    } catch (error) {
      console.error('Failed to load agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async () => {
    if (!taskInput.taskType.trim()) return;
    try {
      await agentApi.assignTask(id!, taskInput);
      setTaskInput({ taskType: '', priority: 5 });
      loadAgent();
    } catch (error) {
      console.error('Failed to assign task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      busy: 'bg-green-100 text-green-800',
      idle: 'bg-blue-100 text-blue-800',
      offline: 'bg-slate-100 text-slate-800',
      error: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!agent) {
    return <div className="text-center py-12 text-slate-500">Agent not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/agents" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
            <span className={`badge ${getStatusColor(agent.status)}`}>
              {agent.status === 'busy' && <Activity className="w-3 h-3 mr-1 animate-pulse" />}
              {agent.status}
            </span>
          </div>
          <p className="text-slate-500">{agent.agentType.replace('_', ' ')} - {agent.model}</p>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-slate-500">Tasks (30d)</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.last30Days.tasks.total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">{metrics.last30Days.tasks.successRate}%</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Actions (30d)</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.last30Days.actions.total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Avg Duration</p>
            <p className="text-2xl font-bold text-slate-900">{metrics.last30Days.actions.avgDurationMs}ms</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assign Task */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Assign New Task</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Task Type</label>
              <input
                type="text"
                value={taskInput.taskType}
                onChange={(e) => setTaskInput({ ...taskInput, taskType: e.target.value })}
                className="input"
                placeholder="e.g., process_order, check_inventory"
              />
            </div>
            <div>
              <label className="label">Priority (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={taskInput.priority}
                onChange={(e) => setTaskInput({ ...taskInput, priority: parseInt(e.target.value) })}
                className="input"
              />
            </div>
            <button onClick={assignTask} className="btn-primary w-full">
              <Zap className="w-4 h-4 inline mr-1" />
              Assign Task
            </button>
          </div>
        </div>

        {/* Capabilities */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Capabilities</h2>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map((cap, i) => (
              <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {cap.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Tasks</h2>
          {agent.recentTasks.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No tasks yet</p>
          ) : (
            <div className="space-y-2">
              {agent.recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{task.taskType}</p>
                    <p className="text-xs text-slate-500">Priority: {task.priority}</p>
                  </div>
                  <span className={`badge ${getStatusColor(task.status)}`}>{task.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Activity Log</h2>
          {agent.recentActions.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No activity yet</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {agent.recentActions.map((action) => (
                <div key={action.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  {action.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm">{action.actionType}</p>
                    {action.description && (
                      <p className="text-xs text-slate-500 truncate">{action.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{action.durationMs}ms</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
