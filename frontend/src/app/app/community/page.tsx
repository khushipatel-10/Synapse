"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, PlusCircle, UserPlus, CheckCircle2, LogOut, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import Link from "next/link";

export default function CommunityHubsPage() {
    const { getToken, isLoaded } = useAuth();
    const { user } = useUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [hubs, setHubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newHubName, setNewHubName] = useState("");

    useEffect(() => {
        async function fetchHubs() {
            if (!isLoaded) return;
            try {
                const token = await getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/community/hubs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setHubs(data.data || []);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchHubs();
    }, [isLoaded, getToken]);

    const handleJoin = async (hubId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/community/hubs/${hubId}/join`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHubs(prev => prev.map(h => h.id === hubId ? { ...h, userStatus: data.status, memberCount: h.memberCount + (data.status === 'member' ? 1 : 0) } : h));
            } else {
                alert("Failed to join hub.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleLeave = async (hubId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/community/hubs/${hubId}/leave`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setHubs(prev => prev.map(h => h.id === hubId ? { ...h, userStatus: 'none', memberCount: Math.max(0, h.memberCount - 1) } : h));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateHub = async () => {
        if (!newHubName.trim()) return;
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/community/hubs`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newHubName })
            });
            if (res.ok) {
                setIsCreating(false);
                setNewHubName("");
                // Refresh list
                window.location.reload();
            } else {
                alert("Failed to create hub.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <PageShell showBlobs={false}>
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-semibold text-charcoal tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-brand-lavender opacity-80" /> Community Hubs
                    </h1>
                    <p className="text-lg text-muted-dark mt-2 font-normal">Discover algorithmic study groups formed around structural complementary traits.</p>
                </div>
                <Button
                    onClick={() => setIsCreating(true)}
                    className="rounded-xl bg-charcoal text-white shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 border-0 font-medium"
                >
                    <PlusCircle className="w-4 h-4 mr-2" /> Request New Hub
                </Button>
            </div>

            {isCreating && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md border border-black/10">
                        <h2 className="text-xl font-semibold text-charcoal mb-4">Create New Hub</h2>
                        <input
                            type="text"
                            placeholder="e.g. Graph Theory Night Owls"
                            className="w-full px-4 py-3 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 mb-4"
                            value={newHubName}
                            onChange={(e) => setNewHubName(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" className="rounded-xl hover:bg-black/5" onClick={() => setIsCreating(false)}>Cancel</Button>
                            <Button className="rounded-xl bg-brand-teal text-white hover:bg-brand-teal/90" onClick={handleCreateHub}>Create Hub</Button>
                        </div>
                    </div>
                </div>
            )}

            {hubs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hubs.map((hub) => (
                        <Card key={hub.id} className="hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col justify-between border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden">
                            <div className="h-1 w-full bg-black/5" />
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-xl font-semibold text-charcoal">{hub.name}</CardTitle>
                                    <span className="text-xs font-medium text-charcoal bg-black/5 px-2 py-1 rounded-md border border-black/5">
                                        {hub.memberCount || 0}/6 Members
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                {hub.userStatus === 'member' ? (
                                    <>
                                        <div className="text-sm font-semibold text-muted-gray uppercase tracking-wider mb-2">Members</div>
                                        <div className="flex flex-wrap gap-2 text-sm text-muted-dark bg-black/5 p-3 rounded-xl border border-black/5">
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {hub.members && hub.members.length > 0 ? (
                                                hub.members.map((m: any) => m.name).join(", ")
                                            ) : (
                                                "No members yet."
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-sm text-muted-gray italic">
                                        Join this hub to see the active member list.
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-4 border-t border-black/5 bg-white flex flex-col gap-2">
                                {hub.userStatus === 'member' ? (
                                    <>
                                        <Link href={`/app/community/hubs/${hub.id}`} className="w-full">
                                            <Button className="w-full bg-brand-teal text-white hover:bg-brand-teal/90 rounded-xl font-medium shadow-sm transition-all hover:-translate-y-0.5">
                                                Enter Hub <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            className="w-full text-muted-gray hover:text-red-500 hover:bg-red-50 rounded-xl font-medium"
                                            onClick={() => handleLeave(hub.id)}
                                        >
                                            <LogOut className="w-4 h-4 mr-2" /> Leave Hub
                                        </Button>
                                    </>
                                ) : hub.userStatus === 'pending' ? (
                                    <Button variant="outline" className="w-full text-brand-amber border-brand-amber/30 hover:bg-brand-amber/10 rounded-xl font-medium transition-colors" onClick={() => handleLeave(hub.id)}>
                                        Withdraw Request
                                    </Button>
                                ) : (
                                    <Button className="w-full rounded-xl bg-white border border-black/10 text-charcoal hover:bg-black/5 font-medium transition-colors" onClick={() => handleJoin(hub.id)} disabled={hub.memberCount >= 6}>
                                        <UserPlus className="w-4 h-4 mr-2 text-charcoal" /> {hub.memberCount >= 6 ? 'Hub Full' : 'Join Hub'}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-16 text-center border border-black/5 rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] mt-6">
                    <div className="w-16 h-16 bg-white shadow-sm border border-black/5 rounded-full flex items-center justify-center text-charcoal mb-6">
                        <Users className="w-8 h-8 opacity-80" />
                    </div>
                    <h3 className="text-xl font-semibold text-charcoal mb-2">No hubs yet</h3>
                    <p className="text-muted-dark max-w-sm mb-6 leading-relaxed font-normal">
                        Hubs appear after more users join the course or an active formation is run.
                    </p>
                </div>
            )}
        </PageShell>
    );
}
