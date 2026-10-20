import React from 'react';
import Link from 'next/link';
import { Star, Sparkles, QrCode, Sliders, ArrowRight, ShieldCheck, Languages, Smartphone, BarChart } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      
      {/* --- TOP BRAND HEADER --- */}
      <header className="max-w-6xl w-full mx-auto px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Star className="w-6 h-6 fill-current text-blue-600" />
          <span className="font-black text-xl tracking-tight">ReviewBee</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-bold text-slate-600 hover:text-slate-950 transition"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-blue-700 transition"
          >
            Register Business
          </Link>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20 relative flex flex-col items-center">
        {/* Background blobs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-100 rounded-full opacity-30 blur-3xl pointer-events-none -z-10" />

        <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200/50 rounded-full text-xs font-bold text-blue-600 px-3.5 py-1 mb-6">
          <Sparkles className="w-3.5 h-3.5 fill-current" /> AI-Powered Google Reviews Generator
        </span>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-slate-900 max-w-2xl">
          Collect more 5-Star Google reviews using AI.
        </h1>
        <p className="text-slate-500 text-base md:text-lg mt-6 max-w-xl leading-relaxed">
          Simplify the review process. Customers scan a QR code, answer 4 quick questions, get an AI-drafted review, and are directed to paste it on your Google review page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-md justify-center">
          <Link
            href="/r/madefit/main"
            className="px-6 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-black transition cursor-pointer text-sm"
          >
            <span>Try Live Customer Flow</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link
            href="/login"
            className="px-6 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50/50 transition cursor-pointer text-sm"
          >
            Open Owner Console
          </Link>
        </div>

        {/* Dynamic stars feedback bar */}
        <div className="flex items-center gap-3 mt-10 text-xs font-bold text-slate-400">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 text-amber-400 fill-current" />
            ))}
          </div>
          <span>Drafted in English, Malayalam, Hindi, and Arabic</span>
        </div>
      </section>

      {/* --- HOW IT WORKS GRID --- */}
      <section className="bg-white border-y border-slate-200/80 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Simple 3-Step Assist Flow</h2>
            <p className="text-slate-400 text-xs mt-1">ReviewBee handles the drafting, leaving customers to post voluntarily.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Scan QR Code',
                desc: 'Place custom ReviewBee QR posters on tables, counters, or walls. Customers scan to open the mobile-optimized questionnaire instantly.',
                icon: QrCode,
                color: 'bg-blue-50 text-blue-600',
              },
              {
                step: '02',
                title: 'Answer Guided Survey',
                desc: 'Customers rate stars and select quick choices in their language of choice. No login or signup is required for the customer.',
                icon: Sliders,
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                step: '03',
                title: 'AI Draft & Paste',
                desc: 'ReviewBee AI generates a natural review. Tapping continue automatically copies the draft text and redirects the user to Google Maps reviews.',
                icon: Sparkles,
                color: 'bg-amber-50 text-amber-600',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-slate-300">{item.step}</span>
                      <div className={`p-2 rounded-xl ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-base mt-4">{item.title}</h3>
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- BUSINESS BENEFITS / FEATURES --- */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">Everything You Need To Grow</h2>
          <p className="text-slate-400 text-xs mt-1">Built to help local businesses build authentic search authority.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Multi-Tenant Setup', desc: 'Manage multiple businesses, settings, billing tiers, and team profiles from a single master dashboard console.', icon: ShieldCheck },
            { title: 'Branch Management', desc: 'Add multiple physical branches, each with its own place code, scan links, custom primary colors, and settings.', icon: Smartphone },
            { title: 'Multi-Lingual Assist', desc: 'Support survey questions and AI generation in English, Malayalam, Hindi, and Arabic natively.', icon: Languages },
            { title: 'Question Builder', desc: 'Create and reorder questionnaires using ratings, options, checkbox grids, text entries, and preset industry templates.', icon: Sliders },
            { title: 'Interactive Analytics', desc: 'Track QR scan conversion percentages, daily ratings, device types, and language metrics with Recharts area graphs.', icon: BarChart },
            { title: 'QR Poster Customizer', desc: 'Generate A4/A5 printable counter stands, reception desk cards, and wall posters in real-time matching your logo colors.', icon: QrCode },
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm flex items-start gap-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">{feat.title}</h4>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- FOOTER BRANDS --- */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-current text-blue-500" />
            <span className="font-extrabold text-white text-base tracking-tight">ReviewBee</span>
          </div>
          <p className="text-xs text-slate-500">© 2026 ReviewBee. All Rights Reserved. Draft reviews assisting SaaS application.</p>
        </div>
      </footer>

    </div>
  );
}
