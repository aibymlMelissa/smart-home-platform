import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Home,
  Users,
  Store,
  Cpu,
  Shield,
  Zap,
  ChevronRight,
  CheckCircle,
  ArrowRight,
  Bot,
  Settings,
  DollarSign,
  Lock,
  Wifi,
  MessageSquare,
  Package,
  UserCheck,
  Building2,
  Layers,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { apiService } from '../services/api';

export default function GuestLandingPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const handleExploreDashboard = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.guestLogin();
      if (response.success) {
        const { user, tokens } = response.data;
        login(user, tokens.accessToken, tokens.refreshToken);
        navigate('/');
      }
    } catch (error) {
      console.error('Guest login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const journeySteps = [
    {
      title: 'Show Interest',
      description: 'Express your interest in smart home automation through our platform or authorized reseller',
      icon: MessageSquare,
      color: 'bg-blue-500',
    },
    {
      title: 'Personal Consultation',
      description: 'A dedicated consultant (human or AI) is assigned to understand your home and needs',
      icon: UserCheck,
      color: 'bg-purple-500',
    },
    {
      title: 'Tailored Recommendation',
      description: 'Receive personalized device recommendations based on your budget, brand preferences, and security requirements',
      icon: Package,
      color: 'bg-amber-500',
    },
    {
      title: 'Professional Installation',
      description: 'Our authorized reseller installs your Hub and devices, ensuring seamless integration',
      icon: Settings,
      color: 'bg-green-500',
    },
    {
      title: 'Enjoy Your Smart Home',
      description: 'Control all your devices from one dashboard, create automations, and enjoy peace of mind',
      icon: Home,
      color: 'bg-primary-500',
    },
  ];

  const entities = [
    {
      name: 'You (Household)',
      description: 'Control your smart home devices, create automations, and monitor your home from anywhere',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Reseller (First Installer)',
      description: 'Authorized partners who purchase, install, and provide ongoing support for your smart home system',
      icon: Store,
      color: 'from-green-500 to-green-600',
    },
    {
      name: 'Consultant',
      description: 'Personal advisor (human or AI) who helps you choose the right devices based on your needs and budget',
      icon: Bot,
      color: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Hub',
      description: 'The central device in your home that connects all smart devices and communicates with the platform',
      icon: Cpu,
      color: 'from-amber-500 to-amber-600',
    },
    {
      name: 'Platform',
      description: 'Our cloud service that orchestrates device control, stores your data, and powers automations',
      icon: Layers,
      color: 'from-slate-500 to-slate-600',
    },
  ];

  const consultationTopics = [
    {
      title: 'Budget Planning',
      description: 'Define your investment range for smart home devices and installation',
      icon: DollarSign,
      items: ['Entry-level packages', 'Mid-range solutions', 'Premium setups'],
    },
    {
      title: 'Brand Preferences',
      description: 'Choose from trusted smart home device manufacturers',
      icon: Building2,
      items: ['Multi-brand compatibility', 'Ecosystem consistency', 'Quality assurance'],
    },
    {
      title: 'Security Level',
      description: 'Determine the right security measures for your household',
      icon: Shield,
      items: ['Basic monitoring', 'Advanced intrusion detection', 'Full security suite'],
    },
    {
      title: 'Home Assessment',
      description: 'Evaluate your home layout and existing infrastructure',
      icon: Home,
      items: ['Room-by-room analysis', 'Wiring assessment', 'Network requirements'],
    },
  ];

  const features = [
    {
      title: 'Centralized Control',
      description: 'Manage all your devices from a single dashboard',
      icon: Activity,
    },
    {
      title: 'Smart Automations',
      description: 'Create rules that make your home respond to your lifestyle',
      icon: Zap,
    },
    {
      title: 'Secure Connection',
      description: 'Enterprise-grade security protects your home data',
      icon: Lock,
    },
    {
      title: 'Multi-Protocol Support',
      description: 'Works with Wi-Fi, Zigbee, Z-Wave, and Bluetooth devices',
      icon: Wifi,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/50 to-slate-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDI4M2EiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />

        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Smart Home Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-full text-primary-300 text-sm mb-6">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
            Welcome to the Future of Home Automation
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your Smart Home Journey
            <br />
            <span className="text-primary-400">Starts Here</span>
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            Discover how our platform connects you with authorized resellers, personal consultants,
            and cutting-edge technology to transform your house into an intelligent home.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleExploreDashboard}
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Explore Dashboard'}
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/20"
            >
              Learn How It Works
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Features Overview */}
      <section className="py-16 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-primary-500/50 transition-colors"
              >
                <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Journey Steps */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Your Journey to a Smart Home
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From initial interest to full automation, we guide you every step of the way
            </p>
          </div>

          <div className="relative">
            {/* Progress Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-slate-700 -translate-y-1/2" />
            <div
              className="hidden lg:block absolute top-1/2 left-0 h-1 bg-primary-500 -translate-y-1/2 transition-all duration-500"
              style={{ width: `${(activeStep / (journeySteps.length - 1)) * 100}%` }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {journeySteps.map((step, index) => (
                <div
                  key={step.title}
                  className={`relative cursor-pointer group`}
                  onMouseEnter={() => setActiveStep(index)}
                >
                  <div className={`
                    p-6 rounded-xl border transition-all duration-300
                    ${activeStep === index
                      ? 'bg-slate-800 border-primary-500 scale-105'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}
                  `}>
                    <div className={`
                      w-14 h-14 rounded-xl flex items-center justify-center mb-4 mx-auto
                      ${step.color} transition-transform group-hover:scale-110
                    `}>
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-primary-400 font-medium mb-1">
                        Step {index + 1}
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-400">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Entities */}
      <section className="py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The Smart Home Ecosystem
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Understanding how each entity works together to deliver your smart home experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entities.map((entity) => (
              <div
                key={entity.name}
                className="p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-all group"
              >
                <div className={`
                  w-16 h-16 rounded-xl bg-gradient-to-br ${entity.color}
                  flex items-center justify-center mb-4
                  group-hover:scale-110 transition-transform
                `}>
                  <entity.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{entity.name}</h3>
                <p className="text-gray-400">{entity.description}</p>
              </div>
            ))}
          </div>

          {/* Data Flow Diagram */}
          <div className="mt-16 p-8 bg-slate-800 rounded-2xl border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">
              How Information Flows in Your Smart Home
            </h3>
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 text-center">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-white font-medium">You</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-500 rotate-90 lg:rotate-0" />
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-slate-500/20 rounded-lg flex items-center justify-center">
                  <Layers className="w-6 h-6 text-slate-400" />
                </div>
                <span className="text-white font-medium">Platform</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-500 rotate-90 lg:rotate-0" />
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-white font-medium">Hub</span>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-500 rotate-90 lg:rotate-0" />
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-white font-medium">Devices</span>
              </div>
            </div>
            <p className="text-gray-400 text-center mt-6">
              Commands flow from your app through the platform to your Hub, which controls your devices.
              Device status updates flow back in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Personal Consultation Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Personalized Consultation
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              After you show interest, a dedicated consultant works with you to understand your unique needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {consultationTopics.map((topic) => (
              <div
                key={topic.title}
                className="p-6 bg-slate-800 rounded-xl border border-slate-700"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <topic.icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{topic.title}</h3>
                    <p className="text-gray-400 mb-4">{topic.description}</p>
                    <ul className="space-y-2">
                      {topic.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-gradient-to-r from-primary-600/20 to-purple-600/20 rounded-2xl border border-primary-500/30">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">AI-Powered Consultation</h3>
                  <p className="text-gray-300">
                    Our AI consultants are available 24/7 to help you plan your smart home
                  </p>
                </div>
              </div>
              <button
                onClick={handleExploreDashboard}
                disabled={isLoading}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                Start Your Consultation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Reseller Section */}
      <section className="py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Authorized Resellers:
                <br />
                <span className="text-green-400">Your First Point of Contact</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Our network of authorized resellers ensures professional installation,
                warranty support, and ongoing maintenance for your smart home system.
              </p>
              <ul className="space-y-4">
                {[
                  'Professional device installation and Hub setup',
                  'Warranty registration and claim handling',
                  'Technical support and troubleshooting',
                  'Device upgrades and system expansion',
                  'Regular maintenance and firmware updates',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
                  <Store className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Reseller Benefits</h3>
                  <p className="text-gray-400">Why we work with authorized partners</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Trained Technicians', value: 'Certified installation experts' },
                  { label: 'Inventory Management', value: 'Always in stock devices' },
                  { label: 'Local Support', value: 'Quick response times' },
                  { label: 'Warranty Handling', value: 'Seamless claims process' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-3 border-b border-slate-700 last:border-0">
                    <span className="text-gray-300">{item.label}</span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Home?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Start exploring our platform as a guest, or sign up to begin your personalized smart home journey.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleExploreDashboard}
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Explore as Guest'}
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              to="/signup"
              className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
            >
              Create Account
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="mt-6 text-gray-400">
            Guest access: <code className="bg-white/10 px-2 py-1 rounded text-white">guest@smarthome.service</code> (no password required)
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold">Smart Home Platform</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2026 Smart Home Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
