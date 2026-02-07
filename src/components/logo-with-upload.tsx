"use client";

import { useState, useEffect } from "react";
import { Scissors, Upload } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { useAuth } from "@/components/auth-provider";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LogoWithUploadProps {
    src?: string;
    className?: string;
    shopId?: string;
}

export default function LogoWithUpload({ src, className, shopId }: LogoWithUploadProps) {
    const { user } = useAuth();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newLogo, setNewLogo] = useState(src || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const isAdmin = user?.role === "admin";
    const canEdit = isAdmin && shopId;

    // Sync logo state when src changes
    useEffect(() => {
        setNewLogo(src || "");
    }, [src]);

    const handleSave = async () => {
        if (!firestore || !shopId) {
            console.error("Missing firestore or shopId:", { firestore: !!firestore, shopId });
            toast({
                variant: "destructive",
                title: "Cannot Save",
                description: "Shop information is missing. Please try refreshing the page.",
            });
            return;
        }

        if (!newLogo) {
            toast({
                variant: "destructive",
                title: "No Logo Selected",
                description: "Please upload a logo first.",
            });
            return;
        }

        setIsSaving(true);
        try {
            console.log("Updating logo for shop:", shopId, "with URL:", newLogo);
            const shopDocRef = doc(firestore, "shops", shopId);
            await updateDoc(shopDocRef, {
                logo: newLogo
            });
            toast({
                title: "Logo Updated",
                description: "Your shop logo has been updated successfully.",
            });
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error updating logo:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error instanceof Error ? error.message : "Could not save logo.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const LogoDisplay = () => {
        // Show loading state while uploading
        if (isUploading) {
            return (
                <div className={cn("relative h-8 w-8 rounded-full overflow-hidden shrink-0 bg-white/10 flex items-center justify-center", className)}>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
            );
        }

        if (src) {
            return (
                <div className={cn("relative h-8 w-8 rounded-full overflow-hidden shrink-0 bg-white/10", className)}>
                    <Image
                        src={src}
                        alt="Logo"
                        fill
                        className="object-cover"
                    />
                </div>
            );
        }

        return (
            <Scissors className={cn("text-primary h-6 w-6", className)} />
        );
    };

    if (!canEdit) {
        return <LogoDisplay />;
    }

    return (
        <>
            <div
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDialogOpen(true);
                }}
                className="cursor-pointer hover:opacity-80 transition-all relative group"
                title="Click to upload/change logo"
            >
                <LogoDisplay />
                {/* Always show upload badge for admin */}
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-lg border-2 border-background">
                    <Upload className="h-3 w-3" />
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Shop Logo</DialogTitle>
                        <DialogDescription>
                            Your logo will appear in the header and booking pages.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <ImageUpload
                            label=""
                            path={`shops/${shopId}/branding`}
                            value={newLogo}
                            onChange={setNewLogo}
                            disabled={isSaving || isUploading}
                            onUploadingChange={setIsUploading}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving || isUploading}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving || isUploading || newLogo === src}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Logo
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
