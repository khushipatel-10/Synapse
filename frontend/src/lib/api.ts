import { auth } from '@clerk/nextjs/server';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
        throw new Error("Unauthorized fetching attempt");
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url = `${baseUrl}${endpoint}`;

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    // If method has body and no content-type is set, default to json
    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(url, {
        ...options,
        headers
    });

    return res;
}
