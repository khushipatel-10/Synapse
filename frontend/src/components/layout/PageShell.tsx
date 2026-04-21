"use client";

import { ReactNode } from "react";

interface PageShellProps { children: ReactNode; showBlobs?: boolean }

export function PageShell({ children }: PageShellProps) {
    return (
        <div className="relative w-full flex-1 flex flex-col min-h-screen overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #F9F7F7 0%, #f4f6fb 50%, #F9F7F7 100%)' }}>
            {/* Decorative orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(63,114,175,0.06), transparent)' }} />
                <div className="absolute top-1/2 -left-32 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(197,137,64,0.04), transparent)' }} />
                <div className="absolute -bottom-24 right-1/4 w-80 h-80 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(74,140,66,0.04), transparent)' }} />
            </div>

            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-24 md:pb-10 space-y-8 flex-1 relative z-10">
                {children}
            </div>
        </div>
    );
}
