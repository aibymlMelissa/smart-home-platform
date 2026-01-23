import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Heart,
  Home,
  Bell,
  Phone,
  Settings,
  LogOut,
  HeartHandshake,
  HelpCircle,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { apiService } from '../services/api';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  // Simplified navigation for elderly users
  const navigation = [
    { name: 'Home', href: '/', icon: Home, description: 'Main screen' },
    { name: 'Reminders', href: '/reminders', icon: Bell, description: 'Your schedule' },
    { name: 'Family', href: '/family', icon: Heart, description: 'Contact family' },
    { name: 'Help', href: '/help', icon: HelpCircle, description: 'Get support' },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sidebar - Simplified for elderly users */}
      <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 lg:translate-x-0 -translate-x-full lg:block hidden">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-700">
            <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center">
              <HeartHandshake className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">SafeHome</span>
              <p className="text-sm text-gray-400">Your safety companion</p>
            </div>
          </div>

          {/* Navigation - Large touch targets */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-lg font-medium block">{item.name}</span>
                  <span className="text-sm opacity-70">{item.description}</span>
                </div>
              </NavLink>
            ))}
          </nav>

          {/* Emergency Button in Sidebar */}
          <div className="px-4 py-4 border-t border-slate-700">
            <button
              onClick={() => window.location.href = 'tel:000'}
              className="w-full flex items-center gap-4 px-5 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-colors"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-bold block">Emergency</span>
                <span className="text-sm opacity-80">Call 000</span>
              </div>
            </button>
          </div>

          {/* User info - Simplified */}
          <div className="border-t border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-rose-400">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="text-base font-medium text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-gray-400">Welcome back</p>
              </div>
            </div>
            <div className="flex gap-2">
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-slate-600 text-white'
                      : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-gray-400 hover:bg-slate-700 hover:text-white rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-800 border-t border-slate-700 px-2 py-2 safe-area-bottom">
        <div className="flex items-center justify-around">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                  isActive
                    ? 'text-rose-400'
                    : 'text-gray-400 hover:text-white'
                }`
              }
            >
              <item.icon className="w-7 h-7" />
              <span className="text-xs font-medium">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">SafeHome</span>
          </div>
          <button
            onClick={() => window.location.href = 'tel:000'}
            className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-lg"
          >
            Emergency
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-72 min-h-screen">
        <div className="p-6 lg:p-8 pt-20 lg:pt-8 pb-24 lg:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
