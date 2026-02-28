"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export default function NavBar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname.startsWith(path);

    const linkBase = "text-sm font-medium transition-colors hover:underline underline-offset-4 decoration-[1.5px]";
    const linkActive = "text-brand-deep-purple decoration-brand-deep-purple/30";
    const linkInactive = "text-muted-gray hover:text-charcoal decoration-transparent hover:decoration-black/10";

    return (
        <nav className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-black/5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center group">
                        <span className="font-bold text-2xl tracking-tighter text-charcoal hover:text-brand-deep-purple transition-colors duration-300">
                            Synapse.
                        </span>
                    </Link>

                    {/* Links */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/app/recommendations" className={`${linkBase} ${isActive('/app/recommendations') ? linkActive : linkInactive}`}>
                            Recommendations
                        </Link>
                        <Link href="/app/community" className={`${linkBase} ${isActive('/app/community') ? linkActive : linkInactive}`}>
                            Community
                        </Link>
                        <Link href="/app/assessments" className={`${linkBase} ${isActive('/app/assessments') ? linkActive : linkInactive}`}>
                            Assessments
                        </Link>
                        <Link href="/app/learn" className={`${linkBase} ${isActive('/app/learn') ? linkActive : linkInactive}`}>
                            AI Coach
                        </Link>
                        <Link href="/app/connections" className={`${linkBase} ${isActive('/app/connections') ? linkActive : linkInactive}`}>
                            Connections
                        </Link>
                        <Link href="/app/messages" className={`${linkBase} ${isActive('/app/messages') ? linkActive : linkInactive}`}>
                            Messages
                        </Link>
                        <Link href="/app/profile" className={`${linkBase} ${isActive('/app/profile') ? linkActive : linkInactive} md:hidden lg:block`}>
                            Profile
                        </Link>
                    </div>

                    {/* Profile */}
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "w-8 h-8 rounded-lg shadow-sm border border-slate-200"
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </nav>
    );
}
