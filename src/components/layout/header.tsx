
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User as UserIcon, LayoutDashboard, Users, Sparkles, Receipt, Menu, BookCopy, Package, Scissors, CreditCard } from 'lucide-react';
import Logo from '../logo';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from '../ui/sheet';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import useSound from '@/hooks/use-sound';
import { ModeToggle } from '../mode-toggle';
import { useTranslation } from '@/context/language-provider';
import { LanguageSwitcher } from '../language-switcher';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const playSound = useSound();
  const { t } = useTranslation();

  const pendingQuery = useMemoFirebase(() => {
    if (!firestore || (user?.role !== 'admin' && user?.role !== 'staff')) return null;
    return query(collection(firestore, 'appointments'), where('status', '==', 'pending'));
  }, [firestore, user]);

  const { data: pendingAppointments } = useCollection(pendingQuery);
  const pendingCount = pendingAppointments?.length ?? 0;
  const prevPendingCount = useRef(pendingCount);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        prevPendingCount.current = pendingCount;
        return;
    }

    if (pendingCount > prevPendingCount.current) {
        toast({
            title: t('new_booking_request'),
            description: t('new_booking_description'),
        });
        playSound('notification');
    }

    prevPendingCount.current = pendingCount;
  }, [pendingCount, toast, playSound, t]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const NavLinks = () => (
    <>
      {(user?.role === 'admin' || (user?.role === 'staff' && user.permissions?.canViewOverview)) && (
        <Button variant="ghost" asChild>
          <Link href="/overview">{t('overview')}</Link>
        </Button>
      )}
      {(user?.role === 'admin' || (user?.role === 'staff' && user.permissions?.canViewBookings)) && (
        <Button variant="ghost" asChild className={cn(pendingCount > 0 && "animate-vibrate-reminder")}>
            <Link href="/admin/dashboard" className="relative">
              {t('bookings')}
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {pendingCount}
                </span>
              )}
            </Link>
        </Button>
      )}
      {user?.role === 'admin' && (
        <Button variant="ghost" asChild>
          <Link href="/admin/users">{t('manage_users')}</Link>
        </Button>
      )}
    </>
  );

  const AuthLinks = () => (
     <div className="flex items-center gap-2">
      <Button variant="ghost" asChild>
        <Link href="/login">{t('login')}</Link>
      </Button>
      <Button asChild>
        <Link href="/register">{t('register')}</Link>
      </Button>
    </div>
  );

  const MobileLink = ({ href, children, icon }: { href: string, children: React.ReactNode, icon: React.ReactNode }) => (
    <SheetClose asChild>
      <Link href={href} className="flex items-center gap-4 rounded-md p-3 text-base font-medium hover:bg-accent">
        {icon}
        <span>{children}</span>
      </Link>
    </SheetClose>
  );

  const mobileMenuContent = (
    <SheetContent className="w-[300px]" side="right">
        <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
        <SheetDescription className="sr-only">A list of navigation links and user actions.</SheetDescription>
        <div className="flex flex-col h-full">
        {user ? (
            <>
                <div className="p-4 border-b">
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
                <MobileLink href="/book" icon={<Scissors />}>{t('book_cut_title')}</MobileLink>
                <MobileLink href="/packages" icon={<Package />}>{t('packages_title')}</MobileLink>
                <MobileLink href="/my-appointments" icon={<BookCopy />}>{t('history_title')}</MobileLink>
                
                {(user.role === 'admin' || (user.role === 'staff' && user.permissions?.canViewOverview)) && (
                    <MobileLink href="/overview" icon={<LayoutDashboard />}>{t('overview')}</MobileLink>
                )}

                {(user.role === 'admin' || (user.role === 'staff' && user.permissions?.canViewBookings)) && (
                    <MobileLink href="/admin/dashboard" icon={<BookCopy />}>{t('bookings')}</MobileLink>
                )}

                {user.role === 'admin' && (
                    <>
                    <div className="my-2 border-t -mx-4"></div>
                    <p className="px-4 text-sm font-semibold text-muted-foreground">Admin</p>
                    <MobileLink href="/admin/users" icon={<Users />}>{t('manage_users')}</MobileLink>
                    <MobileLink href="/admin/barbers" icon={<Users />}>{t('manage_barbers')}</MobileLink>
                    <MobileLink href="/admin/services" icon={<Sparkles />}>{t('manage_services')}</MobileLink>
                    <MobileLink href="/admin/expenses" icon={<Receipt />}>{t('manage_expenses')}</MobileLink>
                    <MobileLink href="/admin/settings" icon={<Settings />}>{t('opening_hours')}</MobileLink>
                    <MobileLink href="/admin/payment-settings" icon={<CreditCard />}>{t('link_account')}</MobileLink>
                    </>
                )}
                </div>
                <div className="p-4 border-t space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Language</span>
                        <LanguageSwitcher />
                    </div>
                    <Button variant="outline" className="w-full" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{t('logout')}</span>
                    </Button>
                </div>
            </>
        ) : (
            <div className="p-4 flex flex-col items-center gap-4 mt-8">
                <SheetClose asChild>
                    <Button asChild className="w-full">
                    <Link href="/login">{t('login')}</Link>
                    </Button>
                </SheetClose>
                <SheetClose asChild>
                    <Button variant="outline" asChild className="w-full">
                    <Link href="/register">{t('register')}</Link>
                    </Button>
                </SheetClose>
            </div>
        )}
        </div>
    </SheetContent>
  );


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm text-foreground">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-2 flex items-center space-x-2 lg:mr-6">
          <Logo />
          <div className="grid font-bold font-headline uppercase leading-tight text-xs text-center">
            <span>{t('app_title_line1')}</span>
            <span>{t('app_title_line2')}</span>
            <span>{t('app_title_line3')}</span>
          </div>
        </Link>
        
        <div className="hidden lg:flex items-center space-x-2 text-sm font-medium">
          {user && <NavLinks />}
        </div>
        
        <div className="flex-1 flex items-center justify-end space-x-2">
          <nav className="flex items-center gap-1 sm:gap-2">
             {user && (user?.role === 'admin' || (user?.role === 'staff' && user.permissions?.canViewBookings)) && (
                <Button asChild className={cn("lg:hidden relative", pendingCount > 0 && "animate-vibrate-reminder")} variant="outline" size="sm">
                    <Link href="/admin/dashboard">
                        {t('bookings')}
                        {pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                                {pendingCount}
                            </span>
                        )}
                    </Link>
                </Button>
             )}
             {user && user.role === 'client' && (
                 <Button asChild variant="outline" size="sm" className="lg:hidden">
                    <Link href="/book">Book Now</Link>
                </Button>
             )}
            <ModeToggle />
            {loading ? (
              <Skeleton className="h-8 w-8 rounded-full" />
            ) : (
                <>
                {/* Desktop: Auth links or User Dropdown */}
                <div className="hidden lg:flex items-center gap-2">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                <AvatarImage src={user.email || ''} alt={user.name || 'User'} />
                                <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                                </Avatar>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/my-appointments">
                                    <BookCopy className="mr-2 h-4 w-4" />
                                    <span>{t('history_title')}</span>
                                </Link>
                            </DropdownMenuItem>
                            {(user.role === 'admin' || (user?.role === 'staff' && user.permissions?.canViewBookings)) && (
                                <DropdownMenuItem asChild>
                                <Link href="/admin/dashboard" className="relative">
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    <span>{t('bookings')}</span>
                                    {pendingCount > 0 && (
                                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                                        {pendingCount}
                                    </span>
                                    )}
                                </Link>
                                </DropdownMenuItem>
                            )}
                            {user.role === 'admin' && (
                              <>
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/users">
                                        <Users className="mr-2 h-4 w-4" />
                                        <span>{t('manage_users')}</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/barbers">
                                        <Users className="mr-2 h-4 w-4" />
                                        <span>{t('manage_barbers')}</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/services">
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        <span>{t('manage_services')}</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/expenses">
                                        <Receipt className="mr-2 h-4 w-4" />
                                        <span>{t('manage_expenses')}</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/settings">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>{t('opening_hours')}</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/payment-settings">
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        <span>{t('link_account')}</span>
                                    </Link>
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0 focus:bg-transparent">
                                <div className="flex w-full items-center justify-between px-2 py-1.5">
                                    <span className="text-sm text-muted-foreground">Language</span>
                                    <LanguageSwitcher />
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>{t('logout')}</span>
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <AuthLinks />
                    )}
                </div>

                {/* Mobile: Menu Trigger */}
                <div className="lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            {user ? (
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.email || ''} alt={user.name || 'User'} />
                                    <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            ) : (
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            )}
                        </SheetTrigger>
                        {mobileMenuContent}
                    </Sheet>
                </div>
            </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
