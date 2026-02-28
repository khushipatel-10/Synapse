"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export default function AssessmentsIndexPage() {
    const { getToken, isLoaded } = useAuth();
    const router = useRouter();
    const [assessments, setAssessments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAssessments() {
            if (!isLoaded) return;
            try {
                const token = await getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/assessments`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setAssessments(data.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchAssessments();
    }, [isLoaded, getToken]);

    if (loading) {
        return (
            <PageShell showBlobs={false}>
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white text-charcoal mb-6 shadow-[0_4px_14px_rgba(0,0,0,0.04)] border border-black/5">
                    <Sparkles className="w-8 h-8 opacity-80 text-brand-teal" />
                </div>
                <h1 className="text-4xl font-semibold text-charcoal tracking-tight">Diagnostic Assessments</h1>
                <p className="text-muted-dark mt-3 text-lg max-w-2xl mx-auto font-normal">
                    Take these skill assessments to earn your knowledge vector. Our algorithm uses this data to find your perfect complementary study partner.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.map((ast) => (
                    <Card
                        key={ast.id}
                        onClick={() => router.push(`/app/assessments/${ast.id}`)}
                        className="cursor-pointer hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-300 border border-black/5 group relative overflow-hidden flex flex-col justify-between bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-2xl"
                    >
                        <div className="h-1 w-full bg-black/5 absolute top-0 left-0 transition-colors group-hover:bg-brand-lavender" />
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Sparkles className="w-24 h-24 transform rotate-12 text-charcoal" />
                        </div>
                        <CardHeader className="relative z-10 pt-6">
                            <div className="text-xs font-semibold tracking-wider text-muted-gray uppercase mb-2">{ast.subject.replace('-', ' ')}</div>
                            <CardTitle className="text-xl group-hover:text-brand-lavender transition-colors text-charcoal">{ast.title}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-2 leading-relaxed text-muted-dark font-normal">{ast.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10 pt-4 border-t border-black/5 mt-auto flex justify-between items-center text-sm font-medium text-muted-gray group-hover:text-brand-lavender transition-colors">
                            <span>Start Diagnostic</span>
                            <ArrowRight className="w-4 h-4" />
                        </CardContent>
                    </Card>
                ))}
                {assessments.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center p-16 bg-white rounded-2xl border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] flex flex-col items-center">
                        <p className="text-muted-dark max-w-md mx-auto mb-4 font-normal">No active assessments available at this time. Please check back when new modules are published.</p>
                        <Button variant="outline" className="bg-white text-charcoal border border-black/10 hover:bg-black/5 rounded-xl transition-all" onClick={() => window.location.reload()}>
                            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                        </Button>
                    </div>
                )}
            </div>
        </PageShell>
    );
}
