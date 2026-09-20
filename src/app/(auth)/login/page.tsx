import { LoginForm } from "@/features/auth/components/LoginForm";
import { ThemeToggle } from "@/core/theme/ThemeProvider";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors">
      {/* Top Right Utilities */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Background Graphic Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Login Form Container */}
      <div className="relative z-10 w-full flex items-center justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
