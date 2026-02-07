"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { useFirebase } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import imageCompression from 'browser-image-compression';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    label: string;
    path: string; // Storage path prefix, e.g. "shops/logos"
    onUploadingChange?: (isUploading: boolean) => void;
}

export function ImageUpload({ value, onChange, disabled, label, path, onUploadingChange }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const { storage } = useFirebase();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation: File Type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast({
                variant: "destructive",
                title: "Invalid file format",
                description: "Please upload a JPG, PNG, or WEBP image file.",
            });
            return;
        }

        if (!storage) {
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: "Storage is not initialized. Please refresh the page.",
            });
            return;
        }

        setIsUploading(true);
        onUploadingChange?.(true);
        try {
            // Compress image for fast upload - any resolution becomes optimized
            const options = {
                maxSizeMB: 0.5, // Compress to max 500KB
                maxWidthOrHeight: 800, // Resize to max 800px
                useWebWorker: true,
                fileType: file.type as any,
            };

            console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
            const compressedFile = await imageCompression(file, options);
            console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');

            // Create a unique filename
            const timestamp = Date.now();
            const filename = `${path}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
            const storageRef = ref(storage, filename);

            console.log('Uploading to:', filename);
            await uploadBytes(storageRef, compressedFile);
            const url = await getDownloadURL(storageRef);
            console.log('Upload successful, URL:', url);

            onChange(url);
            toast({
                title: "Image Uploaded",
                description: "Image uploaded successfully.",
            });
        } catch (error) {
            console.error("Upload error:", error);
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: error instanceof Error ? error.message : "Could not upload image. Please try again.",
            });
        } finally {
            setIsUploading(false);
            onUploadingChange?.(false);
            // Clear the input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = () => {
        onChange("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-4 w-full">
            <Label>{label}</Label>
            <div className="flex flex-col items-center gap-4">
                {value ? (
                    <div className="relative aspect-video w-full max-w-sm rounded-lg overflow-hidden border bg-muted">
                        <div className="absolute top-2 right-2 z-10">
                            <Button
                                type="button"
                                onClick={handleRemove}
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                disabled={disabled}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <Image
                            src={value}
                            alt="Upload"
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full max-w-sm aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Click to upload</span>
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG or WEBP</p>
                        </div>
                    </div>
                )}

                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={disabled || isUploading}
                />

                {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                    </div>
                )}
            </div>
        </div>
    );
}
