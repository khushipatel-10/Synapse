"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/context/NotificationsContext";
import { Users, LayoutGrid, BookOpen, Sparkles, MessageCircle, Star } from "lucide-react";

const MOBILE_LINKS = [
    { href: "/app/recommendations", label: "Matches",     Icon: Star },
    { href: "/app/assessments",     label: "Assess",      Icon: BookOpen },
    { href: "/app/community",       label: "Community",   Icon: LayoutGrid },
    { href: "/app/connections",     label: "Connect",     Icon: Users,         badge: "connections" },
    { href: "/app/messages",        label: "Messages",    Icon: MessageCircle, badge: "messages" },
    { href: "/app/learn",           label: "AI Coach",    Icon: Sparkles },
];

function NavBadge({ count }: { count: number }) {
    if (count === 0) return null;
    return (
        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none ring-2 ring-white"
            style={{ background: '#be123c' }}>
            {count > 9 ? "9+" : count}
        </span>
    );
}

interface NavLink { href: string; label: string; badge?: string; hideMd?: boolean }

const NAV_LINKS: NavLink[] = [
    { href: "/app/recommendations", label: "Matches" },
    { href: "/app/community",       label: "Community" },
    { href: "/app/assessments",     label: "Assessments" },
    { href: "/app/learn",           label: "AI Coach" },
    { href: "/app/connections",     label: "Connections", badge: "connections" },
    { href: "/app/messages",        label: "Messages",    badge: "messages" },
    { href: "/app/profile",         label: "Profile",     hideMd: true },
];

export default function NavBar() {
    const pathname = usePathname();
    const { pendingConnections, unreadMessages } = useNotifications();

    const badgeCounts: Record<string, number> = {
        connections: pendingConnections,
        messages: unreadMessages,
    };

    return (
        <>
        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 border-t"
            style={{ background: 'rgba(249,247,247,0.98)', backdropFilter: 'blur(14px)', borderColor: '#DBE2EF' }}>
            {MOBILE_LINKS.map(({ href, label, Icon, badge }) => {
                const active = pathname.startsWith(href);
                const count = badge ? (badgeCounts[badge] ?? 0) : 0;
                return (
                    <Link key={href} href={href}
                        className="relative flex flex-col items-center gap-0.5 px-2 py-1"
                        style={{ color: active ? '#3F72AF' : '#6b84a0' }}>
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-semibold">{label}</span>
                        {count > 0 && (
                            <span className="absolute -top-0.5 right-0.5 min-w-[14px] h-3.5 px-1 text-white text-[8px] font-black rounded-full flex items-center justify-center"
                                style={{ background: '#be123c' }}>
                                {count > 9 ? '9+' : count}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>

        <nav className="sticky top-0 z-40 w-full"
            style={{
                background: 'rgba(249,247,247,0.96)',
                backdropFilter: 'blur(14px)',
                borderBottom: '1px solid #DBE2EF',
                boxShadow: '0 1px 0 rgba(63,114,175,0.06), 0 2px 8px rgba(17,45,78,0.04)'
            }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center" style={{ height: '60px' }}>

                    <Link href="/" className="font-black text-[22px] tracking-tight transition-opacity hover:opacity-75"
                        style={{ color: '#112D4E' }}>
                        Synapse.
                    </Link>

                    <div className="hidden md:flex items-center gap-0.5">
                        {NAV_LINKS.map(({ href, label, badge, hideMd }) => {
                            const active = pathname.startsWith(href);
                            const count = badge ? (badgeCounts[badge] ?? 0) : 0;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`relative px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${hideMd ? 'md:hidden lg:flex' : ''}`}
                                    style={active ? {
                                        background: '#DBE2EF',
                                        color: '#3F72AF',
                                    } : {
                                        color: '#6b84a0',
                                    }}
                                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#112D4E'; }}
                                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#6b84a0'; }}
                                >
                                    {label}
                                    <NavBadge count={count} />
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="h-5 w-px hidden sm:block" style={{ background: '#DBE2EF' }} />
                        <UserButton
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "w-8 h-8 rounded-lg shadow-sm border border-black/8 hover:shadow-md transition-shadow"
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </nav>
        </>
    );
}
