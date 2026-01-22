import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Bot,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  Activity,
  DollarSign,
} from 'lucide-react';
import { useResellerStore } from '../stores/resellerStore';
import { resellerApi, agentApi } from '../services/api';

interface DashboardStats {
  outlets: number;
  agents: { total: number; active: number };
  orders: { pending: number; completed: number; revenue30d: number };
  lowStockItems: number;
}

interface AgentActivity {
  id: string;
  name: string;
  agentType: string;
  status: string;
  lastActiveAt: string;
}

export default function DashboardPage() {
  const { currentReseller } = useResellerStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [agents, setAgents] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentReseller?.id) {
      loadDashboard();
    }
  }, [currentReseller]);

  const loadDashboard = async () => {
    try {
      const [dashResponse, agentsResponse] = await Promise.all([
        resellerApi.getDashboard(currentReseller!.id),
        agentApi.getByReseller(currentReseller!.id),
      ]);
      setStats(dashResponse.data.data);
      setAgents(agentsResponse.data.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats
    ? [
        {
          name: 'Active Outlets',
          value: stats.outlets,
          icon: Store,
          color: 'bg-blue-500',
          href: '/outlets',
        },
        {
          name: 'AI Agents',
          value: `${stats.agents.active}/${stats.agents.total}`,
          subtitle: 'active',
          icon: Bot,
          color: 'bg-purple-500',
          href: '/agents',
        },
        {
          name: 'Pending Orders',
          value: stats.orders.pending,
          icon: ShoppingCart,
          color: 'bg-orange-500',
          href: '/orders',
        },
        {
          name: '30-Day Revenue',
          value: `$${stats.orders.revenue30d.toLocaleString()}`,
          icon: DollarSign,
          color: 'bg-green-500',
          href: '/analytics',
        },
      ]
    : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'busy':
        return 'bg-green-100 text-green-800';
      case 'idle':
        return 'bg-blue-100 text-blue-800';
      case 'offline':
        return 'bg-slate-100 text-slate-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getAgentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      outlet_manager: 'Manager',
      sales_agent: 'Sales',
      inventory_agent: 'Inventory',
      support_agent: 'Support',
      analytics_agent: 'Analytics',
    };
    return labels[type] || type;
  };

  if (!currentReseller) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No Reseller Selected</h2>
        <p className="text-slate-500">Please select or create a reseller to continue.</p>
      </div>
    );
  }

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here's an overview of {currentReseller.companyName}.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-slate-400">{stat.subtitle}</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Alerts */}
      {stats && stats.lowStockItems > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Low Stock Alert</h3>
            <p className="text-sm text-yellow-700">
              {stats.lowStockItems} products are running low on stock across your outlets.
            </p>
            <Link to="/inventory?lowStock=true" className="text-sm text-yellow-800 font-medium hover:underline">
              View inventory
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Agents Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">AI Agents</h2>
            <Link to="/agents" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>

          {agents.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No agents configured yet</p>
              <Link to="/agents" className="text-sm text-primary-600 hover:underline">
                Add your first agent
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => (
                <Link
                  key={agent.id}
                  to={`/agents/${agent.id}`}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{agent.name}</p>
                      <p className="text-xs text-slate-500">{getAgentTypeLabel(agent.agentType)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {agent.status === 'busy' && (
                      <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                    )}
                    <span className={`badge ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/orders"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-slate-700">New Order</span>
            </Link>
            <Link
              to="/agents"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Bot className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-slate-700">Deploy Agent</span>
            </Link>
            <Link
              to="/inventory"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Package className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-slate-700">Check Stock</span>
            </Link>
            <Link
              to="/analytics"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-medium text-slate-700">View Reports</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
