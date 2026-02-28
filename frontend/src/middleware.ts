import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
    // If not public and not authenticated, this throws and redirects to sign-in
    if (!isPublicRoute(req)) {
        await auth.protect();
    }

    // The actual redirect login (/onboarding vs /recommendations) is handled inside 
    // the src/app/app/page.tsx interceptor when an authenticated user hits the /app root.
    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
