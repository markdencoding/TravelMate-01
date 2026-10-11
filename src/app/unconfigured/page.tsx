import Link from 'next/link';

export default function UnconfiguredPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const isDev = process.env.NODE_ENV === 'development';
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let technicalDetail = 'Unknown configuration issue.';
  if (!hasUrl && !hasKey) {
    technicalDetail = 'Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.';
  } else if (!hasUrl) {
    technicalDetail = 'Missing NEXT_PUBLIC_SUPABASE_URL in environment variables.';
  } else if (!hasKey) {
    technicalDetail = 'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.';
  } else {
    technicalDetail = 'Database connection could not be established or service is unreachable.';
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface text-on-surface">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400 mx-auto flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-[28px]">cloud_off</span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined text-[14px]">explore</span>
          </div>
          <span className="font-extrabold text-sm tracking-tight font-display text-on-surface">
            TRAVELMATE
          </span>
        </div>

        <h1 className="text-xl font-bold font-display text-on-surface mt-2 mb-2">
          Service Unavailable
        </h1>

        <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
          The application requires a live Supabase connection to access your trip architecture. Please ensure your environment is configured.
        </p>

        {isDev && (
          <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-[11px] font-mono text-slate-600 dark:text-slate-300">
            <div className="font-bold text-rose-500 mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">terminal</span>
              Development Diagnostic
            </div>
            <div className="break-all">{technicalDetail}</div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Retry Connection</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
