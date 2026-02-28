"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, TrendingDown, Layers, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export default function AssessmentResultsPage() {
    const router = useRouter();
    const [results, setResults] = useState<any>(null);

    useEffect(() => {
        const data = sessionStorage.getItem('lastAssessmentResult');
        if (data) {
            // eslint-disable-next-line 
            setResults(JSON.parse(data));
        } else {
            router.push('/app/recommendations');
        }
    }, [router]);

    if (!results) return null;

    return (
        <PageShell>
            <div className="max-w-3xl mx-auto w-full space-y-8 animate-in slide-in-from-bottom-4 duration-700 relative z-10">
                <div className="text-center space-y-4 mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white text-brand-teal mb-2 shadow-[0_4px_14px_rgba(0,0,0,0.04)] border border-black/5">
                        <Target className="w-10 h-10 opacity-80" />
                    </div>
                    <h1 className="text-4xl font-semibold text-charcoal tracking-tight">Diagnosis Complete</h1>
                    <p className="text-lg text-muted-dark max-w-xl mx-auto font-normal">
                        Your knowledge vector has been successfully computed. Our algorithmic engine has reindexed your profile based on real demonstrated mastery.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-1 text-center bg-white border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col justify-center py-8 rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-muted-gray uppercase tracking-widest font-semibold text-xs">Overall Mastery Score</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col justify-center">
                            <div className="text-6xl font-black text-brand-teal">{Math.round(results.score)}%</div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2 border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] bg-white rounded-2xl">
                        <div className="h-1 w-full bg-black/5 rounded-t-2xl" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-charcoal">
                                <Layers className="w-5 h-5 text-brand-teal" /> Concept Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-gray uppercase tracking-wider mb-3">
                                    <TrendingUp className="w-4 h-4 text-brand-teal" /> Operational Strengths
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {results.strengths?.length > 0 ? results.strengths.map((s: string) => (
                                        <span key={s} className="bg-brand-mint/20 text-brand-teal border border-brand-teal/30 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
                                            {s}
                                        </span>
                                    )) : <span className="text-muted-gray font-normal text-sm">Insufficient data to identify strengths.</span>}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-black/5">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-gray uppercase tracking-wider mb-3">
                                    <TrendingDown className="w-4 h-4 text-brand-amber" /> Development Areas
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {results.weaknesses?.length > 0 ? results.weaknesses.map((w: string) => (
                                        <span key={w} className="bg-brand-amber/10 text-brand-amber border border-brand-amber/30 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
                                            {w}
                                        </span>
                                    )) : <span className="text-muted-gray font-normal text-sm">No significant developmental gaps detected!</span>}
                                </div>
                                {results.weaknesses?.length > 0 && (
                                    <div className="mt-4 bg-white border border-black/5 shadow-sm p-4 rounded-xl">
                                        <p className="text-sm text-muted-dark leading-relaxed font-normal">
                                            <strong className="text-charcoal block mb-1">Algorithmic Recommendation:</strong>
                                            Our matching model is now prioritizing peers who excel in
                                            <span className="font-semibold text-brand-amber"> {results.weaknesses[0]} </span>
                                            to provide structural complementarity to your learning phase.
                                        </p>
                                    </div>
                                )}
                            </div>

                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-center pt-8">
                    <Button size="lg" className="w-full md:w-auto h-14 px-8 text-lg rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-0.5 bg-charcoal hover:bg-charcoal/90 text-white font-medium border-0" onClick={() => router.push('/app/recommendations')}>
                        View New Vectors & Matches <ArrowRight className="w-5 h-5 ml-2 text-white/70" />
                    </Button>
                </div>
            </div>
        </PageShell>
    );
}
