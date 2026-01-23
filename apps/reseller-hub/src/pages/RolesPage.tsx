import { Store, Bot, Users, Layers, CheckCircle } from 'lucide-react';

export default function RolesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Key Roles in the Ecosystem</h1>
        <p className="text-slate-500">
          Understanding the division of responsibilities between resellers, consultants, and the platform
        </p>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reseller Role */}
        <div className="card bg-gradient-to-br from-green-50 to-white border-green-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Reseller</h2>
              <p className="text-sm text-slate-500">Authorized Business Partner</p>
            </div>
          </div>
          <p className="text-slate-600 mb-4">
            Authorized business partners who purchase devices wholesale, manage inventory,
            and provide installation services to end customers. They are the first point of
            contact for hardware-related support and serve as the bridge between the platform
            and households.
          </p>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-green-700">Primary Functions:</h3>
            <ul className="space-y-2">
              {[
                'Device procurement & inventory management',
                'Professional Hub & device installation',
                'Warranty registration & claim processing',
                'Technical support & troubleshooting',
                'AI-powered operations via deployed agents',
                'Customer relationship management',
                'Installation scheduling & coordination',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-slate-600 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Consultant Role */}
        <div className="card bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Consultant</h2>
              <p className="text-sm text-slate-500">Personal Advisor (Human or AI)</p>
            </div>
          </div>
          <p className="text-slate-600 mb-4">
            Personal advisors (human or AI) assigned to understand household needs and guide
            them through the smart home journey. They focus on recommendations and planning
            rather than hardware operations, ensuring each customer gets a tailored solution.
          </p>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-purple-700">Primary Functions:</h3>
            <ul className="space-y-2">
              {[
                'Needs assessment & budget planning',
                'Personalized device recommendations',
                'Onboarding guidance & education',
                'Coordination between household & reseller',
                'Long-term smart home roadmap planning',
                'Follow-up consultations & check-ins',
                'Smart home optimization suggestions',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-slate-600 text-sm">
                  <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Division of Labour */}
      <div className="card">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Division of Labour</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Responsibility</th>
                <th className="text-center py-3 px-4 font-semibold text-green-600">
                  <div className="flex items-center justify-center gap-2">
                    <Store className="w-4 h-4" />
                    Reseller
                  </div>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-purple-600">
                  <div className="flex items-center justify-center gap-2">
                    <Bot className="w-4 h-4" />
                    Consultant
                  </div>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-slate-600">
                  <div className="flex items-center justify-center gap-2">
                    <Layers className="w-4 h-4" />
                    Platform
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { task: 'Device Sales & Procurement', reseller: true, consultant: false, platform: false },
                { task: 'Hub Installation', reseller: true, consultant: false, platform: false },
                { task: 'Inventory Management', reseller: true, consultant: false, platform: true },
                { task: 'Needs Assessment', reseller: false, consultant: true, platform: false },
                { task: 'Device Recommendations', reseller: false, consultant: true, platform: true },
                { task: 'Budget Planning', reseller: false, consultant: true, platform: false },
                { task: 'Warranty Claims', reseller: true, consultant: false, platform: true },
                { task: 'Technical Support', reseller: true, consultant: false, platform: true },
                { task: 'Customer Onboarding', reseller: false, consultant: true, platform: true },
                { task: 'Device Control', reseller: false, consultant: false, platform: true },
                { task: 'Automation Processing', reseller: false, consultant: false, platform: true },
                { task: 'Data Storage & Sync', reseller: false, consultant: false, platform: true },
                { task: 'AI Agent Deployment', reseller: true, consultant: false, platform: true },
                { task: 'Analytics & Reporting', reseller: true, consultant: true, platform: true },
              ].map((row) => (
                <tr key={row.task} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-700">{row.task}</td>
                  <td className="py-3 px-4 text-center">
                    {row.reseller && <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.consultant && <CheckCircle className="w-5 h-5 text-purple-500 mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.platform && <CheckCircle className="w-5 h-5 text-slate-500 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workflow */}
      <div className="card">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Typical Customer Journey</h2>

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>

          <div className="space-y-6">
            {[
              {
                step: 1,
                title: 'Customer Shows Interest',
                description: 'Customer discovers the platform through marketing or referral',
                role: 'Platform',
                color: 'slate',
              },
              {
                step: 2,
                title: 'Consultant Assignment',
                description: 'A consultant (human or AI) is assigned to understand the customer\'s needs',
                role: 'Consultant',
                color: 'purple',
              },
              {
                step: 3,
                title: 'Needs Assessment & Planning',
                description: 'Consultant conducts assessment of budget, preferences, and home requirements',
                role: 'Consultant',
                color: 'purple',
              },
              {
                step: 4,
                title: 'Device Recommendations',
                description: 'Tailored recommendations provided based on assessment results',
                role: 'Consultant',
                color: 'purple',
              },
              {
                step: 5,
                title: 'Order & Procurement',
                description: 'Reseller processes the order and prepares devices for installation',
                role: 'Reseller',
                color: 'green',
              },
              {
                step: 6,
                title: 'Professional Installation',
                description: 'Reseller installs Hub and devices at customer location',
                role: 'Reseller',
                color: 'green',
              },
              {
                step: 7,
                title: 'System Activation',
                description: 'Platform activates devices and syncs with customer dashboard',
                role: 'Platform',
                color: 'slate',
              },
              {
                step: 8,
                title: 'Ongoing Support',
                description: 'Reseller handles hardware issues, consultant handles optimization',
                role: 'All',
                color: 'blue',
              },
            ].map((item) => (
              <div key={item.step} className="relative flex items-start gap-4 pl-4">
                <div className={`relative z-10 w-8 h-8 rounded-full bg-${item.color}-500 flex items-center justify-center text-white text-sm font-bold`}>
                  {item.step}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${item.color}-100 text-${item.color}-700`}>
                      {item.role}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Household Role */}
      <div className="card bg-gradient-to-br from-blue-50 to-white border-blue-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Household (End Customer)</h2>
            <p className="text-sm text-slate-500">Smart Home Owner</p>
          </div>
        </div>
        <p className="text-slate-600 mb-4">
          The end customer who owns and controls their smart home. After installation, they use
          the Household Dashboard to manage devices, create automations, and monitor their home.
          They interact with consultants for planning and resellers for hardware support.
        </p>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-blue-700">What Households Can Do:</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'Control all connected devices',
              'Create automation rules',
              'View real-time device status',
              'Manage rooms and zones',
              'Request consultant support',
              'Contact reseller for hardware issues',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-slate-600 text-sm">
                <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
