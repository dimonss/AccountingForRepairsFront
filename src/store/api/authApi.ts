import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
  error?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3001/api/auth',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
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
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useGetUsersQuery,
  useUpdateUserMutation,
  useChangePasswordMutation,
} = authApi; 