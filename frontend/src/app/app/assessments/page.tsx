"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, RefreshCw, BookOpen, Clock, Target, Brain, Zap, Database, Cpu, BarChart2, Layers, Network } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

// Subject → visual identity using the new palette
const SUBJECT_STYLES: Record<string, {
    gradient: string; accentColor: string; bgColor: string; borderColor: string;
    iconBg: string; tagBg: string; tagColor: string; label: string;
}> = {
    // Actual seed subjects
    "dsa": {
        gradient: "linear-gradient(135deg, #3F72AF, #112D4E)",
        accentColor: "#3F72AF", bgColor: "#DBE2EF", borderColor: "#b8c8df",
        iconBg: "#f0f4fa", tagBg: "#DBE2EF", tagColor: "#112D4E",
        label: "DSA",
    },
    "machine-learning": {
        gradient: "linear-gradient(135deg, #6d4fc7, #4c3490)",
        accentColor: "#6d4fc7", bgColor: "#ede9fe", borderColor: "#c4b5fd",
        iconBg: "#f5f3ff", tagBg: "#ede9fe", tagColor: "#4c3490",
        label: "Machine Learning",
    },
    "mathematics": {
        gradient: "linear-gradient(135deg, #4a8c42, #2d5a27)",
        accentColor: "#4a8c42", bgColor: "#CAE8BD", borderColor: "#a3d49a",
        iconBg: "#f2faf0", tagBg: "#ECFAE5", tagColor: "#2d5a27",
        label: "Mathematics",
    },
    "database-systems": {
        gradient: "linear-gradient(135deg, #0e7490, #0c5d73)",
        accentColor: "#0e7490", bgColor: "#cffafe", borderColor: "#a5f3fc",
        iconBg: "#f0fdfe", tagBg: "#cffafe", tagColor: "#0c5d73",
        label: "Database Systems",
    },
    "operating-systems": {
        gradient: "linear-gradient(135deg, #be185d, #9d1052)",
        accentColor: "#be185d", bgColor: "#fce7f3", borderColor: "#f9a8d4",
        iconBg: "#fff0f8", tagBg: "#fce7f3", tagColor: "#9d1052",
        label: "Operating Systems",
    },
    "statistics": {
        gradient: "linear-gradient(135deg, #D4974A, #9B6B30)",
        accentColor: "#D4974A", bgColor: "#FDF3C4", borderColor: "#ECC880",
        iconBg: "#fdf8ee", tagBg: "#FDF3C4", tagColor: "#9B6B30",
        label: "Statistics",
    },
    "oop": {
        gradient: "linear-gradient(135deg, #0f766e, #0d6860)",
        accentColor: "#0f766e", bgColor: "#ccfbf1", borderColor: "#99f6e4",
        iconBg: "#f0fdfb", tagBg: "#ccfbf1", tagColor: "#0d6860",
        label: "OOP",
    },
    "system-design": {
        gradient: "linear-gradient(135deg, #112D4E, #1e3f6b)",
        accentColor: "#112D4E", bgColor: "#DBE2EF", borderColor: "#b8c8df",
        iconBg: "#e8edf5", tagBg: "#DBE2EF", tagColor: "#112D4E",
        label: "System Design",
    },
    // Fallbacks for other naming conventions
    "computer-science": {
        gradient: "linear-gradient(135deg, #3F72AF, #112D4E)",
        accentColor: "#3F72AF", bgColor: "#DBE2EF", borderColor: "#b8c8df",
        iconBg: "#f0f4fa", tagBg: "#DBE2EF", tagColor: "#112D4E",
        label: "Computer Science",
    },
    "data-structures": {
        gradient: "linear-gradient(135deg, #3F72AF, #112D4E)",
        accentColor: "#3F72AF", bgColor: "#DBE2EF", borderColor: "#b8c8df",
        iconBg: "#f0f4fa", tagBg: "#DBE2EF", tagColor: "#112D4E",
        label: "Data Structures",
    },
    "algorithms": {
        gradient: "linear-gradient(135deg, #112D4E, #1e3f6b)",
        accentColor: "#112D4E", bgColor: "#DBE2EF", borderColor: "#b8c8df",
        iconBg: "#e8edf5", tagBg: "#DBE2EF", tagColor: "#112D4E",
        label: "Algorithms",
    },
    "physics": {
        gradient: "linear-gradient(135deg, #D4974A, #9B6B30)",
        accentColor: "#D4974A", bgColor: "#FDF3C4", borderColor: "#ECC880",
        iconBg: "#fdf8ee", tagBg: "#FDF3C4", tagColor: "#9B6B30",
        label: "Physics",
    },
    "data-science": {
        gradient: "linear-gradient(135deg, #6d4fc7, #4c3490)",
        accentColor: "#6d4fc7", bgColor: "#ede9fe", borderColor: "#c4b5fd",
        iconBg: "#f5f3ff", tagBg: "#ede9fe", tagColor: "#4c3490",
        label: "Data Science",
    },
    default: {
        gradient: "linear-gradient(135deg, #3F72AF, #112D4E)",
        accentColor: "#3F72AF", bgColor: "#DBE2EF", borderColor: "#b8c8df",
        iconBg: "#f0f4fa", tagBg: "#DBE2EF", tagColor: "#112D4E",
        label: "General",
    },
};

