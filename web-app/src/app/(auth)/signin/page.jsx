'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SigninPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      window.location.href = '/dashboard/recruiter';

      // router.refresh();
      // router.push('/dashboard/recruiter');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Sign In</h2>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
