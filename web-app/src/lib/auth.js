import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// Generate JWT token
export async function generateToken(userId, email) {
    const token = await new SignJWT({ userId, email })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .setIssuedAt()
        .sign(JWT_SECRET);
    
    return token;
}

// Verify JWT token (Edge Runtime compatible)
export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return null;
    }
}

export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        
        if (!token) {
            return null;
        }

        const decoded = await verifyToken(token);
        return decoded;
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
}

export async function verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

export async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

