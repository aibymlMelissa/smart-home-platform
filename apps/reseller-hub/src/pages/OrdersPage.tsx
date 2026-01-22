import { useEffect, useState } from 'react';
import { ShoppingCart, Clock, CheckCircle } from 'lucide-react';
import { useResellerStore } from '../stores/resellerStore';
import { orderApi, outletApi } from '../services/api';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  paymentStatus: string;
  processedByAgentName: string | null;
  createdAt: string;
}

export default function OrdersPage() {
  const { currentReseller } = useResellerStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [outlets, setOutlets] = useState<{ id: string; name: string }[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentReseller?.id) loadOutlets();
  }, [currentReseller]);

  useEffect(() => {
    if (selectedOutlet) loadOrders();
  }, [selectedOutlet, statusFilter]);

  const loadOutlets = async () => {
    try {
      const response = await outletApi.getByReseller(currentReseller!.id);
      setOutlets(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedOutlet(response.data.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load outlets:', error);
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderApi.getRetailByOutlet(selectedOutlet, statusFilter || undefined);
      setOrders(response.data.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      ready: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-slate-100 text-slate-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-yellow-600',
      paid: 'text-green-600',
      failed: 'text-red-600',
      refunded: 'text-slate-600',
    };
    return colors[status] || 'text-slate-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-500">Manage retail orders across outlets</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Outlet</label>
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="input"
            >
              {outlets.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <label className="label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12">
          <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No Orders Found</h3>
          <p className="text-slate-500">Orders will appear here when customers make purchases.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Order</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Customer</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Status</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Total</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Payment</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Processed By</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium text-slate-900">{order.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{order.customerName || 'Walk-in'}</p>
                      {order.customerEmail && (
                        <p className="text-sm text-slate-500">{order.customerEmail}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus === 'paid' && <CheckCircle className="w-4 h-4 inline mr-1" />}
                      {order.paymentStatus === 'pending' && <Clock className="w-4 h-4 inline mr-1" />}
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {order.processedByAgentName || '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
