'use client';

import { Mic, Users, Globe, Zap, FileText, Shield } from 'lucide-react';

const features = [
  {
    icon: Mic,
    title: 'Real-Time Translation',
    description: 'Speak naturally and see instant translations as you talk. No delays, no interruptions.',
  },
  {
    icon: Users,
    title: 'Speaker Identification',
    description: 'Automatically detects and labels multiple speakers in conversations.',
  },
  {
    icon: Globe,
    title: 'Multiple Languages',
    description: 'Support for German, English, Spanish, French, and more coming soon.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Powered by advanced AI for near-instantaneous translation with high accuracy.',
  },
  {
    icon: FileText,
    title: 'Export & Save',
    description: 'Download transcripts as PDF or text. Save sessions for later reference.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your conversations are encrypted and never stored without permission.',
  },
];

export function Features() {
  return (
    <section className="py-24 bg-white dark:bg-gray-900" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Powerful features designed for seamless communication across languages
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Icon */}
              <div className="mb-4 inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <feature.icon className="h-6 w-6" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect Border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/10 group-hover:to-purple-600/10 transition-all duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

