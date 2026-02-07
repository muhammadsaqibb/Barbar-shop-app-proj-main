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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import type { AppUser, Shop } from '@/types';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/language-provider';

const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  shopName: z.string().optional(),
  referralCode: z.string().optional(),
  // Shop Details (Admin only)
  address: z.string().optional(),
  city: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  logo: z.string().optional(),
  featuredImage: z.string().optional(),
});

import { User, Store, ArrowLeft, MapPin, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/ui/map-picker'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full rounded-md border bg-muted flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
});

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<'client' | 'admin' | null>(null);
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
      shopName: '',
      address: '',
      city: '',
      location: undefined,
      logo: '',
      featuredImage: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (selection === 'admin') {
      if (!values.shopName) {
        form.setError('shopName', { message: 'Shop name is required.' });
        return;
      }
      if (!values.address) {
        form.setError('address', { message: 'Address is required.' });
        return;
      }
      if (!values.city) {
        form.setError('city', { message: 'City is required.' });
        return;
      }
      if (!values.location) {
        toast({ variant: 'destructive', title: 'Location Required', description: 'Please pin your shop location on the map.' });
        return;
      }
    }

    setLoading(true);
    try {
      let referredByUid = null;
      if (values.referralCode) {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('referralCode', '==', values.referralCode.toUpperCase()), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          form.setError('referralCode', { message: 'Invalid referral code.' });
          setLoading(false);
          return;
        }
        referredByUid = querySnapshot.docs[0].data().uid;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: values.name });

      const userDocRef = doc(firestore, 'users', firebaseUser.uid);

      let shopId = undefined;

      if (selection === 'admin') {
        const shopsRef = collection(firestore, 'shops');
        const newShop: Partial<Shop> = {
          name: values.shopName || "My Barber Shop",
          ownerId: firebaseUser.uid,
          plan: 'free',
          customerCount: 0,
          maxCustomers: 100,
          status: 'active',
          createdAt: serverTimestamp(),
          adminPin: "1234",
          featureLocks: {},
          settings: {
            themeColor: "#9575CD"
          },
          address: values.address,
          city: values.city,
          location: values.location,
          logo: values.logo,
          featuredImage: values.featuredImage,
        };
        const shopDoc = await addDoc(shopsRef, newShop);
        shopId = shopDoc.id;
      }

      const newUser: Omit<AppUser, 'id'> = {
        uid: firebaseUser.uid,
        name: values.name,
        email: values.email,
        role: selection || 'client',
        enabled: true,
        shopId: shopId,
        referralCode: generateReferralCode(),
        referredBy: referredByUid,
        rewardBalance: 0,
        welcomeRewardUsed: false,
        referralStats: {
          totalReferrals: 0,
          successfulReferrals: 0,
          totalRewardsEarned: 0
        }
      };
      await setDoc(userDocRef, newUser);

      toast({
        title: t('registration_success_title'),
        description: t('registration_success_desc'),
      });

      if (selection === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      let errorMessage = error.message || 'An unexpected error occurred.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address is invalid.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak.';
      }

      toast({
        variant: 'destructive',
        title: t('registration_fail_title'),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }

  if (!selection) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Client Selection */}
          <div
            className="group relative cursor-pointer rounded-2xl border-2 p-6 flex flex-col items-center text-center gap-4 transition-all duration-300 hover:border-primary hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 bg-card active:scale-[0.98] animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both"
            onClick={() => setSelection('client')}
          >
            <div className="p-5 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 transform group-hover:rotate-6">
              <User className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-xl tracking-tight text-foreground">{t('book_as_customer')}</h3>
              <p className="text-sm text-center text-muted-foreground leading-relaxed px-2">
                {t('book_as_customer_desc')}
              </p>
            </div>
          </div>

          {/* Admin Selection */}
          <div
            className="group relative cursor-pointer rounded-2xl border-2 p-6 flex flex-col items-center text-center gap-4 transition-all duration-300 hover:border-primary hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 bg-card active:scale-[0.98] animate-in fade-in slide-in-from-bottom-8 duration-500 delay-150 fill-mode-both"
            onClick={() => setSelection('admin')}
          >
            <div className="p-5 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 transform group-hover:-rotate-6">
              <Store className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-xl tracking-tight text-foreground">{t('register_your_shop')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed px-2">
                {t('register_your_shop_desc')}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm pt-4 border-t animate-in fade-in duration-1000">
          {t('already_have_account')}{' '}
          <Link href="/login" className="underline text-primary font-bold hover:text-primary/80 transition-colors">
            {t('signin_link')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-in slide-in-from-right duration-300">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSelection(null)}
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Selection
      </Button>

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

          {selection === 'admin' && (
            <FormField
              control={form.control}
              name="shopName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('shop_name_label')}</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="The Gentlemen's Cut" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {selection === 'admin' && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Location Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Lahore" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Shop #12, Phase 5..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MapPicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <h3 className="font-semibold flex items-center gap-2 pt-4 border-t">
                <ImageIcon className="h-4 w-4" /> Shop Images
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload label="Shop Logo" path="shops/logos" value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="featuredImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload label="Featured Image (Cover)" path="shops/covers" value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

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
          <FormField
            control={form.control}
            name="referralCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referral Code (Optional)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="ABC123" {...field} className="uppercase" />
                </FormControl>
                <FormDescription className="text-[10px]">
                  Have a friend's code? Enter it here to get a welcome discount!
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full h-12 text-lg font-bold mt-6" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t('creating_account_button')}</> : t('create_account_button')}
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center text-sm">
        {t('already_have_account')}{' '}
        <Link href="/login" className="underline text-primary font-semibold">
          {t('signin_link')}
        </Link>
      </div>
    </div>
  );
}
