'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface DevicePreset {
  id: string;
  name: string;
  platform: 'ios' | 'android';
  width: number;
  height: number;
}

const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'iphone-15', name: 'iPhone 15 Pro', platform: 'ios', width: 393, height: 852 },
  { id: 'iphone-se', name: 'iPhone SE (375px)', platform: 'ios', width: 375, height: 667 },
  { id: 'pixel-8', name: 'Pixel 8', platform: 'android', width: 412, height: 915 },
];

export const MobileDeviceSimulator: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(DEVICE_PRESETS[0]);
  const [isLandscape, setIsLandscape] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [iframeUrl, setIframeUrl] = useState<string>('');
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [isInsideIframe, setIsInsideIframe] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Prevent recursive simulator mounting inside the iframe preview
  useEffect(() => {
    setIsInsideIframe(typeof window !== 'undefined' && window.self !== window.top);
  }, []);

  // Sync current path into iframe when opened
  useEffect(() => {
    if (isOpen) {
      setIsIframeLoading(true);
      setIframeUrl(pathname || '/');
    }
  }, [isOpen, pathname]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (isInsideIframe) {
    return null;
  }

  const frameWidth = isLandscape ? selectedDevice.height : selectedDevice.width;
  const frameHeight = isLandscape ? selectedDevice.width : selectedDevice.height;

  const quickRoutes = [
    { label: 'Landing Page & Explorer', path: '/' },
    { label: 'Sign In / Sign Up', path: '/login' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Trips', path: '/trips' },
    { label: 'Explore & Map', path: '/explore' },
    { label: 'Expenses', path: '/expenses' },
    { label: 'Calendar', path: '/calendar' },
  ];

  return (
    <>
      {/* Floating Desktop Trigger Pill Button (hidden on mobile) */}
      <aside
        aria-label="Mobile Viewport Simulator Toggle"
        className="fixed bottom-4 left-4 z-40 hidden lg:flex items-center gap-2 bg-slate-900/90 dark:bg-slate-800/90 text-white backdrop-blur-md px-3.5 py-2 rounded-full shadow-xl border border-slate-700/60 text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="material-symbols-outlined text-[17px] text-teal-400">
          phone_iphone
        </span>
        <span className="font-display">Preview Mobile View</span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300">
          {selectedDevice.width}px
        </span>
      </aside>

      {/* Simulator Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-4 overflow-y-auto animate-fade-in">
          {/* Top Floating Control Bar */}
          <div className="w-full max-w-4xl bg-slate-900/95 text-white border border-slate-700/70 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs mb-3">
            {/* Left: Device Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl">
              {DEVICE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedDevice(preset)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                    selectedDevice.id === preset.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {preset.platform === 'ios' ? 'phone_iphone' : 'smartphone'}
                  </span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Middle: Controls (Orientation, Scale, Refresh) */}
            <div className="flex items-center gap-2">
              {/* Orientation */}
              <button
                onClick={() => setIsLandscape(!isLandscape)}
                title="Toggle Portrait / Landscape"
                className={`p-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold ${
                  isLandscape ? 'bg-teal-600/30 text-teal-300 border-teal-500' : 'text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">screen_rotation</span>
                <span className="hidden sm:inline">{isLandscape ? 'Landscape' : 'Portrait'}</span>
              </button>

              {/* Zoom Scale */}
              <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl text-[11px] font-mono text-slate-300">
                <span>Scale:</span>
                <select
                  value={zoomScale}
                  onChange={(e) => setZoomScale(Number(e.target.value))}
                  aria-label="Viewport Scale Zoom"
                  className="bg-transparent text-white font-bold cursor-pointer focus:outline-hidden"
                >
                  <option value={1} className="bg-slate-900">100%</option>
                  <option value={0.85} className="bg-slate-900">85%</option>
                  <option value={0.75} className="bg-slate-900">75%</option>
                  <option value={0.65} className="bg-slate-900">65%</option>
                </select>
              </div>

              {/* Reload Button */}
              <button
                onClick={() => {
                  if (iframeRef.current) {
                    setIsIframeLoading(true);
                    iframeRef.current.src = iframeRef.current.src;
                  }
                }}
                title="Refresh Mobile Frame"
                className="p-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
              </button>
            </div>

            {/* Right: Quick Screen Jump & Close */}
            <div className="flex items-center gap-2">
              <select
                value={iframeUrl}
                onChange={(e) => {
                  setIsIframeLoading(true);
                  setIframeUrl(e.target.value);
                }}
                aria-label="Quick Screen Navigation"
                className="bg-slate-800 text-slate-200 border border-slate-700 text-[11px] px-2.5 py-1.5 rounded-xl font-medium cursor-pointer focus:outline-hidden"
              >
                {quickRoutes.map((r) => (
                  <option key={r.path} value={r.path}>
                    {r.label} ({r.path})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsOpen(false)}
                title="Exit Mobile Preview"
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-600/80 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Device Mockup Shell */}
          <div
            className="flex-1 flex items-center justify-center w-full py-2"
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              className={`relative bg-black rounded-[52px] border-[12px] border-slate-800 dark:border-slate-700 shadow-2xl ring-1 ring-white/10 overflow-hidden transition-all duration-300 flex flex-col ${
                !isLandscape ? 'pt-11' : ''
              }`}
              style={{
                width: `${frameWidth}px`,
                height: `${frameHeight}px`,
                minWidth: `${frameWidth}px`,
                minHeight: `${frameHeight}px`,
              }}
            >
              {/* Dynamic Island / Notch on iOS */}
              {selectedDevice.platform === 'ios' && !isLandscape && (
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-40 flex items-center justify-between px-3 pointer-events-none shadow-md">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800" />
                  <div className="w-3 h-3 rounded-full bg-[#121620] ring-1 ring-slate-800 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-950/80" />
                  </div>
                </div>
              )}

              {/* Android Top Camera Punch Hole */}
              {selectedDevice.platform === 'android' && !isLandscape && (
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black ring-1 ring-slate-800 z-40 pointer-events-none flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-900" />
                </div>
              )}

              {/* Status Bar simulation (Time & Icons) */}
              {!isLandscape && (
                <div className="absolute top-0 inset-x-0 h-10 px-6 flex items-center justify-between text-[11px] font-semibold text-slate-300 z-30 pointer-events-none select-none">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="material-symbols-outlined text-[13px]">signal_cellular_alt</span>
                    <span className="material-symbols-outlined text-[13px]">wifi</span>
                    <span className="material-symbols-outlined text-[14px]">battery_full</span>
                  </div>
                </div>
              )}

              {/* Loading Indicator */}
              {isIframeLoading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface text-on-surface gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                  <span className="text-xs font-mono text-slate-400">Loading Mobile View...</span>
                </div>
              )}

              {/* Live Embedded IFrame */}
              <iframe
                ref={iframeRef}
                src={iframeUrl}
                title="Mobile View Preview"
                onLoad={() => setIsIframeLoading(false)}
                className="flex-1 w-full border-0 bg-surface text-on-surface"
              />

              {/* iOS Home Indicator Bar */}
              {selectedDevice.platform === 'ios' && !isLandscape && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 dark:bg-white/30 rounded-full z-40 pointer-events-none" />
              )}
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="text-[11px] font-mono text-slate-400 py-1 text-center">
            {selectedDevice.name} • {frameWidth} × {frameHeight}px • Touch emulation active • Press ESC to exit
          </div>
        </div>
      )}
    </>
  );
};
