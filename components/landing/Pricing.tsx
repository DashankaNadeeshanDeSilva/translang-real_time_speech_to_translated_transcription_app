'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const tiers = [
  {
    name: 'Free',
    price: '0',
    description: 'Perfect for trying out TransLang',
    features: [
      '60 minutes per month',
      'Real-time translation',
      'Speaker identification',
      'Export to PDF/Text',
      'Save transcripts',
      'Email support',
    ],
    cta: 'Start Free',
    href: '/api/auth/login',
    popular: false,
  },
  {
    name: 'Pro',
    price: '15',
    description: 'For professionals and teams',
    features: [
      '600 minutes per month',
      'Everything in Free',
      'Priority processing',
      'Advanced analytics',
      'Custom vocabulary',
      'Priority support',
    ],
    cta: 'Coming Soon',
    href: '#',
    popular: true,
  },
  {
    name: 'Unlimited',
    price: '49',
    description: 'For power users',
    features: [
      'Unlimited minutes',
      'Everything in Pro',
      'Dedicated support',
      'API access',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Coming Soon',
    href: '#',
    popular: false,
  },
];

export function Pricing() {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Start free, upgrade when you need more
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`relative rounded-3xl p-8 ${
                tier.popular
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl scale-105 border-4 border-purple-400'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
              } transition-all duration-300 hover:shadow-xl`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Tier Name */}
              <h3 className={`text-2xl font-bold mb-2 ${tier.popular ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                {tier.name}
              </h3>

              {/* Price */}
              <div className="mb-4">
                <span className={`text-5xl font-bold ${tier.popular ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                  ${tier.price}
                </span>
                <span className={`text-lg ${tier.popular ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                  /month
                </span>
              </div>

              {/* Description */}
              <p className={`mb-6 ${tier.popular ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                {tier.description}
              </p>

              {/* CTA Button */}
              <Button
                asChild={tier.href !== '#'}
                className={`w-full mb-6 h-12 rounded-xl font-semibold ${
                  tier.popular
                    ? 'bg-white text-purple-600 hover:bg-gray-100'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                }`}
                disabled={tier.href === '#'}
              >
                {tier.href === '#' ? (
                  <span>{tier.cta}</span>
                ) : (
                  <Link href={tier.href}>{tier.cta}</Link>
                )}
              </Button>

              {/* Features List */}
              <ul className="space-y-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${tier.popular ? 'text-white' : 'text-green-500'}`} />
                    <span className={tier.popular ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <p className="text-center mt-12 text-gray-600 dark:text-gray-400">
          All plans include 14-day money-back guarantee. No credit card required for free tier.
        </p>
      </div>
    </section>
  );
}

