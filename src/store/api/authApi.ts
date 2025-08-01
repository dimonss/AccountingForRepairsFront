import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'technician' | 'manager';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
    expiresIn?: {
      accessToken: string;
      refreshToken: string;
      accessExpiresAt: string;
      refreshExpiresAt: string;
    };
  };
  error?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string; // Now includes new refresh token!
    user: User;
    expiresIn?: {
      accessToken: string;
      refreshToken: string;
      accessExpiresAt: string;
      refreshExpiresAt: string;
    };
  };
  error?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: 'admin' | 'technician' | 'manager';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Session {
  id: number;
  created_at: string;
  last_used_at: string;
  user_agent: string;
  ip_address: string;
}

// Type for error responses
interface ApiErrorResponse {
  success: false;
  error: string;
  code?: 'TOKEN_EXPIRED' | 'INVALID_TOKEN';
}

// Custom base query with automatic token refresh for auth API
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: 'http://localhost:3001/api/auth',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  });

  let result = await baseQuery(args, api, extraOptions);

  // Check if the error is due to token expiration
  if (result.error && result.error.status === 401) {
    const errorData = result.error.data as ApiErrorResponse;

    // Handle both TOKEN_EXPIRED and INVALID_TOKEN (which might be expired)
    if (errorData?.code === 'TOKEN_EXPIRED' || errorData?.code === 'INVALID_TOKEN') {
      // Try to refresh the token
      const state = api.getState() as RootState;
      const refreshToken = state.auth.refreshToken;

      if (refreshToken) {
        const refreshResult = await baseQuery(
          {
            url: '/refresh',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const refreshData = refreshResult.data as RefreshTokenResponse;
          if (refreshData.success && refreshData.data) {
            // Update both access token and refresh token in the store
            api.dispatch({
              type: 'auth/setCredentials',
              payload: {
                accessToken: refreshData.data.accessToken,
                refreshToken: refreshData.data.refreshToken,
                user: refreshData.data.user
              }
            });

            // Retry the original request with the new token
            result = await baseQuery(args, api, extraOptions);
          }
        } else {
          // Refresh failed, logout user
          api.dispatch({ type: 'auth/logout' });
        }
      } else {
        // No refresh token, logout user
        api.dispatch({ type: 'auth/logout' });
      }
    }
  }

  return result;
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Session'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: (refreshTokenData) => ({
        url: '/refresh',
        method: 'POST',
        body: refreshTokenData,
      }),
    }),
    logout: builder.mutation<ApiResponse<{ message: string }>, { refreshToken?: string }>({
      query: (body) => ({
        url: '/logout',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Session'],
    }),
    logoutAll: builder.mutation<ApiResponse<{ message: string }>, void>({
      query: () => ({
        url: '/logout-all',
        method: 'POST',
      }),
      invalidatesTags: ['Session'],
    }),
    register: builder.mutation<ApiResponse<{ id: number; message: string }>, RegisterRequest>({
      query: (userData) => ({
        url: '/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    getMe: builder.query<ApiResponse<{ user: User }>, void>({
      query: () => '/me',
      providesTags: ['User'],
    }),
    getUsers: builder.query<ApiResponse<User[]>, void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    updateUser: builder.mutation<ApiResponse<{ message: string }>, { id: number; full_name: string; role: string; is_active: boolean }>({
      query: ({ id, ...patch }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation<ApiResponse<{ message: string }>, { currentPassword: string; newPassword: string }>({
      query: (passwords) => ({
        url: '/change-password',
        method: 'POST',
        body: passwords,
      }),
      invalidatesTags: ['Session'], // Password change revokes all tokens
    }),
    getSessions: builder.query<ApiResponse<Session[]>, void>({
      query: () => '/sessions',
      providesTags: ['Session'],
    }),
    revokeSession: builder.mutation<ApiResponse<{ message: string }>, number>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Session'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useRegisterMutation,
  useGetMeQuery,
  useGetUsersQuery,
  useUpdateUserMutation,
  useChangePasswordMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
} = authApi; 