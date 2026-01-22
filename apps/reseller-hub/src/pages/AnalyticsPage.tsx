import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { useResellerStore } from '../stores/resellerStore';
import { orderApi } from '../services/api';

interface AnalyticsData {
  period: number;
  daily: Array<{
    date: string;
    orderCount: number;
    revenue: number;
    completed: number;
    cancelled: number;
  }>;
  totals: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
}

export default function AnalyticsPage() {
  const { currentReseller } = useResellerStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentReseller?.id) loadAnalytics();
  }, [currentReseller, period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await orderApi.getAnalytics(currentReseller!.id, period);
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500">Sales performance and insights</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(parseInt(e.target.value))}
          className="input w-40"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${analytics.totals.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900">
                  {analytics.totals.totalOrders}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Avg. Order Value</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${analytics.totals.avgOrderValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Chart (simple bar representation) */}
      {analytics && analytics.daily.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Daily Revenue</h2>
          <div className="h-64 flex items-end gap-1">
            {analytics.daily.slice(-30).map((day, i) => {
              const maxRevenue = Math.max(...analytics.daily.map(d => d.revenue), 1);
              const height = (day.revenue / maxRevenue) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 bg-primary-500 rounded-t hover:bg-primary-600 transition-colors relative group"
                  style={{ height: `${Math.max(height, 2)}%` }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                    {new Date(day.date).toLocaleDateString()}: ${day.revenue.toFixed(0)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Details Table */}
      {analytics && analytics.daily.length > 0 && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Date</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Orders</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Completed</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Cancelled</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.daily.slice(0, 14).map((day) => (
                <tr key={day.date} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-slate-900">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-3 text-right">{day.orderCount}</td>
                  <td className="px-6 py-3 text-right text-green-600">{day.completed}</td>
                  <td className="px-6 py-3 text-right text-red-600">{day.cancelled}</td>
                  <td className="px-6 py-3 text-right font-medium">${day.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {analytics && analytics.daily.length === 0 && (
        <div className="card text-center py-12">
          <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No Data Yet</h3>
          <p className="text-slate-500">Analytics will appear once you start processing orders.</p>
        </div>
      )}
    </div>
  );
}