function getStyle(subject: string) {
    if (!subject) return SUBJECT_STYLES.default;
    const key = subject.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
    return SUBJECT_STYLES[key] ?? SUBJECT_STYLES.default;
}

const SUBJECT_ICONS: Record<string, React.ComponentType<any>> = {
    "dsa":              Zap,
    "machine-learning": Brain,
    "mathematics":      Target,
    "database-systems": Database,
    "operating-systems": Cpu,
    "statistics":       BarChart2,
    "oop":              Layers,
    "system-design":    Network,
    "computer-science": Brain,
    "data-structures":  Brain,
    "algorithms":       Zap,
    "physics":          Zap,
    "data-science":     Brain,
    default:            BookOpen,
};

function getIcon(subject: string) {
    const key = subject?.toLowerCase().replace(/\s+/g, '-') ?? '';
    return SUBJECT_ICONS[key] ?? SUBJECT_ICONS.default;
}

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
                if (data.success) setAssessments(data.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        fetchAssessments();
    }, [isLoaded, getToken]);

    if (loading) {
        return (
            <PageShell>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20">
                    {[0,1,2].map(i => <div key={i} className="h-60 rounded-2xl skeleton" />)}
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            {/* Page header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5 tracking-wider uppercase"
                    style={{ background: '#DBE2EF', color: '#3F72AF', border: '1px solid #b8c8df' }}>
                    <Target className="w-3.5 h-3.5" /> Knowledge Diagnostics
                </div>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: '#112D4E' }}>
                    Skill Assessments
                </h1>
                <p className="mt-3 text-lg max-w-2xl mx-auto font-normal leading-relaxed" style={{ color: '#2b4a70' }}>
                    Complete these diagnostics to build your <span className="font-bold" style={{ color: '#3F72AF' }}>knowledge vector</span> — the engine that finds your ideal study partner.
                </p>

                <div className="flex flex-wrap justify-center gap-4 mt-7">
                    {[
                        { icon: BookOpen, color: '#3F72AF', bg: '#DBE2EF', text: "Answer concept questions" },
                        { icon: Brain,    color: '#D4974A', bg: '#FDF3C4', text: "AI scores your mastery" },
                        { icon: Target,   color: '#4a8c42', bg: '#ECFAE5', text: "Get matched to ideal peers" },
                    ].map(({ icon: Icon, color, bg, text }) => (
                        <div key={text} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border"
                            style={{ background: 'white', borderColor: '#DBE2EF', color: '#112D4E' }}>
                            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: bg }}>
                                <Icon className="w-3.5 h-3.5" style={{ color }} />
                            </div>
                            {text}
                        </div>
                    ))}
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.map((ast, idx) => {
                    const style = getStyle(ast.subject);
                    const Icon = getIcon(ast.subject);
                    const questionCount = ast._count?.questions ?? ast.questions?.length ?? '—';

                    return (
                        <div
                            key={ast.id}
                            onClick={() => router.push(`/app/assessments/${ast.id}`)}
                            className="card-hover cursor-pointer bg-white rounded-2xl overflow-hidden flex flex-col group"
                            style={{
                                border: `1px solid ${style.borderColor}`,
                                boxShadow: '0 2px 12px rgba(17,45,78,0.06)',
                            }}
                        >
                            {/* Gradient header strip */}
                            <div className="h-2 w-full" style={{ background: style.gradient }} />

                            <div className="p-6 flex-1 flex flex-col">
                                {/* Row: tag + meta */}
                                <div className="flex items-center justify-between mb-5">
                                    <span className="text-[11px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg"
                                        style={{ background: style.tagBg, color: style.tagColor }}>
                                        {style.label}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: '#6b84a0' }}>
                                        <Clock className="w-3.5 h-3.5" />
                                        {questionCount} questions
                                    </div>
                                </div>

                                {/* Icon + title */}
                                <div className="flex items-start gap-4 mb-3">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                                        style={{ background: style.bgColor }}>
                                        <Icon className="w-5 h-5" style={{ color: style.accentColor }} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black leading-tight group-hover:opacity-80 transition-opacity"
                                            style={{ color: '#112D4E' }}>
                                            {ast.title}
                                        </h3>
                                        <p className="text-sm mt-1.5 leading-relaxed line-clamp-2"
                                            style={{ color: '#6b84a0' }}>
                                            {ast.description}
                                        </p>
                                    </div>
                                </div>

                                {/* CTA row */}
                                <div className="mt-auto pt-5 border-t flex items-center justify-between"
                                    style={{ borderColor: style.borderColor }}>
                                    <span className="text-sm font-bold" style={{ color: style.accentColor }}>
                                        Begin diagnostic
                                    </span>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1"
                                        style={{ background: style.bgColor, color: style.accentColor }}>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {assessments.length === 0 && (
                    <div className="col-span-full text-center p-16 bg-white rounded-2xl border flex flex-col items-center"
                        style={{ borderColor: '#DBE2EF' }}>
                        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: '#DBE2EF' }}>
                            <BookOpen className="w-7 h-7" style={{ color: '#3F72AF' }} />
                        </div>
                        <p className="font-black mb-1" style={{ color: '#112D4E' }}>No assessments available</p>
                        <p className="text-sm mb-5" style={{ color: '#6b84a0' }}>Check back when new modules are published.</p>
                        <Button variant="outline" className="rounded-xl" onClick={() => window.location.reload()}>
                            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                        </Button>
                    </div>
                )}
            </div>
        </PageShell>
    );
}
