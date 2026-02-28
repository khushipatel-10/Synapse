"use client";

import { ReactNode } from "react";

interface PageShellProps {
    children: ReactNode;
    showBlobs?: boolean;
}

export function PageShell({ children }: PageShellProps) {
    return (
        <div className="relative w-full flex-1 flex flex-col bg-warm-cream min-h-screen">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 flex-1 relative z-10">
                {children}
            </div>
        </div>
    );
}
