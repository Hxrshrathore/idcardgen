'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { authenticatePartner } from './actions';

export default function PartnerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await authenticatePartner(email, password);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        if (res.isNew) {
          setMessage('First Partner created! Auto-redirecting...');
        } else {
          setMessage('Access Authorized! Redirecting to Dashboard...');
        }
        setTimeout(() => {
          router.push('/partner/dashboard');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#030303] p-4 font-sans select-none relative overflow-hidden text-white">
      {/* Background Radial Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px] -z-10" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-zinc-800/10 blur-[120px] top-1/4 left-1/4 -z-20 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-zinc-700/5 blur-[120px] bottom-1/4 right-1/4 -z-20 pointer-events-none" />

      {/* Login Card */}
      <div className="max-w-md w-full bg-zinc-950/40 border border-zinc-900 rounded-3xl p-8 md:p-10 flex flex-col gap-6 shadow-2xl backdrop-blur-2xl glass-panel relative animate-[fadeIn_300ms_ease-out]">
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-zinc-700" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-zinc-700" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-zinc-700" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-zinc-700" />

        {/* Title block */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mb-2 shadow-[0_0_15px_rgba(255,255,255,0.03)]">
            <Shield className="w-5 h-5 text-zinc-400" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-widest text-white leading-none">
            ID Card <span className="text-zinc-500 font-light">Partner Portal</span>
          </h1>
          <p className="text-[8.5px] text-zinc-500 uppercase tracking-widest leading-relaxed mt-1">
            Authenticating regional print partners & school managers
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest px-0.5">Partner Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-650" />
              <input
                type="email"
                placeholder="PARTNER@ACADEMIA.EDU"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-900 focus:border-white rounded-xl py-3 pl-11 pr-4 text-xs font-mono text-zinc-200 placeholder:text-zinc-800 focus:outline-none transition-all duration-200 hover:border-zinc-800"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest px-0.5">Access Key</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-650" />
              <input
                type="password"
                placeholder="••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-900 focus:border-white rounded-xl py-3 pl-11 pr-4 text-xs font-mono text-zinc-200 placeholder:text-zinc-850 focus:outline-none transition-all duration-200 hover:border-zinc-800"
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-900/60 rounded-xl text-red-400 text-[8.5px] uppercase tracking-widest font-black text-center animate-shake leading-normal font-mono">
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-900/60 rounded-xl text-emerald-400 text-[8.5px] uppercase tracking-widest font-black text-center animate-pulse leading-normal font-mono">
              ✓ {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 mt-2 bg-white text-black hover:bg-zinc-150 font-black text-[9px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.96] shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] disabled:opacity-50 font-sans"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 text-black animate-spin" />
                <span>Securing Node connection...</span>
              </>
            ) : (
              <>
                <span>Request Core Access</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Notice on first-run */}
        <div className="border-t border-zinc-900/60 pt-4 flex flex-col gap-1 items-center text-center">
          <span className="text-[7.5px] text-zinc-650 font-bold uppercase tracking-widest">
            💡 Zero-Config Seeding active
          </span>
          <span className="text-[7.5px] text-zinc-550 leading-relaxed uppercase max-w-xs">
            If no accounts exist, your entered details will be hashed and registered as the primary partner.
          </span>
        </div>
      </div>
    </main>
  );
}
