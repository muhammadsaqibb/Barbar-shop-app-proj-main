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
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import type { AppUser } from '@/types';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/language-provider';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: values.name });
      
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const newUser: Omit<AppUser, 'id'> = {
        uid: firebaseUser.uid,
        name: values.name,
        email: values.email,
        role: 'client',
        enabled: true,
      };
      await setDoc(userDocRef, newUser);

      toast({
        title: t('registration_success_title'),
        description: t('registration_success_desc'),
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('registration_fail_title'),
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
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('name_label')}</FormLabel>
                <FormControl>
                    <Input type="text" placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
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
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('creating_account_button')}</> : t('create_account_button')}
            </Button>
        </form>
        </Form>
        <div className="mt-4 text-center text-sm">
        {t('already_have_account')}{' '}
        <Link href="/login" className="underline text-primary">
            {t('signin_link')}
        </Link>
        </div>
    </div>
  );
}
