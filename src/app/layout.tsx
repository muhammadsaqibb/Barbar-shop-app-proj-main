import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { Oswald, Lato, Noto_Nastaliq_Urdu } from 'next/font/google';
import { AuthProvider } from '@/components/auth-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/context/language-provider';

const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' });
const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
});
const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  subsets: ['arabic', 'urdu'],
  weight: ['400', '700'],
  variable: '--font-noto-nastaliq-urdu',
});

export const metadata: Metadata = {
  title: 'The Gentleman\'s Cut',
  description: 'Online booking for your next haircut or shave.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${oswald.variable} ${lato.variable} ${notoNastaliqUrdu.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased">
        <LanguageProvider>
          <ThemeProvider storageKey="app-ui-theme">
            <FirebaseClientProvider>
              <AuthProvider>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                </div>
                <Toaster />
              </AuthProvider>
            </FirebaseClientProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
