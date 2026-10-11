export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 dark:bg-slate-950 p-4">
      {children}
    </div>
  );
}
