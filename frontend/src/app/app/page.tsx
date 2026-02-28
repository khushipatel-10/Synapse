"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function AppIndex() {
    const router = useRouter();
    const { isLoaded, userId, getToken } = useAuth();
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        async function checkPrefs() {
            if (!isLoaded) return;
            if (!userId) {
                router.push("/sign-in");
                return;
            }

            try {
                const token = await getToken();
                // We hit the backend /me/onboarding GET to see if a DB user exists and has preferences
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/me/onboarding`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    // User might not exist in backend yet or token failed
                    router.push("/app/onboarding");
                    return;
                }

                const data = await res.json();
                if (!data.success || !data.data || !data.data.preferencesHasBeenSet) {
                    router.push("/app/onboarding");
                } else {
                    router.push("/app/recommendations");
                }
            } catch (e) {
                console.error("Error verifying onboarding state:", e);
                // Failsafe: send to onboarding to be sure
                router.push("/app/onboarding");
            }
        }

        checkPrefs();
    }, [isLoaded, userId, getToken, router]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
            <div className="text-center space-y-4 animate-pulse">
                <Loader2 className="w-10 h-10 animate-spin text-brand-teal mx-auto" />
                <p className="text-muted-gray font-medium tracking-wide">Initializing your workspace...</p>
            </div>
        </div>
    )
}
