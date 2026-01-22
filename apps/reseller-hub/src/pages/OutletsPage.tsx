import { useEffect, useState } from 'react';
import { Store, Plus, MapPin, Bot, Package, ShoppingCart } from 'lucide-react';
import { useResellerStore } from '../stores/resellerStore';
import { outletApi } from '../services/api';

interface Outlet {
  id: string;
  name: string;
  code: string;
  type: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  isActive: boolean;
  agentCount: number;
  productCount: number;
  pendingOrders: number;
}

export default function OutletsPage() {
  const { currentReseller, setCurrentOutlet } = useResellerStore();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOutlet, setNewOutlet] = useState({ name: '', code: '', type: 'physical', city: '' });

  useEffect(() => {
    if (currentReseller?.id) loadOutlets();
  }, [currentReseller]);

  const loadOutlets = async () => {
    try {
      const response = await outletApi.getByReseller(currentReseller!.id);
      setOutlets(response.data.data);
    } catch (error) {
      console.error('Failed to load outlets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOutlet = async () => {
    if (!newOutlet.name.trim() || !newOutlet.code.trim()) return;
    try {
      await outletApi.create({ resellerId: currentReseller!.id, ...newOutlet });
      setShowCreateModal(false);
      setNewOutlet({ name: '', code: '', type: 'physical', city: '' });
      loadOutlets();
    } catch (error) {
      console.error('Failed to create outlet:', error);
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
          <h1 className="text-2xl font-bold text-slate-900">Outlets</h1>
          <p className="text-slate-500">Manage your sales outlets and branches</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Outlet
        </button>
      </div>

      {outlets.length === 0 ? (
        <div className="card text-center py-12">
          <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No Outlets Yet</h3>
          <p className="text-slate-500 mb-4">Create your first outlet to start selling.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Create First Outlet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {outlets.map((outlet) => (
            <div
              key={outlet.id}
              onClick={() => setCurrentOutlet(outlet.id)}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Store className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{outlet.name}</h3>
                    <p className="text-sm text-slate-500">{outlet.code}</p>
                  </div>
                </div>
                <span className={`badge ${outlet.isActive ? 'badge-success' : 'badge-error'}`}>
                  {outlet.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {outlet.city && (
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{outlet.city}{outlet.country ? `, ${outlet.country}` : ''}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-purple-600">
                    <Bot className="w-4 h-4" />
                    <span className="font-semibold">{outlet.agentCount}</span>
                  </div>
                  <p className="text-xs text-slate-500">Agents</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-600">
                    <Package className="w-4 h-4" />
                    <span className="font-semibold">{outlet.productCount}</span>
                  </div>
                  <p className="text-xs text-slate-500">Products</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600">
                    <ShoppingCart className="w-4 h-4" />
                    <span className="font-semibold">{outlet.pendingOrders}</span>
                  </div>
                  <p className="text-xs text-slate-500">Pending</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Outlet</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Outlet Name</label>
                <input
                  type="text"
                  value={newOutlet.name}
                  onChange={(e) => setNewOutlet({ ...newOutlet, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Downtown Store"
                />
              </div>
              <div>
                <label className="label">Outlet Code</label>
                <input
                  type="text"
                  value={newOutlet.code}
                  onChange={(e) => setNewOutlet({ ...newOutlet, code: e.target.value.toUpperCase() })}
                  className="input"
                  placeholder="e.g., DT001"
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  value={newOutlet.type}
                  onChange={(e) => setNewOutlet({ ...newOutlet, type: e.target.value })}
                  className="input"
                >
                  <option value="physical">Physical Store</option>
                  <option value="online">Online Only</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  value={newOutlet.city}
                  onChange={(e) => setNewOutlet({ ...newOutlet, city: e.target.value })}
                  className="input"
                  placeholder="e.g., San Francisco"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={createOutlet} className="btn-primary flex-1">Create Outlet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
