

"use client";

import { useAuth } from "@/components/auth-provider";
import { useFirebase } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
    Scissors, Sparkles, LayoutDashboard, Package, BookCopy, Receipt, 
    LogIn, Users, Settings, User as UserIcon, RotateCcw,
} from "lucide-react";
import { useTranslation } from "@/context/language-provider";
import type { AppUser } from "@/types";
import type { Translations } from "@/context/language-provider";
import { useState, useEffect, useMemo } from "react";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const formatUserDisplayName = (name: string | null | undefined, email: string | null | undefined): string => {
    if (name) return name;
    if (email) {
      const emailName = email.split('@')[0];
      return emailName.split(/[\._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return 'Guest';
}

interface ActionCardData {
    id: string;
    href: string;
    icon: React.ReactNode;
    titleKey: keyof Translations;
    descriptionKey: keyof Translations;
    isVisible: (user: AppUser | null) => boolean;
}

const ALL_ACTION_CARDS: ActionCardData[] = [
    {
        id: 'overview',
        href: '/overview',
        icon: <LayoutDashboard className="h-6 w-6" />,
        titleKey: 'overview',
        descriptionKey: 'overview_desc',
        isVisible: (user) => user?.role === 'admin' || (user?.role === 'staff' && !!user.permissions?.canViewOverview),
    },
    {
        id: 'bookings',
        href: '/admin/dashboard',
        icon: <BookCopy className="h-6 w-6" />,
        titleKey: 'bookings',
        descriptionKey: 'bookings_desc',
        isVisible: (user) => user?.role === 'admin' || (user?.role === 'staff' && !!user.permissions?.canViewBookings),
    },
    {
        id: 'manage_users',
        href: '/admin/users',
        icon: <Users className="h-6 w-6" />,
        titleKey: 'manage_users',
        descriptionKey: 'manage_users_desc',
        isVisible: (user) => user?.role === 'admin',
    },
    {
        id: 'manage_services',
        href: '/admin/services',
        icon: <Sparkles className="h-6 w-6" />,
        titleKey: 'manage_services',
        descriptionKey: 'manage_services_desc',
        isVisible: (user) => user?.role === 'admin',
    },
    {
        id: 'manage_barbers',
        href: '/admin/barbers',
        icon: <Users className="h-6 w-6" />,
        titleKey: 'manage_barbers',
        descriptionKey: 'manage_barbers_desc',
        isVisible: (user) => user?.role === 'admin',
    },
    {
        id: 'manage_expenses',
        href: '/admin/expenses',
        icon: <Receipt className="h-6 w-6" />,
        titleKey: 'manage_expenses',
        descriptionKey: 'manage_expenses_desc',
        isVisible: (user) => user?.role === 'admin',
    },
    {
        id: 'book_cut',
        href: '/book',
        icon: <Scissors className="h-6 w-6" />,
        titleKey: 'book_cut_title',
        descriptionKey: 'book_cut_desc',
        isVisible: (user) => !!user,
    },
    {
        id: 'packages',
        href: '/packages',
        icon: <Package className="h-6 w-6" />,
        titleKey: 'packages_title',
        descriptionKey: 'packages_desc',
        isVisible: (user) => !!user,
    },
    // Guest Cards
    {
        id: 'guest_book_now',
        href: '/book',
        icon: <Scissors className="h-6 w-6" />,
        titleKey: 'book_now_title',
        descriptionKey: 'book_now_desc',
        isVisible: (user) => !user,
    },
    {
        id: 'guest_view_packages',
        href: '/packages',
        icon: <Package className="h-6 w-6" />,
        titleKey: 'view_packages_title',
        descriptionKey: 'packages_desc',
        isVisible: (user) => !user,
    },
    {
        id: 'guest_login',
        href: '/login',
        icon: <LogIn className="h-6 w-6" />,
        titleKey: 'login_signup_title',
        descriptionKey: 'login_signup_desc',
        isVisible: (user) => !user,
    }
];

export default function Home() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [cardLayout, setCardLayout] = useState<ActionCardData[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            delay: 500,
            tolerance: 10,
        },
    })
  );

  const displayName = formatUserDisplayName(user?.name, user?.email);
  const visibleCards = useMemo(() => ALL_ACTION_CARDS.filter(card => card.isVisible(user)), [user]);

  useEffect(() => {
    const savedOrder = user?.homepageLayout;
    let sortedCards = [...visibleCards];
    if (savedOrder) {
      const cardMap = new Map(visibleCards.map(c => [c.id, c]));
      const orderedVisibleCards = savedOrder
        .map(id => cardMap.get(id))
        .filter((c): c is ActionCardData => !!c);
      const orderedVisibleIds = new Set(orderedVisibleCards.map(c => c.id));
      const newCards = visibleCards.filter(c => !orderedVisibleIds.has(c.id));
      sortedCards = [...orderedVisibleCards, ...newCards];
    }
    setCardLayout(sortedCards);
  }, [user, visibleCards]);

  const handleSaveLayout = async (newOrder: string[]) => {
    if (!user) return;
    const userRef = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(userRef, { homepageLayout: newOrder });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save your layout." });
    }
  };
  
  const handleResetLayout = async () => {
    if (!user) return;
    const userRef = doc(firestore, 'users', user.uid);
     try {
      await updateDoc(userRef, { homepageLayout: deleteField() });
      setCardLayout(visibleCards);
      setIsEditMode(false);
      toast({ title: "Layout Reset", description: "Your homepage layout has been reset to default." });
    } catch (error) {
      toast({ variant: "destructive", title: "Reset Failed", description: "Could not reset your layout." });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setIsEditMode(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCardLayout((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newLayout = arrayMove(items, oldIndex, newIndex);
        const newOrder = newLayout.map(card => card.id);
        handleSaveLayout(newOrder);
        return newLayout;
      });
    }
  };
  
  const cardIds = useMemo(() => cardLayout.map(c => c.id), [cardLayout]);

  const mainContent = (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {cardLayout.map((card) => (
            <ActionCard
                key={card.id}
                href={card.href}
                icon={card.icon}
                title={t(card.titleKey)}
                description={t(card.descriptionKey)}
            />
        ))}
    </div>
  );

  return (
    <div className="w-full">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline uppercase">
            {t('app_headline')}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {user ? t('welcome_back_user', { name: displayName }) : t('app_subheadline_logged_out')}{' '}
            {t('ready_fresh_look')}
          </p>
        </div>

        {user && (
            <div className="flex justify-center mb-8 gap-4">
                <Button variant="outline" onClick={handleResetLayout}><RotateCcw className="mr-2 h-4 w-4" /> Reset Layout</Button>
                {isEditMode && <Button onClick={() => setIsEditMode(false)}>Done</Button>}
            </div>
        )}
        
        {isEditMode && (
          <div className="text-center mb-4 p-2 rounded-md bg-accent text-accent-foreground font-semibold animate-pulse">
            Reorder Mode
          </div>
        )}

        {user ? (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setIsEditMode(false)}
            >
                <SortableContext items={cardIds} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
                        {cardLayout.map((card) => (
                            <SortableActionCard 
                                key={card.id} 
                                id={card.id}
                                isEditMode={isEditMode}
                                href={card.href}
                                icon={card.icon}
                                title={t(card.titleKey)}
                                description={t(card.descriptionKey)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        ) : mainContent }
      </div>
    </div>
  );
}

interface ActionCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
}

function SortableActionCard(props: ActionCardProps & { id: string, isEditMode: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: props.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
    };

    const handleClick = (e: React.MouseEvent) => {
        if (props.isEditMode) {
            e.preventDefault();
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${props.isEditMode ? 'cursor-grab' : ''}`}
        >
            <Link href={props.href} className="flex h-full" onClick={handleClick} draggable="false">
                <ActionCard {...props} isDraggable={props.isEditMode} />
            </Link>
        </div>
    );
}

function ActionCard({ href, icon, title, description, disabled, isDraggable }: ActionCardProps & { isDraggable?: boolean; }) {
  const content = (
      <Card className={`group w-full h-full text-center shadow-lg hover:shadow-primary/20 transition-all duration-300 relative ${disabled ? 'bg-muted/50' : 'bg-card'} ${isDraggable ? 'ring-2 ring-primary ring-offset-2 animate-shake' : ''} ${!isDraggable && !disabled ? 'hover:animate-shake' : ''}`}>
      <CardContent className="p-4 flex flex-col items-center justify-center gap-3">
        <div className={`p-3 rounded-full bg-primary text-primary-foreground`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold font-headline text-card-foreground">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        {disabled && (
            <div className="mt-2 text-xs font-semibold text-muted-foreground/80">
                Coming Soon
            </div>
        )}
      </CardContent>
    </Card>
  );

  if (disabled) {
    return <div className={`h-full cursor-not-allowed`}>{content}</div>
  }
  
  return content;
}
