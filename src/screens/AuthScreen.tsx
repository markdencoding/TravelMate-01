import React, { useState } from 'react';
import { useTravelStore } from '../store';

export const AuthScreen: React.FC = () => {
  const { setActiveTab } = useTravelStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('alex.morgan@curator.travel');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('Alex Morgan');
  const [rememberMe, setRememberMe] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('Authenticated successfully. Redirecting to expedition atelier...');
    setTimeout(() => {
      setActiveTab('dashboard');
    }, 600);
  };

  const handleDemoLogin = () => {
    setEmail('alex.morgan@curator.travel');
    setPassword('demo-curator-pass');
    setToastMessage('Signed in as Lead Curator Alex Morgan.');
    setTimeout(() => {
      setActiveTab('dashboard');
    }, 600);
  };

  const handleGuestLogin = () => {
    setToastMessage('Entering as Guest Explorer...');
    setTimeout(() => {
      setActiveTab('dashboard');
    }, 600);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 animate-fade-in">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Visual Column (5 cols) */}
        <div className="md:col-span-5 relative bg-slate-900 p-8 flex flex-col justify-between text-white overflow-hidden min-h-[340px]">
          {/* Background image overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

          {/* Brand header */}
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-outlined text-[18px]">explore</span>
              </div>
              <span className="font-extrabold text-base tracking-tight font-display text-white">
                TRAVELMATE
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-300 uppercase tracking-widest mt-1">
              Curated Trip Architecture
            </p>
          </div>

          {/* Inspirational Quote */}
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-emerald-300 backdrop-blur-xs border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ad-Free Atelier
            </div>
            <p className="text-sm font-medium text-slate-200 leading-relaxed font-serif italic">
              “Plan with intentionality. Every temple visit, winding alley, and budget line item
              orchestrated without noise.”
            </p>
            <div className="text-[11px] font-mono text-slate-400">
              Kyoto Autumn • Expedition TRP-8492
            </div>
          </div>
        </div>

        {/* Right Form Column (7 cols) */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Form Mode Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
              <div className="flex gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`pb-1 transition-all ${
                    mode === 'signin'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`pb-1 transition-all ${
                    mode === 'signup'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <span className="text-[10px] font-mono text-slate-400 uppercase">
                Secure Client Auth
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900 font-display">
                {mode === 'signin' ? 'Welcome back, Curator' : 'Begin Your Expedition Studio'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Access your synced itineraries, expense ledgers, and printable travel dossiers.
              </p>
            </div>

            {/* Quick Demo Autofill Button */}
            <div className="mb-6 p-3 bg-primary/5 rounded-2xl border border-primary/20 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">Demo Curator Credentials</div>
                <div className="text-[11px] text-slate-500">Alex Morgan (Preloaded Kyoto Trip)</div>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-xs transition-transform hover:scale-[1.02]"
              >
                Fast Autofill
              </button>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Hayes"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="curator@domain.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                  />
                  <span className="text-xs text-slate-600 font-medium">Keep me signed in</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 transition-all hover:scale-[1.01]"
              >
                {mode === 'signin' ? 'Sign In to Atelier' : 'Create Curator Account'}
              </button>
            </form>
          </div>

          {/* Guest Access Alternative */}
          <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
            <span className="text-xs text-slate-500">Want to explore right now?</span>
            <button
              type="button"
              onClick={handleGuestLogin}
              className="text-xs font-bold text-slate-700 hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>Continue as Guest</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
