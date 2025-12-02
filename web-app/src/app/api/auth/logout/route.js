import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth';

export async function POST() {
    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    response.cookies.delete('auth-token');

    return response;
}