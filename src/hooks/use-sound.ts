'use client';

import { useCallback } from 'react';

// For now, we assume sounds can be muted globally via a setting.
// This hook does not implement the setting itself, but it's ready for it.
const useSound = (isMuted = false) => {
  const playSound = useCallback((sound: 'click' | 'notification') => {
    if (isMuted || typeof window === 'undefined') {
      return;
    }
    try {
      // Sounds should be placed in the /public/sounds/ directory
      // e.g., /public/sounds/click.mp3
      const audio = new Audio(`/sounds/${sound}.mp3`);
      audio.play().catch(error => {
        // Autoplay was prevented. This is a common browser policy.
        // We can ignore this error silently in production.
        if (process.env.NODE_ENV === 'development') {
            console.warn(`Could not play sound: ${sound}. This is expected if the user hasn't interacted with the page yet.`, error);
        }
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [isMuted]);

  return playSound;
};

export default useSound;
