import React from 'react';
import Link from 'next/link';
import { Star, QrCode, Sliders, ArrowRight, ShieldCheck, Languages, Smartphone, BarChart, CheckCircle2, FileText, MessageSquare } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      
      {/* --- TOP BRAND HEADER --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Star className="w-4 h-4 fill-current text-blue-600" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">ReviewBee</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 transition"
            >
              Register Business
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-20 pb-20 relative flex flex-col items-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 rounded-full text-xs font-semibold text-blue-700 px-3.5 py-1.5 mb-6">
          <Star className="w-3.5 h-3.5 fill-current text-blue-600" />
          <span>Google Review & Customer Feedback Management</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.15] text-slate-900 max-w-2xl">
          Collect more 5-star Google reviews from happy customers.
        </h1>
        <p className="text-slate-600 text-base md:text-lg mt-6 max-w-xl leading-relaxed">
          Simplify customer feedback. Diners and visitors scan a QR stand, answer a few quick questions, get an instant review draft, and post directly to your verified Google profile.
        </p>

        <div className="flex flex-col sm:flex-row gap-3.5 mt-8 w-full max-w-md justify-center">
          <Link
            href="/login"
            className="px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition cursor-pointer text-sm"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link
            href="/login"
            className="px-6 py-3.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl shadow-sm hover:bg-slate-100 transition cursor-pointer text-sm"
          >
            Open Business Console
          </Link>
        </div>

        {/* Dynamic stars feedback bar */}
        <div className="flex items-center gap-3 mt-10 text-xs font-medium text-slate-500">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 text-amber-400 fill-current" />
            ))}
          </div>
          <span>Supported in English, Malayalam, Hindi, and Arabic</span>
        </div>
      </section>

      {/* --- HOW IT WORKS GRID --- */}
      <section className="bg-white border-y border-slate-200 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">How It Works</h2>
            <p className="text-slate-500 text-xs mt-1.5">A simple, 3-step feedback flow designed for quick mobile completion.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Scan QR Stand',
                desc: 'Place custom ReviewBee QR displays on tables or billing counters. Customers scan with their smartphone camera to begin.',
                icon: QrCode,
              },
              {
                step: '02',
                title: 'Answer Quick Survey',
                desc: 'Customers rate star satisfaction and select 3-4 quick choices in their language of choice. No sign-up required for the customer.',
                icon: Sliders,
              },
              {
                step: '03',
                title: 'Instant Draft & Post',
                desc: 'ReviewBee organizes their feedback into a clear, natural review text. One tap copies the draft and opens your Google Reviews page.',
                icon: FileText,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-slate-400">{item.step}</span>
                      <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mt-4">{item.title}</h3>
                    <p className="text-slate-600 text-xs mt-2 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- BUSINESS BENEFITS / FEATURES --- */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Everything You Need To Grow Local Reviews</h2>
          <p className="text-slate-500 text-xs mt-1.5">Professional tools to simplify customer feedback collection across all your locations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { title: 'Multi-Branch Management', desc: 'Manage multiple physical locations, each with its own Google Place code, custom review links, and branch statistics.', icon: Smartphone },
            { title: 'Multi-Lingual Surveys', desc: 'Support feedback forms in English, Malayalam, Hindi, and Arabic natively so every customer feels comfortable.', icon: Languages },
            { title: 'Custom Question Builder', desc: 'Create and customize survey questions with ratings, single-choice, multiple-choice, and text options.', icon: Sliders },
            { title: 'Printable QR Stand Designer', desc: 'Generate high-resolution printable table stands and counter cards styled with your brand colors.', icon: QrCode },
            { title: 'Scan & Visit Analytics', desc: 'Track daily QR scans, Google review page visits, customer languages, and device breakdown with clear visual charts.', icon: BarChart },
            { title: 'Direct Google Integration', desc: 'One-click redirection leads customers straight to your Google Maps review dialog to paste their rating.', icon: ShieldCheck },
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3.5">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 border border-blue-100">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{feat.title}</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white text-slate-600 py-10 px-6 border-t border-slate-200">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-current text-blue-600" />
            <span className="font-bold text-slate-900 text-base tracking-tight">ReviewBee</span>
          </div>
          <p className="text-xs text-slate-500">© 2026 ReviewBee. All rights reserved. Customer review and reputation management platform.</p>
        </div>
      </footer>

    </div>
  );
}
