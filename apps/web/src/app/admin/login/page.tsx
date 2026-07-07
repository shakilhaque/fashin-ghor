'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT', 'WAREHOUSE'];

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      // Check role after login via API
      const { api } = await import('@/lib/api');
      const { data } = await api.get('/auth/me');
      const user = data.data.user;

      if (!ADMIN_ROLES.includes(user.role)) {
        const { api: apiLogout } = await import('@/lib/api');
        await apiLogout.post('/auth/logout');
        toast.error('Access denied. This login is for staff only.');
        return;
      }

      toast.success(`Welcome back, ${user.name}!`);
      router.replace('/admin');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Luxe<span className="text-primary">Mode</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">Admin Panel — Staff Access Only</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to admin</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label className="text-zinc-300 text-sm">Email address</Label>
              <Input
                {...register('email')}
                type="email"
                placeholder="admin@luxemode.com"
                autoComplete="email"
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label className="text-zinc-300 text-sm">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Customer?{' '}
          <a href="/login" className="text-zinc-400 hover:text-white underline">
            Go to store login
          </a>
        </p>
      </div>
    </div>
  );
}
