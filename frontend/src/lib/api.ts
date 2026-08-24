import axios from 'axios';

// Use relative /api endpoint so Next.js proxy rewrites it to http://localhost:3001 seamlessly
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isAuthenticating = false;

async function getDevToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const existing = localStorage.getItem('sentinel_token');
  if (existing) return existing;

  if (isAuthenticating) return null;
  isAuthenticating = true;

  try {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@sentinelai.io',
      password: 'AdminPass123!',
    });

    if (res.data?.success && res.data?.data?.accessToken) {
      const token = res.data.data.accessToken;
      localStorage.setItem('sentinel_token', token);
      return token;
    }
  } catch (err) {
    console.warn('Dev auto-login failed:', err);
  } finally {
    isAuthenticating = false;
  }
  return null;
}

api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('sentinel_token');
    if (!token) {
      token = await getDevToken();
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface PolicyRule {
  id?: string;
  agentType: string;
  toolName: string;
  operation: string;
  effect: 'DENY' | 'REQUIRE_CONFIRMATION';
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  rules: PolicyRule[];
  createdAt: string;
}

export interface SystemTool {
  id: string;
  name: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiredPermission: string;
  isActive: boolean;
  createdAt: string;
}
