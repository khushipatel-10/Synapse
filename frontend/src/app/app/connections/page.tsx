"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, CheckCircle2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";

export default function ConnectionsPage() {
    const { getToken, isLoaded } = useAuth();
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchConnections() {
            if (!isLoaded) return;
            try {
                const token = await getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/connections`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setConnections(data.data);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchConnections();
    }, [isLoaded, getToken]);

    const handleAction = async (connectionId: string, action: 'accept' | 'reject') => {
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/connections/${connectionId}/${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: action === 'accept' ? 'accepted' : 'rejected' } : c));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleMessage = async (peerId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/messages/thread`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ receiverId: peerId })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    router.push(`/app/messages/${data.thread.id}`);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <PageShell showBlobs={false}>
                <div className="flex justify-center mt-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
            </PageShell>
        );
    }

    const pendingIncoming = connections.filter(c => c.status === 'pending' && !c.isRequester);
    const pendingOutgoing = connections.filter(c => c.status === 'pending' && c.isRequester);
    const activeConnections = connections.filter(c => c.status === 'accepted');

    return (
        <PageShell showBlobs={false}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-mint/30 pb-6 mb-8">
                <div>
                    <h1 className="text-4xl font-semibold text-charcoal tracking-tight">Peer Connections</h1>
                    <p className="text-lg text-muted-dark mt-2 font-normal">Manage your study partners and study group requests.</p>
                </div>
            </div>

            <div className="space-y-12">
                {/* Active Connections */}
                <section>
                    <h2 className="text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-brand-teal" /> Active Study Peers
                    </h2>
                    {activeConnections.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeConnections.map(conn => (
                                <Card key={conn.id} className="hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all flex flex-col border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-2xl">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-warm-cream shadow-sm rounded-full flex items-center justify-center text-charcoal font-semibold text-lg border border-black/5">
                                                {conn.peer.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-semibold text-charcoal">{conn.peer.name}</CardTitle>
                                                <div className="text-muted-gray text-sm">{conn.peer.major || 'Student'}</div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 pb-2">
                                        <div className="text-sm text-brand-teal font-medium flex items-center gap-1.5 bg-brand-teal/10 w-max px-2.5 py-1 rounded-md">
                                            <CheckCircle2 className="w-4 h-4" /> Connected
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-4 border-t border-black/5">
                                        <Button onClick={() => handleMessage(conn.peer.id)} variant="outline" className="w-full text-charcoal rounded-xl border-black/10">Message Peer</Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-white rounded-2xl border border-black/5 shadow-sm">
                            <p className="text-muted-dark font-normal">No active connections yet.</p>
                        </div>
                    )}
                </section>

                {/* Pending Incoming */}
                <section>
                    <h2 className="text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-brand-amber" /> Incoming Requests
                    </h2>
                    {pendingIncoming.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingIncoming.map(conn => (
                                <Card key={conn.id} className="flex flex-col border border-brand-amber/20 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-2xl">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white shadow-sm rounded-full flex items-center justify-center text-charcoal font-semibold text-lg border border-black/5">
                                                {conn.peer.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-semibold text-charcoal">{conn.peer.name}</CardTitle>
                                                <div className="text-muted-gray text-sm">Wants to study with you</div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardFooter className="flex gap-3 pt-4 border-t border-black/5">
                                        <Button onClick={() => handleAction(conn.id, 'accept')} className="flex-1 bg-brand-teal hover:bg-brand-teal/90 text-charcoal font-medium border-0">
                                            Accept
                                        </Button>
                                        <Button onClick={() => handleAction(conn.id, 'reject')} variant="outline" className="flex-1 border-black/10 text-charcoal">
                                            Decline
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-white rounded-2xl border border-black/5 shadow-sm">
                            <p className="text-muted-dark font-normal">You have no pending incoming requests.</p>
                        </div>
                    )}
                </section>

                {/* Pending Outgoing */}
                <section>
                    <h2 className="text-xl font-semibold text-charcoal mb-4 flex items-center gap-2 text-muted-gray">
                        <Clock className="w-5 h-5" /> Sent Requests
                    </h2>
                    {pendingOutgoing.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingOutgoing.map(conn => (
                                <Card key={conn.id} className="flex flex-col border border-black/5 bg-white/50 opacity-80 rounded-2xl shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white shadow-sm rounded-full flex items-center justify-center text-charcoal font-semibold text-lg border border-black/5">
                                                {conn.peer.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-semibold text-charcoal">{conn.peer.name}</CardTitle>
                                                <div className="text-muted-gray text-sm">Awaiting Response</div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-white rounded-2xl border border-black/5 shadow-sm">
                            <p className="text-muted-dark font-normal">You have no outgoing requests.</p>
                        </div>
                    )}
                </section>
            </div>
        </PageShell>
    );
}
