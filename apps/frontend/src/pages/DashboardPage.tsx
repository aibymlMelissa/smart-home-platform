import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lightbulb,
  Thermometer,
  Shield,
  Zap,
  Grid3x3,
  Layers,
  Activity,
  Power,
  ChevronRight
} from 'lucide-react';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface Stats {
  totalDevices: number;
  totalRooms: number;
  totalAutomations: number;
}

interface Device {
  id: string;
  name: string;
  type: string;
  status: string;
  state: Record<string, unknown>;
  roomName?: string;
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<Stats>({ totalDevices: 0, totalRooms: 0, totalAutomations: 0 });
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, devicesRes] = await Promise.all([
          apiService.getUserStats(),
          apiService.getDevices(),
        ]);
        setStats(statsRes.data);
        setDevices(devicesRes.data.slice(0, 6)); // Show only first 6 devices
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'light': return Lightbulb;
      case 'sensor': return Thermometer;
      case 'lock': return Shield;
      case 'switch': return Power;
      default: return Zap;
    }
  };

  const quickStats = [
    { name: 'Total Devices', value: stats.totalDevices, icon: Grid3x3, color: 'bg-blue-500' },
    { name: 'Total Rooms', value: stats.totalRooms, icon: Layers, color: 'bg-purple-500' },
    { name: 'Automations', value: stats.totalAutomations, icon: Zap, color: 'bg-amber-500' },
    { name: 'Online Devices', value: devices.filter(d => d.status === 'online').length, icon: Activity, color: 'bg-green-500' },
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
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-400">Here's an overview of your smart home.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat) => (
          <div
            key={stat.name}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Devices */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Your Devices</h2>
          <Link
            to="/devices"
            className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {devices.length === 0 ? (
          <div className="p-8 text-center">
            <Grid3x3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No devices added yet.</p>
            <Link
              to="/devices"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Add your first device
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {devices.map((device) => {
              const Icon = getDeviceIcon(device.type);
              const isOn = device.state?.on === true;
              return (
                <div
                  key={device.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isOn ? 'bg-primary-500' : 'bg-slate-700'
                    }`}>
                      <Icon className={`w-5 h-5 ${isOn ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-white">{device.name}</p>
                      <p className="text-sm text-gray-400">
                        {device.roomName || 'Unassigned'} • {device.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      device.status === 'online'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        device.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                      }`}></span>
                      {device.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
