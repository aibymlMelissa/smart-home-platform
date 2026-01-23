import {
  HelpCircle,
  Phone,
  MessageCircle,
  Book,
  Settings,
  AlertTriangle,
  ChevronRight,
  HeartHandshake,
} from 'lucide-react';

interface HelpItem {
  id: string;
  title: string;
  description: string;
  icon: typeof HelpCircle;
  action: string;
  color: string;
}

export default function HelpPage() {
  const helpItems: HelpItem[] = [
    {
      id: '1',
      title: 'Call Support',
      description: 'Speak to a friendly care specialist',
      icon: Phone,
      action: 'tel:1800723466',
      color: 'bg-green-500',
    },
    {
      id: '2',
      title: 'Send Message',
      description: 'We\'ll reply within 24 hours',
      icon: MessageCircle,
      action: '#message',
      color: 'bg-blue-500',
    },
    {
      id: '3',
      title: 'How to Use',
      description: 'Simple guides for your SafeHome',
      icon: Book,
      action: '#guides',
      color: 'bg-purple-500',
    },
    {
      id: '4',
      title: 'Settings Help',
      description: 'Adjust your preferences',
      icon: Settings,
      action: '/settings',
      color: 'bg-slate-500',
    },
  ];

  const faqs = [
    {
      question: 'How do I check in?',
      answer: 'Press the green "I\'m Okay" button on your home screen each morning. Your family will be notified that you\'re well.',
    },
    {
      question: 'What happens in an emergency?',
      answer: 'Press the red Emergency button. You\'ll have 10 seconds to cancel if pressed by mistake. After that, help will be notified.',
    },
    {
      question: 'How do I call my family?',
      answer: 'Go to the Family page and tap Call or Video next to the person you want to reach.',
    },
    {
      question: 'Can my family see what I\'m doing?',
      answer: 'No. They can only see that you\'ve checked in and general activity (like if the front door opened). They cannot see video or hear audio.',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">How Can We Help?</h1>
        <p className="text-xl text-gray-400">We're here for you</p>
      </div>

      {/* Emergency Notice */}
      <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">In an emergency?</p>
            <p className="text-base text-red-200">Press the red Emergency button or call 000</p>
          </div>
        </div>
      </div>

      {/* Help Options */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {helpItems.map((item) => (
          <a
            key={item.id}
            href={item.action}
            className="p-6 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 transition-colors"
          >
            <div className={`w-14 h-14 ${item.color} rounded-xl flex items-center justify-center mb-4`}>
              <item.icon className="w-7 h-7 text-white" />
            </div>
            <p className="text-lg font-semibold text-white mb-1">{item.title}</p>
            <p className="text-sm text-gray-400">{item.description}</p>
          </a>
        ))}
      </div>

      {/* FAQs */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Common Questions</h2>
        </div>
        <div className="divide-y divide-slate-700">
          {faqs.map((faq, index) => (
            <details key={index} className="group">
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-700/50 transition-colors">
                <span className="text-lg font-medium text-white pr-4">{faq.question}</span>
                <ChevronRight className="w-6 h-6 text-gray-400 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-6 pb-6">
                <p className="text-base text-gray-300 leading-relaxed">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Contact Card */}
      <div className="mt-8 bg-gradient-to-r from-rose-500/20 to-purple-500/20 rounded-2xl p-6 border border-rose-500/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center">
            <HeartHandshake className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xl font-bold text-white">Need more help?</p>
            <p className="text-base text-gray-300">Our care team is available 7am - 9pm</p>
          </div>
        </div>
        <a
          href="tel:1800723466"
          className="mt-4 w-full flex items-center justify-center gap-3 p-4 bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors"
        >
          <Phone className="w-6 h-6 text-white" />
          <span className="text-xl font-bold text-white">1800 SAFE HOME</span>
        </a>
      </div>
    </div>
  );
}
