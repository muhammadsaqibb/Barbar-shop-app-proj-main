"use client";

import { useState } from "react";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { seedDatabase } from "@/lib/seed";
import { Button } from "../ui/button";

interface SeedServicesProps {
    onSeed?: () => void;
    variant?: 'default' | 'card';
}

export const SeedServices = ({ onSeed, variant = 'default' }: SeedServicesProps) => {
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
                description: "Default services and barbers have been added.",
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
                <h3 className="text-xl font-semibold">No Services Found</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                    Your services list is empty. You can seed the database with default services to get started.
                </p>
                <Button onClick={handleSeed} disabled={seeding}>
                    {seeding ? 'Seeding...' : 'Seed Default Services'}
                </Button>
            </div>
        );
    }
    
    return (
        <div className="text-center py-4">
             <p className="text-muted-foreground mb-4">
                No services have been configured yet. As an admin, you can add them.
            </p>
            <Button onClick={handleSeed} disabled={seeding}>
                {seeding ? 'Seeding...' : 'Seed Default Services'}
            </Button>
        </div>
    )
}
