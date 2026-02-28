import { ReactNode } from "react";
import NavBar from "@/components/NavBar";

// App shell layout for authenticated users
export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen w-full bg-transparent">
            <NavBar />

            {/* The main workspace pushes down from the nav, rendering the specific page which will manage its own PageShell */}
            <main className="flex-1 w-full flex flex-col">
                {children}
            </main>
        </div>
    );
}
