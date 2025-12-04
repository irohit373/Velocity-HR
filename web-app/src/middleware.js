import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request) {
    const token = request.cookies.get('auth-token')?.value;
    const { pathname } = request.nextUrl;

    console.log('Middleware - Path:', pathname, 'Has Token:', !!token);

    // Redirect /dashboard to /dashboard/recruitment
    if (pathname === '/dashboard') {
        console.log('Redirecting /dashboard to /dashboard/recruitment');
        return NextResponse.redirect(new URL('/dashboard/recruitment', request.url));
    }

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
        if (!token) {
            console.log('No token, redirecting to /signin');
            return NextResponse.redirect(new URL('/signin', request.url));
        }

        const decoded = await verifyToken(token); // await needed for jose
        if (!decoded) {
            console.log('Invalid token, redirecting to /signin');
            return NextResponse.redirect(new URL('/signin', request.url));
        }

        console.log('Token valid, allowing access to:', pathname);
    }

    // Redirect authenticated users away from signin/signup
    if (pathname === '/signin' || pathname === '/signup') {
        if (token) {
            const decoded = await verifyToken(token); // await needed
            if (decoded) {
                console.log('Already authenticated, redirecting to /dashboard/recruitment');
                return NextResponse.redirect(new URL('/dashboard/recruitment', request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/signin', '/signup'],
};

