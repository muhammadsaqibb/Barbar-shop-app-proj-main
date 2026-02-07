'use client';

import { useCallback, useContext } from 'react';
import { SaaSContext } from '@/context/saas-provider';

// For now, we assume sounds can be muted globally via a setting.
// This hook does not implement the setting itself, but it's ready for it.
const useSound = () => {
  const context = useContext(SaaSContext);
  const currentShop = context?.currentShop;

  const playSound = useCallback((sound: 'click' | 'notification' | 'pin-success' | 'booking-success' | 'access-granted' | 'reminder') => {
    const isMuted = currentShop?.soundEnabled !== true;

    if (isMuted || typeof window === 'undefined') {
      return;
    }
    try {
      const audio = new Audio(`/sounds/${sound}.mp3`);
      if (sound === 'pin-success') {
        audio.volume = 0.4; // Subtle volume
      }
      audio.play().catch(error => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Could not play sound: ${sound}. This is expected if the user hasn't interacted with the page yet.`, error);
        }
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [currentShop?.soundEnabled]);

  return playSound;
};

export default useSound;
