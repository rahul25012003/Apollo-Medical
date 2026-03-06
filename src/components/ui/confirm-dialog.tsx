"use client";

import * as React from "react";
import { AlertTriangle, Trash2, Info, CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmDialogVariant = "danger" | "warning" | "info" | "success";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    variant?: ConfirmDialogVariant;
    loading?: boolean;
}

const variantConfig: Record<ConfirmDialogVariant, {
    icon: React.ElementType;
    iconClass: string;
    iconBgClass: string;
    buttonClass: string;
}> = {
    danger: {
        icon: Trash2,
        iconClass: "text-red-600",
        iconBgClass: "bg-red-100",
        buttonClass: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
        icon: AlertTriangle,
        iconClass: "text-amber-600",
        iconBgClass: "bg-amber-100",
        buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    info: {
        icon: Info,
        iconClass: "text-blue-600",
        iconBgClass: "bg-blue-100",
        buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    success: {
        icon: CheckCircle,
        iconClass: "text-green-600",
        iconBgClass: "bg-green-100",
        buttonClass: "bg-green-600 hover:bg-green-700 text-white",
    },
};

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    variant = "danger",
    loading = false,
}: ConfirmDialogProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const config = variantConfig[variant];
    const Icon = config.icon;

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        onCancel?.();
        onOpenChange(false);
    };

    const showLoading = loading || isLoading;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <div className={cn("p-2 rounded-full shrink-0", config.iconBgClass)}>
                            <Icon className={cn("h-5 w-5", config.iconClass)} />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle>{title}</DialogTitle>
                            <DialogDescription>{description}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={showLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        className={config.buttonClass}
                        onClick={handleConfirm}
                        disabled={showLoading}
                    >
                        {showLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Alert Dialog (single button, just for notifications)
interface AlertDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    buttonText?: string;
    variant?: ConfirmDialogVariant | "error";
}

export function AlertDialog({
    open,
    onOpenChange,
    title,
    description,
    buttonText = "OK",
    variant = "info",
}: AlertDialogProps) {
    const isError = variant === "error";
    const config = isError
        ? { icon: XCircle, iconClass: "text-red-600", iconBgClass: "bg-red-100" }
        : variantConfig[variant as ConfirmDialogVariant];
    const Icon = config.icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <div className={cn("p-2 rounded-full shrink-0", config.iconBgClass)}>
                            <Icon className={cn("h-5 w-5", config.iconClass)} />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle>{title}</DialogTitle>
                            <DialogDescription>{description}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>
                        {buttonText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Hook for easier usage with async operations
export function useConfirmDialog() {
    const [state, setState] = React.useState<{
        open: boolean;
        title: string;
        description: string;
        confirmText: string;
        cancelText: string;
        variant: ConfirmDialogVariant;
        onConfirm: () => void | Promise<void>;
    }>({
        open: false,
        title: "",
        description: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        variant: "danger",
        onConfirm: () => {},
    });

    const confirm = React.useCallback(
        (options: {
            title: string;
            description: string;
            confirmText?: string;
            cancelText?: string;
            variant?: ConfirmDialogVariant;
        }): Promise<boolean> => {
            return new Promise((resolve) => {
                setState({
                    open: true,
                    title: options.title,
                    description: options.description,
                    confirmText: options.confirmText || "Confirm",
                    cancelText: options.cancelText || "Cancel",
                    variant: options.variant || "danger",
                    onConfirm: () => {
                        setState((prev) => ({ ...prev, open: false }));
                        resolve(true);
                    },
                });
            });
        },
        []
    );

    const DialogComponent = React.useCallback(
        () => (
            <ConfirmDialog
                open={state.open}
                onOpenChange={(open) => setState((prev) => ({ ...prev, open }))}
                title={state.title}
                description={state.description}
                confirmText={state.confirmText}
                cancelText={state.cancelText}
                variant={state.variant}
                onConfirm={state.onConfirm}
            />
        ),
        [state]
    );

    return { confirm, ConfirmDialog: DialogComponent };
}

export function useAlertDialog() {
    const [state, setState] = React.useState<{
        open: boolean;
        title: string;
        description: string;
        buttonText: string;
        variant: ConfirmDialogVariant | "error";
    }>({
        open: false,
        title: "",
        description: "",
        buttonText: "OK",
        variant: "info",
    });

    const alert = React.useCallback(
        (options: {
            title: string;
            description: string;
            buttonText?: string;
            variant?: ConfirmDialogVariant | "error";
        }) => {
            setState({
                open: true,
                title: options.title,
                description: options.description,
                buttonText: options.buttonText || "OK",
                variant: options.variant || "info",
            });
        },
        []
    );

    const DialogComponent = React.useCallback(
        () => (
            <AlertDialog
                open={state.open}
                onOpenChange={(open) => setState((prev) => ({ ...prev, open }))}
                title={state.title}
                description={state.description}
                buttonText={state.buttonText}
                variant={state.variant}
            />
        ),
        [state]
    );

    return { alert, AlertDialog: DialogComponent };
}
