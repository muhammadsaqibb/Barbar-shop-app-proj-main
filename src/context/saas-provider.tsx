"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useFirebase } from '@/firebase';
import { doc, onSnapshot, collection, query, where, getDocs, limit, serverTimestamp, addDoc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import type { Shop } from '@/types';

interface SaaSContextType {
    currentShop: Shop | null;
    loading: boolean;
    isLimitReached: (feature: 'customers' | 'bookings') => boolean;
}

const SaaSContext = createContext<SaaSContextType | undefined>(undefined);

export const SaaSProvider = ({ children }: { children: ReactNode }) => {
    const { firestore } = useFirebase();
    const { user } = useAuth();
    const [currentShop, setCurrentShop] = useState<Shop | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !user) {
            setCurrentShop(null);
            setLoading(false);
            return;
        }

        const fetchShop = async () => {
            if (!user.uid) return;

            const initializeShop = async (shopId?: string) => {
                try {
                    console.log("SaaSProvider: Initializing shop...", shopId || "New Shop");
                    const newShopData: Partial<Shop> = {
                        name: "My Barber Shop",
                        ownerId: user.uid,
                        plan: 'free',
                        customerCount: 0,
                        maxCustomers: 100,
                        status: 'active',
                        createdAt: serverTimestamp(),
                        adminPin: "1234", // Default PIN
                        featureLocks: {},
                        settings: {
                            themeColor: "#9575CD"
                        }
                    };

                    let finalShopId = shopId;
                    if (!finalShopId) {
                        const shopsRef = collection(firestore, 'shops');
                        const docRef = await addDoc(shopsRef, newShopData);
                        finalShopId = docRef.id;
                        console.log("SaaSProvider: Created new shop document:", finalShopId);
                    } else {
                        const shopRef = doc(firestore, 'shops', finalShopId);
                        await setDoc(shopRef, newShopData, { merge: true });
                        console.log("SaaSProvider: Recreated/Fixed shop document:", finalShopId);
                    }

                    // Link to user if not already linked or link changed
                    if (user.shopId !== finalShopId) {
                        const userRef = doc(firestore, 'users', user.uid);
                        await updateDoc(userRef, { shopId: finalShopId });
                        console.log("SaaSProvider: Linked shopId to user document");
                    }

                    return finalShopId;
                } catch (err) {
                    console.error("SaaSProvider: Critical error during shop initialization:", err);
                    throw err;
                }
            };

            const setupListener = (id: string) => {
                const shopRef = doc(firestore, 'shops', id);
                return onSnapshot(shopRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setCurrentShop({ ...data, id: docSnap.id } as Shop);
                        setLoading(false);
                    } else {
                        console.warn(`SaaSProvider: Shop ${id} disappeared. Attempting recreation...`);
                        initializeShop(id);
                    }
                }, (err) => {
                    console.error("SaaSProvider: Firestore snapshot error:", err);
                    setLoading(false);
                });
            };

            if (user.role === 'admin') {
                if (user.shopId) {
                    const shopRef = doc(firestore, 'shops', user.shopId);
                    const getSnap = await getDoc(shopRef);
                    if (getSnap.exists()) {
                        return setupListener(user.shopId);
                    } else {
                        console.warn(`SaaSProvider: Linked shopId ${user.shopId} found in user doc but document is missing in Firestore.`);
                        const newId = await initializeShop(user.shopId);
                        return setupListener(newId!);
                    }
                } else {
                    // Check fallback by ownerId before creating new
                    const q = query(collection(firestore, 'shops'), where('ownerId', '==', user.uid), limit(1));
                    const fallbackSnap = await getDocs(q);
                    if (!fallbackSnap.empty) {
                        const foundId = fallbackSnap.docs[0].id;
                        console.log("SaaSProvider: Found existing shop via ownerId fallback:", foundId);
                        // Link it
                        const userRef = doc(firestore, 'users', user.uid);
                        await updateDoc(userRef, { shopId: foundId });
                        return setupListener(foundId);
                    } else {
                        console.log("SaaSProvider: No shopId and no ownerId match found. Creating fresh shop.");
                        const newId = await initializeShop();
                        return setupListener(newId!);
                    }
                }
            } else if (user.shopId) {
                // For staff/clients, just listen if they have a shopId
                return setupListener(user.shopId);
            } else {
                setLoading(false);
                return () => { };
            }
        };

        const unsubscribePromise = fetchShop();

        return () => {
            unsubscribePromise.then(unsub => unsub && unsub());
        };
    }, [firestore, user]);

    const isLimitReached = (feature: 'customers' | 'bookings'): boolean => {
        if (!currentShop) return false;
        if (currentShop.plan === 'pro') return false;

        if (feature === 'customers') {
            // Standard limit for Free plan is 100
            return currentShop.plan === 'free' && currentShop.customerCount >= (currentShop.maxCustomers || 100);
        }

        if (feature === 'bookings') {
            // If customer limit reached, also block bookings
            return currentShop.plan === 'free' && currentShop.customerCount >= (currentShop.maxCustomers || 100);
        }

        return false;
    };

    return (
        <SaaSContext.Provider value={{ currentShop, loading, isLimitReached }}>
            {children}
        </SaaSContext.Provider>
    );
};

export const useSaaS = () => {
    const context = useContext(SaaSContext);
    if (context === undefined) {
        throw new Error('useSaaS must be used within a SaaSProvider');
    }
    return context;
};
