"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, CheckCircle2, Clock, Search, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function ConnectionsPage() {
    const { getToken, isLoaded } = useAuth();
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Username search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (q.trim().length < 2) { setSearchResults([]); return; }
        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const token = await getToken();
                const res = await fetch(`${API}/users/search?q=${encodeURIComponent(q)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) setSearchResults(data.data);
            } catch (e) { console.error(e); }
            finally { setSearching(false); }
        }, 400);
    };

    const handleSearchConnect = async (userId: string) => {
        setConnectingId(userId);
        try {
            const token = await getToken();
            await fetch(`${API}/connections/request`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: userId })
            });
            setSearchResults(prev => prev.map(u => u.id === userId
                ? { ...u, connection: { status: 'pending', isRequester: true } }
                : u
            ));
        } catch (e) { console.error(e); }
        finally { setConnectingId(null); }
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

            {/* Find by username */}
            <section className="mb-10">
                <h2 className="text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-brand-teal" /> Find a Friend by Username
                </h2>
                <div className="relative max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-gray font-medium text-sm">@</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Search username or name..."
                        className="w-full pl-8 pr-4 py-3 border border-black/10 rounded-xl focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none bg-white text-charcoal text-sm"
                    />
                    {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-gray" />}
                </div>
                {searchResults.length > 0 && (
                    <div className="mt-3 space-y-2 max-w-md">
                        {searchResults.map(u => (
                            <div key={u.id} className="flex items-center gap-3 p-3 bg-white border border-black/5 rounded-xl shadow-sm">
                                <div className="w-9 h-9 rounded-full bg-brand-teal/10 flex items-center justify-center font-semibold text-brand-teal text-sm shrink-0">
                                    {u.name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-charcoal text-sm truncate">{u.name}</p>
                                    {u.username && <p className="text-xs text-muted-gray">@{u.username}</p>}
                                    {u.major && <p className="text-xs text-muted-gray">{u.major}</p>}
                                </div>
                                {!u.connection ? (
                                    <Button size="sm" onClick={() => handleSearchConnect(u.id)} disabled={connectingId === u.id}
                                        className="bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl border-0 shrink-0 text-xs px-3">
                                        {connectingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><UserPlus className="w-3 h-3 mr-1" />Connect</>}
                                    </Button>
                                ) : u.connection.status === 'pending' ? (
                                    <span className="text-xs text-muted-gray bg-black/5 px-3 py-1.5 rounded-lg shrink-0">
                                        {u.connection.isRequester ? 'Pending' : 'Incoming'}
                                    </span>
                                ) : (
                                    <span className="text-xs text-brand-teal bg-brand-teal/10 px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Connected
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                    <p className="mt-3 text-sm text-muted-gray max-w-md">No users found for &quot;{searchQuery}&quot;. Make sure they have set a username in their profile.</p>
                )}
            </section>

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
