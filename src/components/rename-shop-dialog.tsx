"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-provider";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
    appName: z.string().min(1, "Required"),
});

interface RenameShopDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RenameShopDialog({ open, onOpenChange }: RenameShopDialogProps) {
    const { settings } = useSettings();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            appName: settings.appName,
        },
        values: { // Update form when settings load/change
            appName: settings.appName,
        }
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!firestore) return;
        setIsSubmitting(true);
        try {
            await setDoc(doc(firestore, "settings", "app_config"), values, { merge: true });
            toast({
                title: "Shop Renamed",
                description: "The application title has been updated.",
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Error renaming shop:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not update the shop name.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rename Shop</DialogTitle>
                    <DialogDescription>
                        Update the shop name displayed in the header.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="appName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Shop Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="The Gentleman's Cut" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
