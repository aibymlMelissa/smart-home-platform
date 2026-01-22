import { useEffect, useState } from 'react';
import {
  Plus,
  Lightbulb,
  Thermometer,
  Shield,
  Zap,
  Power,
  Trash2,
  Wifi,
  WifiOff
} from 'lucide-react';
import { apiService } from '../services/api';

interface Device {
  id: string;
  name: string;
  type: string;
  protocol: string;
  status: string;
  state: Record<string, unknown>;
  roomId?: string;
  roomName?: string;
}

interface Room {
  id: string;
  name: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', type: 'light', protocol: 'wifi', roomId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [devicesRes, roomsRes] = await Promise.all([
        apiService.getDevices(),
        apiService.getRooms(),
      ]);
      setDevices(devicesRes.data);
      setRooms(roomsRes.data);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createDevice(newDevice);
      setShowAddModal(false);
      setNewDevice({ name: '', type: 'light', protocol: 'wifi', roomId: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to add device:', error);
    }
  };

  const handleToggleDevice = async (device: Device) => {
    try {
      const newState = { ...device.state, on: !device.state?.on };
      await apiService.updateDeviceState(device.id, newState);
      setDevices(devices.map(d =>
        d.id === device.id ? { ...d, state: newState } : d
      ));
    } catch (error) {
      console.error('Failed to toggle device:', error);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    try {
      await apiService.deleteDevice(id);
      setDevices(devices.filter(d => d.id !== id));
    } catch (error) {
      console.error('Failed to delete device:', error);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'light': return Lightbulb;
      case 'sensor': return Thermometer;
      case 'lock': return Shield;
      case 'switch': return Power;
      default: return Zap;
    }
  };

  const deviceTypes = [
    { value: 'light', label: 'Light' },
    { value: 'switch', label: 'Switch' },
    { value: 'sensor', label: 'Sensor' },
    { value: 'lock', label: 'Lock' },
    { value: 'thermostat', label: 'Thermostat' },
    { value: 'media', label: 'Media Player' },
    { value: 'appliance', label: 'Appliance' },
  ];

  const protocols = [
    { value: 'wifi', label: 'Wi-Fi' },
    { value: 'zigbee', label: 'Zigbee' },
    { value: 'zwave', label: 'Z-Wave' },
    { value: 'bluetooth', label: 'Bluetooth' },
    { value: 'mqtt', label: 'MQTT' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Devices</h1>
          <p className="text-gray-400">{devices.length} devices connected</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Device
        </button>
      </div>

      {/* Devices Grid */}
      {devices.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
          <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No devices yet</h3>
          <p className="text-gray-400 mb-6">Add your first smart device to get started.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Device
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => {
            const Icon = getDeviceIcon(device.type);
            const isOn = device.state?.on === true;
            return (
              <div
                key={device.id}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isOn ? 'bg-primary-500' : 'bg-slate-700'
                  }`}>
                    <Icon className={`w-6 h-6 ${isOn ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 text-xs ${
                      device.status === 'online' ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      {device.status === 'online' ? (
                        <Wifi className="w-3.5 h-3.5" />
                      ) : (
                        <WifiOff className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">{device.name}</h3>
                <p className="text-sm text-gray-400 mb-4">
                  {device.roomName || 'Unassigned'} • {device.protocol.toUpperCase()}
                </p>

                {/* Toggle Switch for controllable devices */}
                {['light', 'switch', 'appliance'].includes(device.type) && (
                  <button
                    onClick={() => handleToggleDevice(device)}
                    className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                      isOn
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                    }`}
                  >
                    {isOn ? 'Turn Off' : 'Turn On'}
                  </button>
                )}

                {/* Sensor reading */}
                {device.type === 'sensor' && device.state?.temperature !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-gray-400">Temperature</span>
                    <span className="text-white font-medium">{String(device.state.temperature)}°C</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6">Add New Device</h2>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Device Name
                </label>
                <input
                  type="text"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Living Room Light"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Device Type
                </label>
                <select
                  value={newDevice.type}
                  onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {deviceTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Protocol
                </label>
                <select
                  value={newDevice.protocol}
                  onChange={(e) => setNewDevice({ ...newDevice, protocol: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {protocols.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room (Optional)
                </label>
                <select
                  value={newDevice.roomId}
                  onChange={(e) => setNewDevice({ ...newDevice, roomId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">No room assigned</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Add Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
