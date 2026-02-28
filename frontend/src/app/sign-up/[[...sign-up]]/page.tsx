import { SignUp } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] pt-8 pb-16">
            <div className="bg-white p-8 rounded-2xl shadow-xl shadow-teal-900/5 ring-1 ring-gray-100 max-w-md w-full animate-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Join Synapse</h1>
                    <p className="text-gray-500 mt-2 text-sm">Create an account to unlock algorithmic matching and diagnostic assessments.</p>
                </div>
                <SignUp
                    appearance={{
                        elements: {
                            rootBox: "mx-auto w-full",
                            card: "shadow-none p-0 bg-transparent"
                        }
                    }}
                    afterSignUpUrl="/app"
                    redirectUrl="/app"
                />
            </div>
        </div>
    );
}
