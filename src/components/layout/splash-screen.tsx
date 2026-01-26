import Logo from '../logo';
import { Loader2 } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
      <div className="flex animate-pulse flex-col items-center gap-4">
        <Logo />
        <h1 className="text-2xl font-headline uppercase">The Gentleman's Cut</h1>
        <Loader2 className="mt-4 h-6 w-6 animate-spin text-primary" />
      </div>
    </div>
  );
}
