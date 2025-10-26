'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LoginSchema, LoginCredentials } from '@/lib/api';
import Button from '@/components/ui/Button';
import BrandLogo from '@/components/layout/BrandLogo';

type DemoAccount = LoginCredentials & { label: string };

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggingIn, loginError, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);

  const demoAccounts = React.useMemo<DemoAccount[]>(() => ([
    {
      label: 'Admin Account',
      email: 'admin@broodstock.com',
      password: 'Shrimp123!',
    },
    {
      label: 'Manager Account',
      email: 'john@broodstock.com',
      password: 'Shrimp123!',
    },
    {
      label: 'Editor Account',
      email: 'jane@broodstock.com',
      password: 'Shrimp123!',
    },
    {
      label: 'Viewer Account',
      email: 'mike@broodstock.com',
      password: 'Shrimp123!',
    },
  ]), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = useForm<LoginCredentials>({
    resolver: zodResolver(LoginSchema),
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: LoginCredentials) => {
    try {
      await login(data);
      router.push('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError('root', { message: errorMessage });
    }
  };

  const handleDemoAccountSelect = (account: DemoAccount) => {
    setValue('email', account.email, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    setValue('password', account.password, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    clearErrors('root');
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--brand-cream)]">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-12 py-12">
        <div className="max-w-md w-full space-y-10">
          <div className="flex justify-center">
            <BrandLogo href="" size="lg" textClassName="text-[var(--text-primary)]" />
          </div>
          <div className="text-center space-y-2">
            <p className="uppercase text-xs font-semibold tracking-[0.5em] text-[var(--brand-red)]">CP Florida</p>
            <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">Sales Command Center</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Sign in to review performance, manage customers, and guide the gators to new wins.
            </p>
          </div>

          {/* Error Message */}
          {(errors.root || loginError) && (
            <div className="bg-[var(--brand-red)]/10 border border-[var(--brand-red)]/30 text-[var(--brand-red)] rounded-2xl px-4 py-3 text-sm font-medium">
              {errors.root?.message || (loginError instanceof Error ? loginError.message : 'Login failed')}
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-secondary)]">
                Email address
              </label>
              <div className="mt-1">
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="appearance-none block w-full px-4 py-3 border border-[var(--border-subtle)] rounded-xl bg-white/90 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 shadow-sm focus:outline-none focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[var(--brand-blue)]/30"
                  placeholder="you@cpflorida.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-[var(--brand-red)] font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-secondary)]">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="appearance-none block w-full px-4 py-3 pr-12 border border-[var(--border-subtle)] rounded-xl bg-white/90 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 shadow-sm focus:outline-none focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[var(--brand-blue)]/30"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--text-secondary)]/70 hover:text-[var(--brand-blue)]"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-[var(--brand-red)] font-medium">{errors.password.message}</p>
              )}
            </div>

            <div>
              <Button
                type="submit"
                className="w-full drop-shadow-lg"
                loading={isLoggingIn}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-5 bg-white/70 border border-white/60 rounded-2xl shadow-lg backdrop-blur">
            <h3 className="text-sm font-semibold text-[var(--brand-navy)] mb-4 uppercase tracking-[0.4em]">Demo Access</h3>
            <div className="grid gap-2 text-xs text-[var(--text-secondary)]">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleDemoAccountSelect(account)}
                  className="bg-white text-left p-3 rounded-xl border border-[var(--border-subtle)] transition hover:border-[var(--brand-blue)]/60 hover:shadow-md"
                >
                  <p className="text-[var(--brand-blue)] font-semibold uppercase tracking-wide">{account.label}</p>
                  <p className="mt-1">📧 {account.email}</p>
                  <p>🔑 {account.password}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--brand-blue)] mt-4 italic">
              💡 Click a credential to auto-fill the form
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-navy)] via-[var(--brand-blue)] to-[#18224b]" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2), transparent 55%)' }} />
        <div className="relative flex flex-col justify-center h-full px-16 py-24 text-white space-y-10">
          <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl font-extrabold leading-tight">Fueling CP Florida growth with data-driven confidence.</h1>
            <p className="text-base text-white/80">
              Monitor sales velocity, surface customer opportunities, and keep logistics humming — all inside your CP Florida command center.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 text-sm max-w-sm">
            <div className="surface-card surface-card--frosted text-white/90 p-4 border-0">
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">Dashboard</p>
              <h3 className="text-lg font-semibold mt-1">Executive clarity at game speed</h3>
            </div>
            <div className="surface-card surface-card--frosted text-white/90 p-4 border-0">
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">Orders</p>
              <h3 className="text-lg font-semibold mt-1">From broodstock to bay door without friction</h3>
            </div>
            <div className="surface-card surface-card--frosted text-white/90 p-4 border-0">
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">Customers</p>
              <h3 className="text-lg font-semibold mt-1">Map every partner, credential, and opportunity</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
