import {
  Heart,
  Video,
  MessageCircle,
  User,
  PhoneCall,
} from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  avatar: string;
  lastContact: string;
}

export default function FamilyPage() {
  const familyMembers: FamilyMember[] = [
    { id: '1', name: 'Sarah', relationship: 'Daughter', phone: '0412 345 678', avatar: 'S', lastContact: 'Called yesterday' },
    { id: '2', name: 'Michael', relationship: 'Son', phone: '0423 456 789', avatar: 'M', lastContact: 'Video call 2 days ago' },
    { id: '3', name: 'Emma', relationship: 'Granddaughter', phone: '0434 567 890', avatar: 'E', lastContact: 'Last week' },
    { id: '4', name: 'Dr. Smith', relationship: 'Doctor', phone: '03 9876 5432', avatar: 'D', lastContact: 'Appointment next Monday' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Your Family Circle</h1>
        <p className="text-xl text-gray-400">Stay connected with loved ones</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button className="p-6 bg-blue-500 hover:bg-blue-600 rounded-2xl transition-colors">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Video className="w-8 h-8 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Video Call</span>
          </div>
        </button>
        <button className="p-6 bg-green-500 hover:bg-green-600 rounded-2xl transition-colors">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Send Message</span>
          </div>
        </button>
      </div>

      {/* Family Members */}
      <div className="space-y-4">
        {familyMembers.map((member) => (
          <div
            key={member.id}
            className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{member.avatar}</span>
              </div>
              <div className="flex-1">
                <p className="text-xl font-semibold text-white">{member.name}</p>
                <p className="text-base text-rose-400">{member.relationship}</p>
                <p className="text-sm text-gray-400">{member.lastContact}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`tel:${member.phone.replace(/\s/g, '')}`}
                className="flex items-center justify-center gap-3 p-4 bg-green-500 hover:bg-green-600 rounded-xl transition-colors"
              >
                <PhoneCall className="w-6 h-6 text-white" />
                <span className="text-lg font-bold text-white">Call</span>
              </a>
              <button className="flex items-center justify-center gap-3 p-4 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors">
                <Video className="w-6 h-6 text-white" />
                <span className="text-lg font-bold text-white">Video</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Contact */}
      <button className="w-full mt-8 p-6 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 border-dashed transition-colors">
        <div className="flex items-center justify-center gap-3">
          <User className="w-8 h-8 text-gray-400" />
          <span className="text-xl text-gray-400">Add Family Member</span>
        </div>
      </button>

      {/* Info */}
      <div className="mt-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
        <p className="text-gray-400 text-center text-lg">
          Your family receives a notification when you press "I'm Okay" each morning.
          They can also see your home's activity status to know you're safe.
        </p>
      </div>
    </div>
  );
}
