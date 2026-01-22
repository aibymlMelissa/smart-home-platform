
import { Zap, Plus, Clock, Sunrise, Thermometer } from 'lucide-react';

export default function AutomationsPage() {
  const sampleAutomations = [
    {
      id: '1',
      name: 'Morning Routine',
      description: 'Turn on lights and adjust thermostat at sunrise',
      trigger: 'Sunrise',
      icon: Sunrise,
      active: true,
    },
    {
      id: '2',
      name: 'Night Mode',
      description: 'Turn off all lights at 11 PM',
      trigger: 'Time: 11:00 PM',
      icon: Clock,
      active: true,
    },
    {
      id: '3',
      name: 'Temperature Control',
      description: 'Adjust AC when temperature exceeds 25°C',
      trigger: 'Temperature > 25°C',
      icon: Thermometer,
      active: false,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Automations</h1>
          <p className="text-gray-400">Create smart rules for your home</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Automation
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-primary-600/20 to-purple-600/20 rounded-xl p-6 border border-primary-500/30 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Automate Your Smart Home</h3>
            <p className="text-gray-300 text-sm">
              Create automations to control your devices based on time, device states, or sensor readings.
              Set up routines that run automatically to make your home smarter.
            </p>
          </div>
        </div>
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        {sampleAutomations.map((automation) => (
          <div
            key={automation.id}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  automation.active ? 'bg-primary-500' : 'bg-slate-700'
                }`}>
                  <automation.icon className={`w-6 h-6 ${
                    automation.active ? 'text-white' : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{automation.name}</h3>
                  <p className="text-sm text-gray-400">{automation.description}</p>
                  <p className="text-xs text-primary-400 mt-1">Trigger: {automation.trigger}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automation.active}
                    className="sr-only peer"
                    readOnly
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Notice */}
      <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700 text-center">
        <p className="text-gray-400">
          Full automation builder coming soon. Stay tuned for advanced triggers, conditions, and actions!
        </p>
      </div>
    </div>
  );
}
