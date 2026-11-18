import { QueryClient } from '@tanstack/react-query';
import { useSession } from '@/store/session';
import type { Session } from '@/types';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
    mutations: { retry: false },
  },
});

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
  }
}

const developmentHost = Constants.expoConfig?.hostUri?.split(':')[0];
const baseUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  `http://${Platform.OS === 'web' ? 'localhost' : (developmentHost ?? 'localhost')}:8080/api/v1`;
let refreshPromise: Promise<void> | null = null;

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const token = useSession.getState().refreshToken;
      if (!token) throw new ApiError('Please sign in again.', 'UNAUTHORIZED', 401);
      const session = await api<Session>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: token },
        anonymous: true,
      });
      await useSession.getState().setSession(session);
    })()
      .catch(async (error) => {
        if (error instanceof ApiError && error.status === 401) {
          await useSession.getState().clear();
          queryClient.clear();
        }
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  anonymous?: boolean;
};

export async function api<T>(
  path: string,
  options: Options = {},
  retried = false,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    const token = useSession.getState().accessToken;
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(!options.anonymous && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(
      'Cannot reach Dayflow. Check your connection and try again.',
      'NETWORK_ERROR',
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
  if (response.status === 401 && !options.anonymous && !retried) {
    await refreshSession();
    return api<T>(path, options, true);
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.message ?? 'Something went wrong. Please try again.',
      error.code ?? 'ERROR',
      response.status,
      error.details,
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export async function mutate<T>(
  path: string,
  method: Options['method'],
  body?: unknown,
) {
  const result = await api<T>(path, { method, body });
  await queryClient.invalidateQueries();
  return result;
}

export function params(values: Record<string, unknown>) {
  return new URLSearchParams(
    Object.entries(values)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  ).toString();
}
