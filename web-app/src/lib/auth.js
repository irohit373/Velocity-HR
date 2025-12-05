import { SignJWT, jwtVerify } from 'jose';
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

// Set authentication cookie
export async function setAuthCookie(token) {
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });
}

// Password hashing using Web Crypto API (Edge Runtime compatible)
export async function verifyPassword(password, hashedPassword) {
    // Check if it's a bcrypt hash (legacy format)
    if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$')) {
        // For bcrypt hashes, we need bcryptjs
        // Import dynamically to avoid Edge Runtime issues in other parts
        const bcrypt = await import('bcryptjs');
        return bcrypt.default.compare(password, hashedPassword);
    }
    
    // New PBKDF2 format: salt:hash
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    
    const [saltHex, hashHex] = hashedPassword.split(':');
    
    // Validate format
    if (!saltHex || !hashHex) {
        throw new Error('Invalid password hash format');
    }
    
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const storedHash = new Uint8Array(hashHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passwordKey,
        256
    );
    
    const derivedHash = new Uint8Array(derivedBits);
    
    // Constant-time comparison
    if (derivedHash.length !== storedHash.length) return false;
    let result = 0;
    for (let i = 0; i < derivedHash.length; i++) {
        result |= derivedHash[i] ^ storedHash[i];
    }
    return result === 0;
}

export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passwordKey,
        256
    );
    
    const hash = new Uint8Array(derivedBits);
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const hashHex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `${saltHex}:${hashHex}`;
}

