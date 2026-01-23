import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  Users,
  Shield,
  ChevronRight,
  CheckCircle,
  ArrowRight,
  Phone,
  Bell,
  Eye,
  Home,
  UserCheck,
  HeartHandshake,
  AlertCircle,
  Activity,
  MessageCircle,
  Award,
  Lock,
  Moon,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { apiService } from '../services/api';

export default function GuestLandingPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);

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

  const safetyFeatures = [
    {
      title: 'Fall Detection',
      description: 'Automatic alerts when unusual movement patterns suggest a fall',
      icon: AlertCircle,
      color: 'bg-red-500',
    },
    {
      title: 'Daily Check-ins',
      description: 'Simple "I\'m Okay" button so family knows all is well',
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Emergency Alerts',
      description: 'One-touch emergency button connects to family instantly',
      icon: Bell,
      color: 'bg-orange-500',
    },
    {
      title: 'Activity Patterns',
      description: 'Gentle monitoring notices changes in daily routines',
      icon: Activity,
      color: 'bg-blue-500',
    },
  ];

  const journeySteps = [
    {
      step: 1,
      title: 'Free Consultation',
      description: 'Speak with a care specialist who understands your family\'s unique situation',
      icon: MessageCircle,
    },
    {
      step: 2,
      title: 'Home Assessment',
      description: 'An Occupational Therapist evaluates needs and recommends the right solution',
      icon: Home,
    },
    {
      step: 3,
      title: 'Professional Setup',
      description: 'Our certified team installs everything - no technical knowledge needed',
      icon: UserCheck,
    },
    {
      step: 4,
      title: 'Peace of Mind',
      description: 'Stay connected with your loved one while respecting their independence',
      icon: Heart,
    },
  ];

  const testimonials = [
    {
      quote: "I can finally sleep through the night knowing Mum is safe. The daily check-in gives me peace of mind without being intrusive.",
      author: "Sarah M.",
      role: "Daughter, Caring for mother with early dementia",
      location: "Melbourne",
    },
    {
      quote: "My clients love how simple it is. No complicated apps - just one big button to let family know they're okay.",
      author: "Jennifer L.",
      role: "Occupational Therapist",
      location: "Eastern Melbourne",
    },
    {
      quote: "After Dad's fall last year, we needed something. This system detected when he hadn't moved for too long and alerted us immediately.",
      author: "Michael T.",
      role: "Son, Supporting elderly father",
      location: "Bayside",
    },
  ];

  const forWho = [
    {
      title: 'For Your Loved One',
      subtitle: 'Independence Dashboard',
      description: 'A simple, dignified interface with large buttons. Emergency help is always one touch away, without feeling like surveillance.',
      icon: Heart,
      color: 'from-rose-500 to-rose-600',
      features: ['One-touch emergency alert', 'Simple daily check-in', 'Medication reminders', 'Easy video calls to family'],
    },
    {
      title: 'For Family Members',
      subtitle: 'Family Circle',
      description: 'Stay connected without being intrusive. See activity patterns, receive alerts, and coordinate care with siblings.',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      features: ['Activity timeline (not surveillance)', 'Instant emergency notifications', 'Shared care notes', 'Peace of mind dashboard'],
    },
    {
      title: 'For Care Professionals',
      subtitle: 'Professional Portal',
      description: 'Tools for Occupational Therapists and care coordinators to assess, recommend, and monitor client progress.',
      icon: Award,
      color: 'from-purple-500 to-purple-600',
      features: ['Home assessment tools', 'NDIS-compliant quoting', 'Client progress tracking', 'Care team coordination'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/30 to-slate-900" />

        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center">
              <HeartHandshake className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">SafeHome</span>
              <span className="hidden sm:inline text-sm text-gray-400 ml-2">Independent Living Technology</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <a
              href="#contact"
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors"
            >
              Get Started
            </a>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-300 text-sm mb-6">
                <Heart className="w-4 h-4" />
                Supporting Independent Living in Melbourne
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Independence for them.
                <br />
                <span className="text-rose-400">Peace of mind for you.</span>
              </h1>

              <p className="text-xl text-gray-300 mb-8">
                Help your loved ones live safely at home with gentle monitoring
                that respects their dignity and eases your worry.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#contact"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Talk to a Care Specialist
                </a>
                <button
                  onClick={handleExploreDashboard}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/20 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'See How It Works'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-8 flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  NDIS Registered
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  My Aged Care Approved
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
                <div className="text-center mb-6">
                  <Moon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-white font-medium">Sleep peacefully tonight</p>
                  <p className="text-gray-400 text-sm">knowing they're safe</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-300">Mum pressed "I'm Okay" at 8:42am</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-300">Normal morning activity detected</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                    <Eye className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-300">No alerts - all is well</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* The Problem We Solve */}
      <section className="py-16 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              We understand the worry
            </h2>
            <p className="text-xl text-gray-300">
              Lying awake at 2am wondering if Mum is okay. The guilt of not being there.
              The fear of getting "that call." You're not alone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {safetyFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-rose-500/50 transition-colors"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy First */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-2xl p-8 lg:p-12 border border-slate-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-green-300 text-sm mb-4">
                  <Shield className="w-4 h-4" />
                  Privacy-First Design
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Monitoring, not watching
                </h2>
                <p className="text-gray-300 mb-6">
                  We understand the difference between caring and surveillance.
                  Your loved one maintains their dignity and privacy.
                </p>
                <ul className="space-y-3">
                  {[
                    'No cameras in living spaces',
                    'No audio recording',
                    'Motion sensors detect presence, not actions',
                    'Your loved one controls what family sees',
                    'Data stays in Australia',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-600">
                <h3 className="text-white font-medium mb-4">What family sees:</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <span className="text-gray-300">Morning activity</span>
                    <span className="text-green-400">Normal</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <span className="text-gray-300">Daily check-in</span>
                    <span className="text-green-400">Completed 8:42am</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <span className="text-gray-300">Front door</span>
                    <span className="text-blue-400">Opened 9:15am</span>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-4">
                  Activity patterns, not private moments
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Getting started is simple
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              We handle everything. No technical knowledge required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {journeySteps.map((step, index) => (
              <div key={step.step} className="relative">
                {index < journeySteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-slate-700 -translate-x-1/2" />
                )}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 relative">
                  <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-900 border-2 border-rose-500 rounded-full flex items-center justify-center">
                    <span className="text-rose-400 font-bold text-sm">{step.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 text-center">{step.title}</h3>
                  <p className="text-gray-400 text-center text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Everyone */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Designed for the whole care circle
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Simple for seniors. Reassuring for families. Practical for care professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {forWho.map((item) => (
              <div
                key={item.title}
                className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-rose-400 mb-3">{item.subtitle}</p>
                <p className="text-gray-400 mb-4">{item.description}</p>
                <ul className="space-y-2">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Families like yours
            </h2>
            <p className="text-xl text-gray-400">
              Hear from Melbourne families who've found peace of mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700"
              >
                <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="text-white font-medium">{testimonial.author}</p>
                  <p className="text-sm text-gray-400">{testimonial.role}</p>
                  <p className="text-xs text-gray-500">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NDIS & Funding */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-2xl p-8 lg:p-12 border border-green-500/30">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Funding support available
                </h2>
                <p className="text-gray-300 mb-6">
                  Our solutions may be covered under NDIS Assistive Technology or
                  My Aged Care Home Modification funding. We help you navigate the process.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">NDIS Registered Provider</p>
                      <p className="text-gray-400 text-sm">Assistive Technology category</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">My Aged Care</p>
                      <p className="text-gray-400 text-sm">Home Care Package eligible</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">DVA Accepted</p>
                      <p className="text-gray-400 text-sm">For eligible veterans</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600">
                <h3 className="text-white font-semibold mb-4">Free Funding Assessment</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Not sure if you're eligible? Our care specialists can help determine
                  what funding options may be available for your situation.
                </p>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Check Eligibility
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For OTs */}
      <section className="py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-sm mb-4">
                <Award className="w-4 h-4" />
                For Care Professionals
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Partner with us to help your clients
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Are you an Occupational Therapist or care coordinator?
                We provide tools to assess, recommend, and monitor assistive technology for your clients.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Home assessment checklists and reports',
                  'NDIS-compliant quoting and documentation',
                  'Client progress monitoring dashboard',
                  'Priority installation scheduling',
                  'Ongoing CPD opportunities',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-purple-400 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                Register as Partner
                <ChevronRight className="w-5 h-5" />
              </a>
            </div>
            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-6">Why OTs partner with us</h3>
              <div className="space-y-6">
                {[
                  { stat: '50+', label: 'Clients referred by partner OTs', sublabel: 'in Melbourne area' },
                  { stat: '4.8/5', label: 'Client satisfaction rating', sublabel: 'from family surveys' },
                  { stat: '< 48hrs', label: 'Average installation time', sublabel: 'from assessment' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-purple-400">{item.stat}</div>
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-gray-400 text-sm">{item.sublabel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Heart className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Take the first step today
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            A free, no-obligation conversation with a care specialist who understands
            what you're going through. No sales pressure - just honest guidance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href="tel:1800SAFEHOME"
              className="flex items-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition-colors"
            >
              <Phone className="w-5 h-5" />
              Call 1800 SAFE HOME
            </a>
            <button
              onClick={handleExploreDashboard}
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/20 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Explore the Dashboard'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-400 text-sm">
            Or email us at{' '}
            <a href="mailto:care@safehome.com.au" className="text-rose-400 hover:underline">
              care@safehome.com.au
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-semibold">SafeHome</span>
              </div>
              <p className="text-gray-400 text-sm">
                Independent living technology for Melbourne families.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">For Families</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">NDIS Funding</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">For Professionals</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Partner Program</a></li>
                <li><a href="#" className="hover:text-white transition-colors">OT Resources</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
                <li>
                  <a
                    href="http://localhost:3001/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-flex items-center gap-1"
                    title="Professional access"
                  >
                    <Lock className="w-3 h-3" />
                    Professional Portal
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>1800 SAFE HOME</li>
                <li>care@safehome.com.au</li>
                <li>Melbourne, Victoria</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2026 SafeHome. Supporting independent living in Melbourne.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
