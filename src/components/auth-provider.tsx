"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppUser, Appointment } from '@/types';
import { useFirebase } from '@/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, query, collection, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import useSound from '@/hooks/use-sound';
import SplashScreen from './layout/splash-screen';
import { useTranslation } from '@/context/language-provider';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const playSound = useSound();
  const { t } = useTranslation();

  // --- Effect to handle authentication state and user profile listening ---
  useEffect(() => {
    let userDocUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }

      if (firebaseUser) {
        setLoading(true);
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);

        userDocUnsubscribe = onSnapshot(userDocRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              if (userData.enabled === false) {
                 firebaseSignOut(auth);
                 setUser(null);
                 toast({
                    variant: 'destructive',
                    title: t('account_disabled_title'),
                    description: t('account_disabled_desc'),
                 });
              } else {
                setUser({ uid: firebaseUser.uid, ...userData } as AppUser);
              }
            } else {
              // Fallback for new users or if doc doesn't exist yet
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                role: 'client'
              });
            }
            setLoading(false);
          }, 
          (error) => {
            console.error("AuthProvider: Error listening to user document:", error);
            setUser(null);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }
    };
  }, [auth, firestore, toast, t]);

  // --- Effect for client appointment notifications ---
  useEffect(() => {
    if (user && user.role === 'client' && firestore) {
      const q = query(collection(firestore, 'appointments'), where('clientId', '==', user.uid));
      let isInitialData = true;

      const appointmentsListener = onSnapshot(q, (snapshot) => {
        if (isInitialData) {
          isInitialData = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const appointment = change.doc.data() as Appointment;
            let title = '';
            let description = '';

            if (appointment.status === 'confirmed') {
              title = t('appointment_confirmed_title');
              description = t('appointment_confirmed_desc', { date: appointment.date, time: appointment.time });
            } else if (appointment.status === 'cancelled') {
              title = t('appointment_cancelled_title');
              description = t('appointment_cancelled_desc', { date: appointment.date, time: appointment.time });
            }

            if (title) {
              toast({ title, description });
              playSound('notification');
            }
          }
        });
      });

      return () => appointmentsListener();
    }
  }, [user, firestore, toast, playSound, t]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
