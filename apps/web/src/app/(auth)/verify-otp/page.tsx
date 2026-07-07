'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  otp: z.string().length(6, 'Enter the 6-digit code'),
});

type FormValues = z.infer<typeof schema>;

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: searchParams.get('email') ?? '' },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await api.post('/auth/verify-otp', values);
      toast.success('Email verified successfully!');
      router.push('/');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Invalid or expired code'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    const email = getValues('email');
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { email, type: 'email_verify' });
      toast.success('A new code has been sent to your email.');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>Enter the 6-digit code we sent to your email address.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="otp">Verification code</Label>
            <Input id="otp" inputMode="numeric" maxLength={6} placeholder="123456" {...register('otp')} />
            {errors.otp && <p className="text-sm text-destructive">{errors.otp.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying…' : 'Verify email'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={isResending}
            onClick={handleResend}
          >
            {isResending ? 'Resending…' : 'Resend code'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}
