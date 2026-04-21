"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, Star, Users, Loader2, TrendingUp, TrendingDown, BookOpen, Zap } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export default function RecommendationsPage() {
    const { getToken, isLoaded } = useAuth();
    const { user } = useUser();
    const [recommendations, setRecommendations] = useState<{ topPairs: any[], hubs: any[], hasAssessment: boolean }>({ topPairs: [], hubs: [], hasAssessment: false });
    const [loading, setLoading] = useState(true);
    const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        async function fetchRecs() {
            if (!isLoaded) return;
            try {
                const token = await getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/recommendations/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) { const data = await res.json(); if (data.success) setRecommendations(data.data); }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        fetchRecs();
    }, [isLoaded, getToken]);

    const handleConnect = async (receiverId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/connections/request`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId, courseId: '15d92016-00f7-4fe7-b423-6ced0b269793' })
            });
            if (res.ok) setRequestedIds(prev => new Set(prev).add(receiverId));
        } catch (e) { console.error(e); }
    };

    const handleWithdraw = async (receiverId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/connections/request/withdraw`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId })
            });
            if (res.ok) setRequestedIds(prev => { const s = new Set(prev); s.delete(receiverId); return s; });
        } catch (e) { console.error(e); }
    };

    if (loading) {
        return (
            <PageShell>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
                    {[0,1,2,3,4,5].map(i => <div key={i} className="h-72 rounded-2xl skeleton" />)}
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b"
                style={{ borderColor: '#DBE2EF' }}>
                <div>
                    <h1 className="text-4xl font-black tracking-tight" style={{ color: '#112D4E' }}>
                        My Recommendations
                    </h1>
                    <p className="text-lg mt-1.5 font-normal" style={{ color: '#2b4a70' }}>
                        Peers matched to your unique learning vector.
                    </p>
                </div>
                {user && (
                    <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border hover-lift"
                        style={{ borderColor: '#DBE2EF' }}>
                        <img src={user.imageUrl} alt={user.firstName || 'User'} className="w-9 h-9 rounded-xl" />
                        <div>
                            <p className="font-black text-sm leading-none" style={{ color: '#112D4E' }}>{user.firstName}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#6b84a0' }}>Active Learner</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Assessment banner */}
            {!recommendations.hasAssessment && (
                <div className="rounded-2xl p-6 flex flex-col md:flex-row gap-5 items-start md:items-center border"
                    style={{ background: 'linear-gradient(135deg, rgba(63,114,175,0.04), rgba(17,45,78,0.03))', borderColor: '#DBE2EF' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: '#DBE2EF' }}>
                        <Zap className="w-5 h-5" style={{ color: '#3F72AF' }} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-black" style={{ color: '#112D4E' }}>Unlock precise concept matching</h4>
                        <p className="mt-1 text-sm" style={{ color: '#2b4a70' }}>
                            Take a skill assessment to build your knowledge vector. Right now matches use onboarding preferences only.
                        </p>
                    </div>
                    <Link href="/app/assessments">
                        <Button className="rounded-xl h-11 px-6 font-black text-white border-0 hover:-translate-y-0.5 transition-all shrink-0"
                            style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)', boxShadow: '0 4px 14px rgba(63,114,175,0.3)' }}>
                            Take Assessment
                        </Button>
                    </Link>
                </div>
            )}

            {/* Peer cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.topPairs?.map((match: any, idx: number) => {
                    const score = Math.round((match.matchScore ?? 0) * 100);
                    const peer = match.user;
                    const scoreColor = score >= 75 ? '#4a8c42' : score >= 55 ? '#3F72AF' : '#D4974A';
                    const scoreBg    = score >= 75 ? '#ECFAE5'  : score >= 55 ? '#DBE2EF'  : '#FDF3C4';
                    const scoreBorder= score >= 75 ? '#CAE8BD'  : score >= 55 ? '#b8c8df'  : '#ECC880';
                    const barGrad    = score >= 75
                        ? 'linear-gradient(90deg,#4a8c42,#B0DB9C)'
                        : score >= 55
                        ? 'linear-gradient(90deg,#3F72AF,#112D4E)'
                        : 'linear-gradient(90deg,#D4974A,#ECC880)';

                    return (
                        <div key={idx} className="card-hover bg-white rounded-2xl border flex flex-col overflow-hidden"
                            style={{ borderColor: '#DBE2EF', boxShadow: '0 2px 12px rgba(17,45,78,0.06)' }}>
                            {/* score bar */}
                            <div className="h-1.5 w-full" style={{ background: barGrad }} />

                            {/* Card header */}
                            <div className="p-5 pb-0">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg text-white"
                                            style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                                            {peer.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-black" style={{ color: '#112D4E' }}>{peer.name || 'Anonymous'}</p>
                                            <p className="text-xs mt-0.5" style={{ color: '#6b84a0' }}>{peer.major || 'Computer Science'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black"
                                        style={{ background: scoreBg, color: scoreColor, border: `1px solid ${scoreBorder}` }}>
                                        <Star className="w-3 h-3 fill-current" />{score}%
                                    </div>
                                </div>
                            </div>

                            {/* Concept badges */}
                            <div className="p-5 space-y-4 flex-1">
                                {match.details?.peerStrongConcepts?.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"
                                            style={{ color: '#4a8c42' }}>
                                            <TrendingUp className="w-3 h-3" /> Strong in
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {match.details.peerStrongConcepts.map((c: string, i: number) => (
                                                <span key={i} className="text-xs px-2 py-1 rounded-md font-semibold"
                                                    style={{ background: '#ECFAE5', color: '#2d5a27', border: '1px solid #CAE8BD' }}>
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {match.details?.teachConcepts?.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"
                                            style={{ color: '#6d4fc7' }}>
                                            <BookOpen className="w-3 h-3" /> Can teach you
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {match.details.teachConcepts.map((c: string, i: number) => (
                                                <span key={i} className="text-xs px-2 py-1 rounded-md font-semibold"
                                                    style={{ background: '#ede9fe', color: '#4c3490', border: '1px solid #c4b5fd' }}>
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {match.details?.peerWeakConcepts?.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"
                                            style={{ color: '#D4974A' }}>
                                            <TrendingDown className="w-3 h-3" /> Developing
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {match.details.peerWeakConcepts.map((c: string, i: number) => (
                                                <span key={i} className="text-xs px-2 py-1 rounded-md font-semibold"
                                                    style={{ background: '#FDF3C4', color: '#9B6B30', border: '1px solid #ECC880' }}>
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!match.details?.peerStrongConcepts?.length && !match.details?.teachConcepts?.length && (
                                    <p className="text-xs italic" style={{ color: '#6b84a0' }}>
                                        Concept data will appear after this peer completes an assessment.
                                    </p>
                                )}

                                {(match.details?.sharedPrefReasons?.length > 0 || match.technicalComplementarity > 0.5) && (
                                    <div className="pt-3 border-t" style={{ borderColor: '#DBE2EF' }}>
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#6b84a0' }}>
                                            Why you match
                                        </p>
                                        <ul className="space-y-1">
                                            {match.details?.sharedPrefReasons?.map((r: string, i: number) => (
                                                <li key={i} className="flex items-center gap-2 text-xs" style={{ color: '#2b4a70' }}>
                                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#3F72AF' }} />
                                                    {r}
                                                </li>
                                            ))}
                                            {match.technicalComplementarity > 0.5 && (
                                                <li className="flex items-center gap-2 text-xs" style={{ color: '#2b4a70' }}>
                                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#6d4fc7' }} />
                                                    High concept complementarity
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: '#DBE2EF' }}>
                                {requestedIds.has(peer.id) ? (
                                    <Button onClick={() => handleWithdraw(peer.id)}
                                        className="w-full rounded-xl h-10 font-black text-sm border bg-white hover:bg-black/5"
                                        style={{ borderColor: '#DBE2EF', color: '#112D4E' }}>
                                        Withdraw Request
                                    </Button>
                                ) : (
                                    <Button onClick={() => handleConnect(peer.id)}
                                        className="w-full rounded-xl h-10 font-black text-white border-0 text-sm gap-2 hover:-translate-y-0.5 transition-all"
                                        style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)', boxShadow: '0 4px 12px rgba(63,114,175,0.3)' }}>
                                        <Users className="w-4 h-4" /> Connect
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {recommendations.topPairs?.length === 0 && (
                    <div className="col-span-full text-center p-16 bg-white rounded-2xl border"
                        style={{ borderColor: '#DBE2EF' }}>
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: '#3F72AF' }} />
                        <p className="font-black mb-1" style={{ color: '#112D4E' }}>No recommendations yet</p>
                        <p className="text-sm" style={{ color: '#6b84a0' }}>Complete an assessment to unlock concept-based matches.</p>
                    </div>
                )}
            </div>

            {/* Hubs section */}
            {recommendations.hubs?.length > 0 && (
                <>
                    <div className="flex items-end justify-between gap-4 pt-4 pb-6 border-b" style={{ borderColor: '#DBE2EF' }}>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight" style={{ color: '#112D4E' }}>Active Study Hubs</h2>
                            <p className="mt-1 font-normal" style={{ color: '#2b4a70' }}>Join aligned cohorts making progress together.</p>
                        </div>
                        <Link href="/app/community">
                            <Button variant="outline" className="rounded-xl gap-2 text-sm font-semibold"
                                style={{ borderColor: '#DBE2EF', color: '#112D4E' }}>
                                View All <Activity className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                        {recommendations.hubs.map((hub: any, idx: number) => (
                            <div key={idx} className="card-hover bg-white rounded-2xl border p-5 flex flex-col gap-4"
                                style={{ borderColor: '#DBE2EF', boxShadow: '0 2px 12px rgba(17,45,78,0.06)' }}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-black" style={{ color: '#112D4E' }}>{hub.name}</p>
                                        <p className="text-sm mt-0.5 flex items-center gap-1" style={{ color: '#6b84a0' }}>
                                            <Users className="w-3.5 h-3.5" /> {hub.memberCount} / 6 members
                                        </p>
                                    </div>
                                    <span className="text-xs font-black px-2.5 py-1 rounded-lg"
                                        style={hub.memberCount < 6
                                            ? { background: '#ECFAE5', color: '#2d5a27', border: '1px solid #CAE8BD' }
                                            : { background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}>
                                        {hub.memberCount < 6 ? 'Open' : 'Full'}
                                    </span>
                                </div>
                                <Link href="/app/community" className="w-full">
                                    <Button className="w-full rounded-xl h-10 font-semibold text-sm border bg-white hover:bg-black/5"
                                        style={{ borderColor: '#DBE2EF', color: '#112D4E' }}>
                                        Explore Hub
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </PageShell>
    );
}
