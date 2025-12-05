import { DollarSign } from 'lucide-react';
import { AuthForm } from '@/components/auth';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-orbitron text-3xl font-bold tracking-wider text-white mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-white/50">Sign in to your account</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
          <AuthForm mode="login" />
        </div>

        <p className="mt-6 text-center text-sm text-white/40 flex items-center justify-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span>See Opportunities - Make Money</span>
        </p>
      </div>
    </div>
  );
}
