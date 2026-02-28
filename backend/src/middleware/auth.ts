import { clerkMiddleware, requireAuth } from '@clerk/express';

// Exporting the configured middleware
export const authMiddleware = clerkMiddleware();
export const requireClerkAuth = requireAuth();
