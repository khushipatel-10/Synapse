"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import Link from "next/link";

export default function MessagesIndexPage() {
    const { getToken, isLoaded } = useAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [threads, setThreads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchThreads() {
            if (!isLoaded) return;
            try {
                const token = await getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/messages/threads`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setThreads(data.data);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchThreads();
    }, [isLoaded, getToken]);

    if (loading) {
        return (
            <PageShell showBlobs={false}>
                <div className="flex justify-center mt-10"><Loader2 className="w-8 h-8 animate-spin text-charcoal" /></div>
            </PageShell>
        );
    }

    return (
        <PageShell showBlobs={false}>
            <div className="mb-8 border-b border-brand-mint/30 pb-6">
                <h1 className="text-4xl font-semibold text-charcoal tracking-tight flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-brand-teal" /> Messages
                </h1>
                <p className="text-lg text-muted-dark mt-2 font-normal">Your study peer conversations.</p>
            </div>

            {threads.length > 0 ? (
                <div className="space-y-4 max-w-3xl">
                    {threads.map(thread => (
                        <Link href={`/app/messages/${thread.id}`} key={thread.id}>
                            <Card className="hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all cursor-pointer border border-black/5 bg-white rounded-2xl">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-teal/10 rounded-full flex items-center justify-center font-bold text-brand-teal shrink-0">
                                        {thread.peer?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg text-charcoal font-semibold">{thread.peer?.name || 'Unknown Peer'}</CardTitle>
                                        <p className="text-sm text-muted-gray truncate mt-1">
                                            {thread.lastMessage?.content || 'No messages yet...'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 bg-white rounded-2xl border border-black/5 shadow-sm max-w-3xl">
                    <p className="text-muted-dark font-normal">No active conversations yet. Connect with a peer first!</p>
                </div>
            )}
        </PageShell>
    );
}

