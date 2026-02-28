"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Star, Users, Loader2 } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export default function RecommendationsPage() {
    const { getToken, isLoaded } = useAuth();
    const { user } = useUser();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setRecommendations(data.data);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchRecs();
    }, [isLoaded, getToken]);

    const handleConnect = async (receiverId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/connections/request`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    receiverId,
                    courseId: '15d92016-00f7-4fe7-b423-6ced0b269793'
                })
            });
            if (res.ok) {
                setRequestedIds(prev => new Set(prev).add(receiverId));
            } else {
                alert("Failed to send connection request.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleWithdraw = async (receiverId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/connections/request/withdraw`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ receiverId })
            });
            if (res.ok) {
                setRequestedIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(receiverId);
                    return newSet;
                });
            } else {
                alert("Failed to withdraw connection request.");
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

    return (
        <PageShell>
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-lavender/20 pb-6">
                <div>
                    <h1 className="text-4xl font-semibold text-charcoal tracking-tight">
                        My Recommendations
                    </h1>
                    <p className="text-lg text-muted-dark mt-2 font-normal">
                        Personalized study partners matched to your unique learning profile.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full border border-black/5 shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition-transform hover:-translate-y-0.5">
                    <img src={user?.imageUrl} alt="Profile" className="w-10 h-10 rounded-full border border-black/5" />
                    <div className="text-sm">
                        <p className="font-semibold text-charcoal leading-none">{user?.firstName}</p>
                        <p className="text-muted-gray text-xs mt-1">Active Learner</p>
                    </div>
                </div>
            </div>

            {/* Assessment Call-To-Action Banner */}
            {!recommendations.hasAssessment && (
                <div className="bg-white border border-black/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm text-brand-lavender border border-black/5">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-charcoal text-lg">Optimize Your Matches</h4>
                        <p className="text-muted-dark mt-1 font-normal">Take your first skill assessment to unlock highly accurate concept-complementarity matching. Right now, matches are based primarily on your onboarding preferences.</p>
                    </div>
                    <Link href="/app/assessments">
                        <Button className="bg-charcoal hover:bg-charcoal/90 text-white font-medium shadow-[0_4px_14px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-0.5 border-0 shrink-0 h-12 px-6 rounded-xl">
                            Take Diagnostic Assessment
                        </Button>
                    </Link>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.topPairs && recommendations.topPairs.length > 0 && recommendations.topPairs.map((match: any, idx: number) => {
                    const scorePercentage = Math.round(match.matchScore * 100) || 0;
                    const peer = match.user;

                    return (
                        <Card key={idx} className="hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-2xl">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white shadow-sm rounded-full flex items-center justify-center text-charcoal font-semibold text-lg border border-black/5">
                                            {peer.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold text-charcoal">{peer.name || 'Anonymous Learner'}</CardTitle>
                                            <CardDescription className="text-muted-gray">{peer.major || 'Computer Science'}</CardDescription>
                                        </div>
                                    </div>
                                    <div className="bg-amber-100/50 text-charcoal border border-amber-500/20 rounded-lg px-2 py-1.5 text-xs font-semibold flex items-center gap-1 shadow-sm">
                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                        {scorePercentage}%
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5 flex-1">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-muted-gray uppercase tracking-wider flex items-center gap-2">
                                        Why you match
                                    </h4>
                                    <ul className="text-sm text-muted-dark space-y-2 font-normal">
                                        {match.sharedPreferences?.mode && (
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-brand-teal"></span> Shared study modality
                                            </li>
                                        )}
                                        {match.sharedPreferences?.pace && (
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-brand-teal"></span> Aligned learning velocity
                                            </li>
                                        )}
                                        {match.technicalComplementarity > 0.5 && (
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-brand-lavender"></span> High concept complementarity
                                            </li>
                                        )}
                                        {match.vectorSimilarity > 0.7 && (
                                            <li className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-brand-lavender"></span> Similar vector space profile
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                {match.details?.missingConcepts && match.details.missingConcepts.length > 0 && (
                                    <div className="pt-3 border-t border-brand-lavender/20">
                                        <h4 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-3">They can teach you</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {match.details.missingConcepts
                                                .filter((concept: any) => concept.helper === peer.id)
                                                .slice(0, 3)
                                                .map((concept: any, cidx: number) => (
                                                    <span key={cidx} className="bg-white text-muted-dark font-medium text-xs px-2.5 py-1 rounded-md border border-black/5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                                        {concept.concept}
                                                    </span>
                                                ))}
                                            {match.details.missingConcepts.filter((c: any) => c.helper === peer.id).length === 0 && (
                                                <span className="text-xs text-muted-gray italic">No severe gaps identified yet</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </CardContent>
                            <CardFooter className="flex gap-3 pt-4 border-t border-black/5 bg-white rounded-b-2xl">
                                {requestedIds.has(peer.id) ? (
                                    <Button onClick={() => handleWithdraw(peer.id)} className="flex-1 w-full gap-2 shadow-sm font-medium bg-black/5 text-charcoal border-transparent hover:bg-black/10">
                                        Withdraw Request
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => handleConnect(peer.id)}
                                        className="flex-1 w-full gap-2 shadow-[0_4px_14px_rgba(0,0,0,0.08)] font-medium transition-transform hover:-translate-y-0.5 bg-brand-teal border border-transparent text-white hover:bg-brand-teal/90"
                                    >
                                        <Users className="w-4 h-4" /> Connect
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    )
                })}
                {/* Empty State */}
                {recommendations.topPairs && recommendations.topPairs.length === 0 && !loading && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center p-16 bg-white rounded-2xl border border-black/5 mt-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                        <p className="text-muted-dark max-w-md mx-auto font-normal">No recommended peers yet. Keep taking assessments and check back later.</p>
                    </div>
                )}
            </div>

            {/* Hubs Section */}
            <div className="mt-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-teal/20 pb-6">
                <div>
                    <h2 className="text-3xl font-semibold text-charcoal tracking-tight">Active Community Hubs</h2>
                    <p className="text-lg text-muted-dark mt-2 font-normal">Join highly aligned cohorts currently making progress in this course.</p>
                </div>
                <Link href="/app/community">
                    <Button variant="outline" className="gap-2 rounded-full border-black/10 text-charcoal hover:bg-black/5 hover:text-charcoal transition-all">
                        View All Hubs <Activity className="w-4 h-4" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 mb-12">
                {recommendations.hubs && recommendations.hubs.length > 0 && recommendations.hubs.map((hub: any, idx: number) => (
                    <Card key={idx} className="hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-2xl">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl font-semibold text-charcoal">{hub.name}</CardTitle>
                                    <CardDescription className="text-muted-gray mt-1 flex items-center gap-1.5 font-medium">
                                        <Users className="w-4 h-4 text-brand-teal" /> {hub.memberCount} / 6 Members
                                    </CardDescription>
                                </div>
                                <div className="bg-brand-mint border border-brand-mint/50 rounded-lg px-2 py-1 text-xs font-semibold text-charcoal shadow-sm uppercase tracking-wider">
                                    {hub.memberCount < 6 ? 'Open' : 'Full'}
                                </div>
                            </div>
                        </CardHeader>
                        <CardFooter className="pt-4 border-t border-black/5 bg-white rounded-b-2xl">
                            <Link href={`/app/community`} className="w-full">
                                <Button className="w-full shadow-sm font-medium transition-transform hover:-translate-y-0.5 bg-white border border-black/10 text-charcoal hover:bg-black/5">
                                    Explore Hub Details
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}

                {recommendations.hubs && recommendations.hubs.length === 0 && !loading && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center p-16 bg-white rounded-2xl border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                        <p className="text-muted-dark max-w-md mx-auto font-normal">There are no active hubs for this course right now.</p>
                    </div>
                )}
            </div>
        </PageShell>
    );
}
