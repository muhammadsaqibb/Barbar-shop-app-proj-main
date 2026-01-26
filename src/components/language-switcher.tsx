'use client';

import { useTranslation } from '@/context/language-provider';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-1 rounded-md border p-1">
      <Button
        variant={locale === 'en' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 px-2"
        onClick={() => setLocale('en')}
      >
        EN
      </Button>
      <Button
        variant={locale === 'ur' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 px-2"
        onClick={() => setLocale('ur')}
      >
        UR
      </Button>
    </div>
  );
}
