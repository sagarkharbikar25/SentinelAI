import axios from 'axios';

// Use relative /api endpoint so Next.js proxy rewrites it to http://localhost:3001 seamlessly
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sentinel_token');
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
