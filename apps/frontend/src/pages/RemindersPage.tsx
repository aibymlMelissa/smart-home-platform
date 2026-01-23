import { useState } from 'react';
import {
  Bell,
  Clock,
  CheckCircle,
  Pill,
  Droplets,
  Calendar,
  Plus,
} from 'lucide-react';

interface Reminder {
  id: string;
  title: string;
  time: string;
  type: 'medication' | 'health' | 'appointment';
  completed: boolean;
  description?: string;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', title: 'Morning medication', time: '8:00 AM', type: 'medication', completed: true, description: 'Blood pressure pills' },
    { id: '2', title: 'Blood pressure check', time: '12:00 PM', type: 'health', completed: false, description: 'Record in health diary' },
    { id: '3', title: 'Afternoon medication', time: '2:00 PM', type: 'medication', completed: false, description: 'Heart medication' },
    { id: '4', title: 'Evening medication', time: '6:00 PM', type: 'medication', completed: false, description: 'Diabetes pills' },
    { id: '5', title: 'Drink water', time: '3:00 PM', type: 'health', completed: false, description: 'Stay hydrated' },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return Pill;
      case 'health':
        return Droplets;
      case 'appointment':
        return Calendar;
      default:
        return Bell;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'medication':
        return 'bg-blue-500';
      case 'health':
        return 'bg-green-500';
      case 'appointment':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const toggleReminder = (id: string) => {
    setReminders(reminders.map(r =>
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
  };

  const completedCount = reminders.filter(r => r.completed).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Today's Reminders</h1>
        <p className="text-xl text-gray-400">
          {completedCount} of {reminders.length} completed
        </p>
      </div>

      {/* Progress */}
      <div className="bg-slate-800 rounded-2xl p-6 mb-8 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg text-white font-medium">Your Progress Today</span>
          <span className="text-2xl font-bold text-rose-400">
            {Math.round((completedCount / reminders.length) * 100)}%
          </span>
        </div>
        <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / reminders.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {reminders.map((reminder) => {
          const Icon = getIcon(reminder.type);
          return (
            <button
              key={reminder.id}
              onClick={() => toggleReminder(reminder.id)}
              className={`w-full p-6 rounded-2xl border transition-all duration-200 text-left ${
                reminder.completed
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  reminder.completed ? 'bg-green-500' : getColor(reminder.type)
                }`}>
                  {reminder.completed ? (
                    <CheckCircle className="w-8 h-8 text-white" />
                  ) : (
                    <Icon className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-xl font-semibold ${
                    reminder.completed ? 'text-green-400 line-through' : 'text-white'
                  }`}>
                    {reminder.title}
                  </p>
                  {reminder.description && (
                    <p className="text-base text-gray-400">{reminder.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span className="text-lg text-gray-400">{reminder.time}</span>
                  </div>
                </div>
                {reminder.completed ? (
                  <span className="text-green-400 font-bold text-lg">Done</span>
                ) : (
                  <span className="text-gray-500 text-lg">Tap to complete</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Add Reminder Button */}
      <button className="w-full mt-8 p-6 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 border-dashed transition-colors">
        <div className="flex items-center justify-center gap-3">
          <Plus className="w-8 h-8 text-gray-400" />
          <span className="text-xl text-gray-400">Add New Reminder</span>
        </div>
      </button>

      {/* Help Text */}
      <p className="text-center text-gray-500 mt-8 text-lg">
        Tap any reminder to mark it as done
      </p>
    </div>
  );
}
