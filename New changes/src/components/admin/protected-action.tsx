"use client";

import React, { useState } from "react";
import { AdminPinDialog } from "./admin-pin-dialog";
import { useRouter } from "next/navigation";

import { useSaaS } from "@/context/saas-provider";

interface ProtectedActionProps {
    children: React.ReactElement;
    onSuccess?: () => void;
    bypass?: boolean;
    featureId?: string;
    href?: string;
}

export function ProtectedAction({ children, onSuccess, bypass = false, featureId, href }: ProtectedActionProps) {
    const [showPin, setShowPin] = useState(false);
    const router = useRouter();
    const { currentShop } = useSaaS();

    const childProps = (children as any).props || {};
    const targetHref = href || childProps.href;

    const handleClick = (e: React.MouseEvent) => {
        if (bypass) {
            if (childProps.onClick) childProps.onClick(e);
            return;
        }

        // Check granular locks
        // If featureId is provided, we ONLY lock if it is explicitly set to TRUE in featureLocks
        if (featureId) {
            const isLocked = currentShop?.featureLocks?.[featureId] === true;
            if (!isLocked) {
                // Open access
                if (childProps.onClick) childProps.onClick(e);
                return;
            }
        }

        // If we get here, it is either locked, or it's a generic protected action (no featureId)
        e.preventDefault();
        e.stopPropagation();
        setShowPin(true);
    };

    const handlePinSuccess = () => {
        setShowPin(false);
        if (onSuccess) {
            onSuccess();
        }

        if (targetHref) {
            router.push(targetHref);
        } else if (childProps.onClick) {
            childProps.onClick({ ...new MouseEvent('click'), preventDefault: () => { }, stopPropagation: () => { } });
        }
    };

    const trigger = React.cloneElement(children, {
        onClick: handleClick,
    } as React.HTMLAttributes<HTMLElement>);

    return (
        <>
            {trigger}
            <AdminPinDialog
                open={showPin}
                onOpenChange={setShowPin}
                onSuccess={handlePinSuccess}
            />
        </>
    );
}
