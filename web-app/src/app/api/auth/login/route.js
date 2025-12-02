import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if(!email || !password) {
            return NextResponse.json(
                {error: 'Email and Password are required'},
                { status: 400}
            );
        }

        const users = await sql`
            SELECT id, email, password, name FROM hrs WHERE email = ${email}
        `;

        if (users.length === 0) {
            return NextResponse.json(
                { error: 'Invalid Credentials'},
                { status: 401 }
            );
        }

        const user = users[0];

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials'},
                { status: 401 }
            );
        }

        // generateToken is now async with jose
        const token = await generateToken(user.id, user.email);
        
        // Create response with user data
        const response = NextResponse.json({
            user: { id: user.id, email: user.email, name: user.name },
        });

        // Set cookie on the response
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
        
    } catch (error) {
        console.error('Login error: ', error);
        return NextResponse.json(
            { error: 'Internal Server error'},
            { status: 500}
        );
    }
}