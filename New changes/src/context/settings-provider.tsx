"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useFirebase } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface AppSettings {
    appName: string;
}

interface SettingsContextType {
    settings: AppSettings;
    loading: boolean;
}

const defaultSettings: AppSettings = {
    appName: "The Gentleman's Cut",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const { firestore } = useFirebase();
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore) return;

        const docRef = doc(firestore, 'settings', 'app_config');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Migration logic: if appName is set, use it. Otherwise join lines or use default.
                let name = data.appName;
                if (!name && (data.appNameLine1 || data.appNameLine2 || data.appNameLine3)) {
                    name = [data.appNameLine1, data.appNameLine2, data.appNameLine3].filter(Boolean).join(' ');
                }

                setSettings({
                    appName: name || defaultSettings.appName,
                });
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching settings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);

    return (
        <SettingsContext.Provider value={{ settings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
