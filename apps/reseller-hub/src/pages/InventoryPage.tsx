import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Search } from 'lucide-react';
import { useResellerStore } from '../stores/resellerStore';
import { inventoryApi, outletApi } from '../services/api';

interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  category: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  retailPrice: number;
  isLowStock: boolean;
}

export default function InventoryPage() {
  const { currentReseller, currentOutletId } = useResellerStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [outlets, setOutlets] = useState<{ id: string; name: string }[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState(currentOutletId || '');
  const [showLowStock, setShowLowStock] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentReseller?.id) loadOutlets();
  }, [currentReseller]);

  useEffect(() => {
    if (selectedOutlet) loadInventory();
  }, [selectedOutlet, showLowStock]);

  const loadOutlets = async () => {
    try {
      const response = await outletApi.getByReseller(currentReseller!.id);
      setOutlets(response.data.data);
      if (response.data.data.length > 0 && !selectedOutlet) {
        setSelectedOutlet(response.data.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load outlets:', error);
    }
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const response = await inventoryApi.getByOutlet(selectedOutlet, showLowStock);
      setInventory(response.data.data);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.productName.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = inventory.filter(i => i.isLowStock).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500">Manage stock levels across outlets</p>
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
          <div className="flex-1 min-w-[200px]">
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
                placeholder="Search products..."
              />
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-slate-700">Low stock only</span>
              {lowStockCount > 0 && (
                <span className="badge badge-warning">{lowStockCount}</span>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No Inventory Found</h3>
          <p className="text-slate-500">Add products to this outlet's inventory.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Product</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">SKU</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Category</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Stock</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Reserved</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Available</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Price</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900">{item.productName}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{item.sku}</td>
                  <td className="px-6 py-4 text-slate-500">{item.category}</td>
                  <td className="px-6 py-4 text-right font-medium">{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-slate-500">{item.reservedQuantity}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900">{item.availableQuantity}</td>
                  <td className="px-6 py-4 text-right text-slate-900">${item.retailPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    {item.isLowStock ? (
                      <span className="badge badge-warning">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="badge badge-success">In Stock</span>
                    )}
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
