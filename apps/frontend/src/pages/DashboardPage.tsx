import { useEffect, useState } from 'react';
import {
  Phone,
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock,
  DoorOpen,
  Sun,
  ThermometerSun,
  Bell,
  X,
  PhoneCall,
  Video,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface CheckInStatus {
  completed: boolean;
  time: string | null;
}

interface HomeStatus {
  frontDoor: 'open' | 'closed';
  temperature: number;
  lights: number;
  lastMotion: string;
}

interface Reminder {
  id: string;
  title: string;
  time: string;
  completed: boolean;
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkIn, setCheckIn] = useState<CheckInStatus>({ completed: false, time: null });
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [emergencyCountdown, setEmergencyCountdown] = useState<number | null>(null);

  // Mock data - would come from API
  const [homeStatus] = useState<HomeStatus>({
    frontDoor: 'closed',
    temperature: 22,
    lights: 2,
    lastMotion: '5 minutes ago',
  });

  const [reminders] = useState<Reminder[]>([
    { id: '1', title: 'Morning medication', time: '8:00 AM', completed: true },
    { id: '2', title: 'Blood pressure check', time: '12:00 PM', completed: false },
    { id: '3', title: 'Evening medication', time: '6:00 PM', completed: false },
  ]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Emergency countdown
  useEffect(() => {
    if (emergencyCountdown !== null && emergencyCountdown > 0) {
      const timer = setTimeout(() => setEmergencyCountdown(emergencyCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (emergencyCountdown === 0) {
      // Trigger emergency alert
      alert('Emergency services have been notified. Help is on the way.');
      setShowEmergencyModal(false);
      setEmergencyCountdown(null);
    }
  }, [emergencyCountdown]);

  const handleCheckIn = () => {
    const now = new Date();
    setCheckIn({
      completed: true,
      time: now.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }),
    });
  };

  const handleEmergencyPress = () => {
    setShowEmergencyModal(true);
    setEmergencyCountdown(10);
  };

  const cancelEmergency = () => {
    setShowEmergencyModal(false);
    setEmergencyCountdown(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const firstName = user?.firstName || 'there';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Emergency Alert
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              Calling for help in...
            </p>
            <div className="text-6xl font-bold text-red-500 mb-8">
              {emergencyCountdown}
            </div>
            <button
              onClick={cancelEmergency}
              className="w-full py-6 bg-gray-200 hover:bg-gray-300 text-gray-800 text-2xl font-bold rounded-2xl transition-colors"
            >
              Cancel - I'm Okay
            </button>
          </div>
        </div>
      )}

      {/* Call Family Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Call Family</h2>
              <button
                onClick={() => setShowCallModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-8 h-8 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Sarah (Daughter)', phone: '0412 345 678' },
                { name: 'Michael (Son)', phone: '0423 456 789' },
                { name: 'Dr. Smith', phone: '03 9876 5432' },
              ].map((contact) => (
                <a
                  key={contact.name}
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-4 p-6 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-colors"
                >
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                    <PhoneCall className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-semibold text-gray-900">{contact.name}</p>
                    <p className="text-lg text-gray-500">{contact.phone}</p>
                  </div>
                </a>
              ))}
              <button
                className="flex items-center gap-4 p-6 bg-purple-50 hover:bg-purple-100 rounded-2xl transition-colors w-full"
              >
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xl font-semibold text-gray-900">Video Call</p>
                  <p className="text-lg text-gray-500">See family face-to-face</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Time */}
      <div className="text-center mb-8">
        <p className="text-2xl text-gray-400 mb-1">{formatDate(currentTime)}</p>
        <p className="text-5xl font-bold text-white">{formatTime(currentTime)}</p>
        <p className="text-xl text-gray-400 mt-2">Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 18 ? 'afternoon' : 'evening'}, {firstName}</p>
      </div>

      {/* Main Action Buttons - Large Touch Targets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Emergency Button */}
        <button
          onClick={handleEmergencyPress}
          className="bg-red-500 hover:bg-red-600 active:bg-red-700 rounded-3xl p-8 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/30"
        >
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">EMERGENCY</span>
            <span className="text-lg text-red-100 mt-2">Press if you need help</span>
          </div>
        </button>

        {/* I'm Okay Button */}
        <button
          onClick={handleCheckIn}
          disabled={checkIn.completed}
          className={`rounded-3xl p-8 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
            checkIn.completed
              ? 'bg-green-600 shadow-green-500/30'
              : 'bg-green-500 hover:bg-green-600 active:bg-green-700 shadow-green-500/30'
          }`}
        >
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
              {checkIn.completed ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : (
                <Heart className="w-10 h-10 text-white" />
              )}
            </div>
            <span className="text-3xl font-bold text-white">
              {checkIn.completed ? 'CHECKED IN' : "I'M OKAY"}
            </span>
            <span className="text-lg text-green-100 mt-2">
              {checkIn.completed ? `Done at ${checkIn.time}` : 'Let family know you\'re well'}
            </span>
          </div>
        </button>
      </div>

      {/* Call Family Button */}
      <button
        onClick={() => setShowCallModal(true)}
        className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-3xl p-6 mb-8 transition-all duration-200 shadow-lg shadow-blue-500/30"
      >
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">Call Family</span>
        </div>
      </button>

      {/* Home Status - Simple Overview */}
      <div className="bg-slate-800 rounded-3xl p-6 mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Sun className="w-6 h-6 text-amber-400" />
          Your Home
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-700/50 rounded-2xl p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              homeStatus.frontDoor === 'closed' ? 'bg-green-500/20' : 'bg-orange-500/20'
            }`}>
              <DoorOpen className={`w-6 h-6 ${
                homeStatus.frontDoor === 'closed' ? 'text-green-400' : 'text-orange-400'
              }`} />
            </div>
            <div>
              <p className="text-lg font-medium text-white">Front Door</p>
              <p className={`text-base ${
                homeStatus.frontDoor === 'closed' ? 'text-green-400' : 'text-orange-400'
              }`}>
                {homeStatus.frontDoor === 'closed' ? 'Secure' : 'Open'}
              </p>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <ThermometerSun className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-white">Temperature</p>
              <p className="text-base text-blue-400">{homeStatus.temperature}°C</p>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
              <Sun className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-white">Lights On</p>
              <p className="text-base text-amber-400">{homeStatus.lights} lights</p>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-white">Last Activity</p>
              <p className="text-base text-purple-400">{homeStatus.lastMotion}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reminders */}
      <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-6 h-6 text-rose-400" />
          Today's Reminders
        </h2>
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                reminder.completed ? 'bg-green-500/10' : 'bg-slate-700/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                reminder.completed ? 'bg-green-500' : 'bg-slate-600'
              }`}>
                {reminder.completed ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <Clock className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-lg font-medium ${
                  reminder.completed ? 'text-green-400' : 'text-white'
                }`}>
                  {reminder.title}
                </p>
                <p className="text-base text-gray-400">{reminder.time}</p>
              </div>
              {reminder.completed && (
                <span className="text-green-400 font-medium">Done</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-base">
          Your family is notified when you check in each day.
        </p>
        <p className="text-gray-500 text-base">
          If you need help, press the red emergency button.
        </p>
      </div>
    </div>
  );
}
