'use client';

import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Languages, Mic, Globe2, Users, Zap, FileText, ArrowRight, Loader2 } from 'lucide-react';

export default function LandingPage() {
  const { user, isLoading } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm bg-slate-950/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Languages className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TransLang</span>
            </div>
            
            <div className="flex items-center gap-4">
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-white/60 animate-spin" />
              ) : user ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <a
                    href="/api/auth/login"
                    className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                  >
                    Log in
                  </a>
                  <a
                    href="/api/auth/login"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Get Started
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8">
              <Zap className="h-4 w-4" />
              Real-time AI-powered translation
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Break Language Barriers
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                In Real-Time
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Speak naturally and watch your words transform into another language instantly. 
              Perfect for meetings, interviews, and conversations across languages.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/api/auth/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105"
              >
                Start Translating Free
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 border border-white/20 hover:border-white/40 text-white rounded-xl font-semibold text-lg transition-colors"
              >
                Learn More
              </Link>
            </div>
            
            <p className="mt-6 text-sm text-slate-500">
              No credit card required • 60 minutes free every month
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Powerful Features for Seamless Translation
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Built with cutting-edge AI technology for the most natural translation experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 transition-colors"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-400">
              Three simple steps to break the language barrier
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 lg:p-12 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Start Translating?
            </h2>
            <p className="text-lg text-indigo-100 mb-8">
              Join thousands of users breaking language barriers every day.
            </p>
            <a
              href="/api/auth/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-100 text-indigo-600 rounded-xl font-semibold text-lg transition-all hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Languages className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">TransLang</span>
            </div>
            
            <div className="flex gap-6 text-sm text-slate-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href="mailto:support@translang.app" className="hover:text-white transition-colors">Contact</a>
            </div>
            
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} TransLang. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Mic,
    title: 'Real-Time Translation',
    description: 'See translations appear as you speak with sub-500ms latency. No waiting for complete sentences.',
  },
  {
    icon: Users,
    title: 'Speaker Detection',
    description: 'Automatically detects and labels different speakers in multi-person conversations.',
  },
  {
    icon: Globe2,
    title: 'Multi-Language Support',
    description: 'Support for German, Spanish, French, Italian, Portuguese with more languages coming soon.',
  },
  {
    icon: Zap,
    title: 'Voice Activity Detection',
    description: 'Smart silence detection automatically segments your speech for natural sentence breaks.',
  },
  {
    icon: FileText,
    title: 'Export & Share',
    description: 'Export your transcripts as PDF or text. Perfect for meeting notes and documentation.',
  },
  {
    icon: Languages,
    title: 'Dual Display',
    description: 'View both original speech and translations side by side with speaker labels.',
  },
];

const steps = [
  {
    title: 'Sign In',
    description: 'Create a free account in seconds using your email or social login.',
  },
  {
    title: 'Speak',
    description: 'Click start and speak naturally in your source language.',
  },
  {
    title: 'See Translation',
    description: 'Watch real-time translations appear instantly as you speak.',
  },
];
