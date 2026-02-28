"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Users, Calendar, Brain, Activity, Send, Plus } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

export default function HubDetailPage() {
    const params = useParams();
    const hubId = params?.hubId as string;
    const { getToken, isLoaded } = useAuth();
    const { user } = useUser();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [hub, setHub] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [messages, setMessages] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('feed');
    const [newMessage, setNewMessage] = useState("");

    // session form
    const [newSessionTitle, setNewSessionTitle] = useState("");
    const [newSessionDate, setNewSessionDate] = useState("");

    useEffect(() => {
        async function fetchHubData() {
            if (!isLoaded || !hubId) return;
            try {
                const token = await getToken();
                const headers = { 'Authorization': `Bearer ${token}` };
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

                const [hubRes, msgRes, sessRes] = await Promise.all([
                    fetch(`${baseUrl}/community/hubs/${hubId}`, { headers }),
                    fetch(`${baseUrl}/community/hubs/${hubId}/messages`, { headers }),
                    fetch(`${baseUrl}/community/hubs/${hubId}/sessions`, { headers })
                ]);

                if (hubRes.ok) {
                    const hData = await hubRes.json();
                    setHub(hData.data);
                }
                if (msgRes.ok) {
                    const mData = await msgRes.json();
                    setMessages(mData.data);
                }
                if (sessRes.ok) {
                    const sData = await sessRes.json();
                    setSessions(sData.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchHubData();
    }, [isLoaded, getToken, hubId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/community/hubs/${hubId}/message`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, data.data]);
                setNewMessage("");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSessionTitle.trim() || !newSessionDate) return;
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/community/hubs/${hubId}/sessions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newSessionTitle, scheduledAt: newSessionDate })
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(prev => [...prev, data.data]);
                setNewSessionTitle("");
                setNewSessionDate("");
                setActiveTab("sessions");
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <PageShell showBlobs={false}>
                <div className="flex justify-center mt-10"><Loader2 className="w-8 h-8 animate-spin text-charcoal" /></div>
            </PageShell>
        );
    }

    if (!hub) {
        return (
            <PageShell showBlobs={false}>
                <div className="text-center mt-10 text-charcoal">Hub not found.</div>
            </PageShell>
        );
    }

    return (
        <PageShell showBlobs={false}>
            {/* Header */}
            <div className="mb-8 border-b border-brand-teal/20 pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-semibold text-charcoal tracking-tight mb-2">{hub.name}</h1>
                        <p className="text-lg text-muted-dark font-normal flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-teal" />
                            {hub.memberCount} / 6 Active Members
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button onClick={() => setActiveTab('feed')} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${activeTab === 'feed' ? 'bg-brand-mint/50 text-charcoal border border-brand-mint/60' : 'text-muted-dark hover:bg-black/5 bg-white border border-transparent'}`}>
                        Hub Activity
                    </button>
                    <button onClick={() => setActiveTab('analysis')} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm flex items-center gap-2 ${activeTab === 'analysis' ? 'bg-brand-lavender/30 text-charcoal border border-brand-lavender/50' : 'text-muted-dark hover:bg-black/5 bg-white border border-transparent'}`}>
                        <Brain className="w-4 h-4" /> Concept Gaps
                    </button>
                    <button onClick={() => setActiveTab('sessions')} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm flex items-center gap-2 ${activeTab === 'sessions' ? 'bg-brand-amber/20 text-charcoal border border-brand-amber/40' : 'text-muted-dark hover:bg-black/5 bg-white border border-transparent'}`}>
                        <Calendar className="w-4 h-4" /> Peer Sessions
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 flex flex-col h-[600px] overflow-hidden">
                    {activeTab === 'feed' && (
                        <div className="flex flex-col h-full bg-white border border-black/5 shadow-sm rounded-2xl overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-warm-cream/10">
                                {messages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-gray text-sm">No messages yet in this hub.</div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${msg.isMine ? 'bg-brand-teal/20 text-charcoal rounded-br-none border border-brand-teal/30' : 'bg-white border border-black/5 text-charcoal rounded-bl-none'}`}>
                                                {!msg.isMine && <p className="text-xs font-semibold text-brand-teal mb-1">{msg.senderName}</p>}
                                                <p className="text-[15px] leading-relaxed">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-black/5 flex gap-3">
                                <input type="text" placeholder="Message hub..." className="flex-1 bg-warm-cream/50 border border-black/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-charcoal" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                                <Button type="submit" disabled={!newMessage.trim()} className="bg-brand-teal text-charcoal rounded-full w-12 h-12 p-0 flex items-center justify-center border-0">
                                    <Send className="w-4 h-4 ml-1" />
                                </Button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'analysis' && (
                        <div className="overflow-y-auto h-full pr-2">
                            <Card className="border border-black/5 shadow-sm rounded-2xl bg-white mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-charcoal"><Activity className="w-5 h-5 text-brand-lavender" /> Group Weaknesses</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 text-muted-dark">
                                        <div className="p-4 bg-black/5 rounded-xl border border-black/10">
                                            <p className="font-medium text-charcoal">Graph Traversal (BFS/DFS)</p>
                                            <p className="text-sm mt-1">3 members are currently struggling with this module.</p>
                                        </div>
                                        <div className="p-4 bg-black/5 rounded-xl border border-black/10">
                                            <p className="font-medium text-charcoal">Dynamic Programming Top-Down</p>
                                            <p className="text-sm mt-1">Group completion rate is below average.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'sessions' && (
                        <div className="flex flex-col h-full gap-6 overflow-y-auto pr-2">
                            <Card className="border border-black/5 shadow-sm rounded-2xl bg-white shrink-0">
                                <CardHeader>
                                    <CardTitle className="text-lg text-charcoal">Schedule New Session</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateSession} className="flex gap-4 items-end">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-xs font-semibold text-muted-gray uppercase tracking-wider">Topic / Title</label>
                                            <input type="text" className="w-full bg-white border border-black/10 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-amber/50 outline-none text-charcoal" placeholder="e.g. Graph Traversal Review" value={newSessionTitle} onChange={e => setNewSessionTitle(e.target.value)} />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-xs font-semibold text-muted-gray uppercase tracking-wider">Date & Time</label>
                                            <input type="datetime-local" className="w-full bg-white border border-black/10 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-amber/50 outline-none text-charcoal" value={newSessionDate} onChange={e => setNewSessionDate(e.target.value)} />
                                        </div>
                                        <Button type="submit" disabled={!newSessionTitle || !newSessionDate} className="bg-brand-teal text-charcoal hover:bg-brand-teal/90 rounded-xl px-6 h-10 border-0">
                                            <Plus className="w-4 h-4 mr-2" /> Schedule
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                {sessions.length === 0 ? (
                                    <Card className="border border-black/5 shadow-sm rounded-2xl bg-white text-center py-12">
                                        <Calendar className="w-12 h-12 text-muted-gray/50 mx-auto mb-4" />
                                        <p className="text-muted-dark">No upcoming group sessions scheduled.</p>
                                    </Card>
                                ) : (
                                    sessions.map((s, idx) => (
                                        <Card key={idx} className="border border-brand-amber/30 bg-white/50 shadow-sm rounded-2xl">
                                            <CardContent className="p-5 flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-semibold text-charcoal">{s.title}</h3>
                                                    <p className="text-sm text-muted-dark flex items-center gap-1 mt-1">
                                                        <Calendar className="w-4 h-4" /> {new Date(s.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-gray">Scheduled by</p>
                                                    <p className="text-sm font-medium text-charcoal">{s.creatorName}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] bg-white rounded-2xl">
                        <CardHeader className="border-b border-black/5 bg-black/5 md:bg-transparent pb-4">
                            <CardTitle className="text-lg text-charcoal">Cohort Roster</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 divide-y divide-black/5">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {hub.members.map((member: any) => (
                                <div key={member.id} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-teal/10 flex items-center justify-center font-bold text-charcoal text-xs border border-transparent">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-charcoal">
                                                {member.name} {member.id === hub.members.find((m: any) => m.name === user?.fullName)?.id && <span className="text-xs text-brand-teal font-bold ml-1">(You)</span>}
                                            </p>
                                            <p className="text-xs text-muted-gray capitalize">{member.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageShell>
    );
}
