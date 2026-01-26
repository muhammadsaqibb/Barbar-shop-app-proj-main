
"use client";

import { useState } from "react";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { seedDatabase } from "@/lib/seed";
import { Button } from "../ui/button";

interface SeedBarbersProps {
    onSeed?: () => void;
    variant?: 'default' | 'card';
}

export const SeedBarbers = ({ onSeed, variant = 'default' }: SeedBarbersProps) => {
    const { firestore } = useFirebase();
    const [seeding, setSeeding] = useState(false);
    const { toast } = useToast();

    const handleSeed = async () => {
        if (!firestore) {
            toast({
                variant: "destructive",
                title: "Seeding Failed",
                description: "Database connection not available.",
            });
            return;
        }
        setSeeding(true);
        try {
            await seedDatabase(firestore);
            toast({
                title: "Database Seeded!",
                description: "Default barbers have been added.",
            });
            if (onSeed) {
              onSeed();
            }
        } catch (error) {
            console.error("Failed to seed database:", error);
            toast({
                variant: "destructive",
                title: "Seeding Failed",
                description: "Could not seed the database.",
            });
        } finally {
            setSeeding(false);
        }
    };

    if (variant === 'card') {
        return (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-semibold">No Barbers Found</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                    Your barbers list is empty. You can seed the database with default barbers to get started.
                </p>
                <Button onClick={handleSeed} disabled={seeding}>
                    {seeding ? 'Seeding...' : 'Seed Default Barbers'}
                </Button>
            </div>
        );
    }
    
    return (
        <div className="text-center py-4">
             <p className="text-muted-foreground mb-4">
                No barbers have been configured yet. As an admin, you can add them.
            </p>
            <Button onClick={handleSeed} disabled={seeding}>
                {seeding ? 'Seeding...' : 'Seed Default Barbers'}
            </Button>
        </div>
    )
}
