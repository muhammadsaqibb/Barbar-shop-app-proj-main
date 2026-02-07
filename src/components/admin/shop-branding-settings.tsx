"use client";

import { useState, useEffect } from "react";
import { useFirebase, useDoc } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Shop } from "@/types";
import { Label } from "@/components/ui/label";

export default function ShopBrandingSettings() {
    const { user } = useAuth();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Assuming existing user has shopId or we infer it. 
    // In current context, if user is admin, their shopId depends on the multi-tenant setup.
    // However, usually an admin is managing *their* shop. 
    // If user.shopId exists, use it. Otherwise, if they are platform admin, this might be ambiguous.
    // For now, let's assume user.shopId is reliable for the admin's shop.
    const shopId = user?.shopId;

    // Fetch shop data
    const shopRef = firestore && shopId ? doc(firestore, 'shops', shopId) : null;
    const { data: shop, isLoading } = useDoc<Shop>(shopRef);

    const [logo, setLogo] = useState<string>("");

    useEffect(() => {
        if (shop?.logo) {
            setLogo(shop.logo);
        }
    }, [shop]);

    const handleSave = async () => {
        if (!firestore || !shopId) return;
        setIsSaving(true);
        try {
            const shopDocRef = doc(firestore, 'shops', shopId);
            await updateDoc(shopDocRef, {
                logo: logo
            });
            toast({
                title: "Branding Updated",
                description: "Shop logo has been successfully updated.",
            });
        } catch (error) {
            console.error("Error updating branding:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not save changes.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    if (!shopId) {
        return <div className="p-4 text-destructive">Shop ID not found for current user.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Shop Logo</Label>
                <p className="text-sm text-muted-foreground">
                    This logo will appear on your profile, booking page, and app header.
                </p>
                <ImageUpload
                    label=""
                    path={`shops/${shopId}/branding`}
                    value={logo}
                    onChange={setLogo}
                    disabled={isSaving}
                />
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving || logo === shop?.logo}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
