"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from '@/context/language-provider';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);

      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().enabled === false) {
          await firebaseSignOut(auth);
          toast({
              variant: 'destructive',
              title: t('account_disabled_title'),
              description: t('account_disabled_desc'),
          });
      } else {
          toast({
            title: t('login_success_title'),
            description: t('login_success_desc'),
          });
          router.push('/');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('login_fail_title'),
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('email_label')}</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="name@example.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('password_label')}</FormLabel>
                <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('signing_in_button')}</> : t('signin_button')}
            </Button>
        </form>
        </Form>
        <div className="mt-4 text-center text-sm">
        {t('dont_have_account')}{' '}
        <Link href="/register" className="underline text-primary">
            {t('signup_link')}
        </Link>
        </div>
    </div>
  );
}
