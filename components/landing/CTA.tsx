'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-white/10" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
            Ready to Break Language Barriers?
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            Join thousands of users who are already communicating seamlessly across languages
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              asChild
              size="lg"
              className="group h-14 px-8 text-lg rounded-full bg-white text-purple-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Link href="/api/auth/login">
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 text-lg rounded-full border-2 border-white text-white hover:bg-white/10 transition-all duration-300"
              asChild
            >
              <Link href="#features">
                Learn More
              </Link>
            </Button>
          </div>

          <p className="text-white/80 text-sm">
            No credit card required • 60 minutes free • Start in seconds
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </section>
  );
}

