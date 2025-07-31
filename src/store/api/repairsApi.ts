import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

export interface Repair {
  id?: number;
  device_type: string;
  brand: string;
  model: string;
  serial_number?: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  issue_description: string;
  repair_status: 'pending' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled';
  estimated_cost?: number;
  actual_cost?: number;
  parts_cost?: number;
  labor_cost?: number;
  assigned_to?: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  notes?: string;
}

export interface RepairHistoryEntry {
  id: number;
  repair_id: number;
  old_status: string;
  new_status: string;
  changed_by: number;
  changed_at: string;
  notes?: string;
  changed_by_name?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Custom base query with automatic token refresh for repairs API
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: 'http://localhost:3001/api/repairs',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  });

  let result = await baseQuery(args, api, extraOptions);

  // Check if the error is due to token expiration
  if (result.error && result.error.status === 401) {
    const errorData = result.error.data as any;
    if (errorData?.code === 'TOKEN_EXPIRED') {
      // Try to refresh the token
      const refreshToken = (api.getState() as any).auth.refreshToken;
      
      if (refreshToken) {
        const refreshResult = await fetchBaseQuery({
          baseUrl: 'http://localhost:3001/api/auth',
        })({
          url: '/refresh',
          method: 'POST',
          body: { refreshToken },
        }, api, extraOptions);

        if (refreshResult.data) {
          const refreshData = refreshResult.data as any;
          if (refreshData.success && refreshData.data) {
            // Update the access token in the store
            api.dispatch({
              type: 'auth/updateAccessToken',
              payload: refreshData.data.accessToken,
            });

            // Retry the original request with the new token
            result = await baseQuery(args, api, extraOptions);
          } else {
            // Refresh failed, logout user
            api.dispatch({ type: 'auth/logout' });
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

export const repairsApi = createApi({
  reducerPath: 'repairsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Repair'],
  endpoints: (builder) => ({
    getRepairs: builder.query<ApiResponse<Repair[]>, void>({
      query: () => '',
      providesTags: ['Repair'],
    }),
    getRepair: builder.query<ApiResponse<Repair>, number>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Repair', id }],
    }),
    createRepair: builder.mutation<ApiResponse<{ id: number; message: string }>, Partial<Repair>>({
      query: (repair) => ({
        url: '',
        method: 'POST',
        body: repair,
      }),
      invalidatesTags: ['Repair'],
    }),
    updateRepair: builder.mutation<ApiResponse<{ message: string }>, { id: number; repair: Partial<Repair> }>({
      query: ({ id, repair }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: repair,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Repair', id }],
    }),
    deleteRepair: builder.mutation<ApiResponse<{ message: string }>, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Repair'],
    }),
    updateRepairStatus: builder.mutation<ApiResponse<{ message: string }>, { id: number; status: string; notes?: string }>({
      query: ({ id, status, notes }) => ({
        url: `/${id}/status`,
        method: 'PATCH',
        body: { status, notes },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Repair', id }],
    }),
    getRepairHistory: builder.query<ApiResponse<any[]>, number>({
      query: (id) => `/${id}/history`,
    }),
  }),
});

export const {
  useGetRepairsQuery,
  useGetRepairQuery,
  useCreateRepairMutation,
  useUpdateRepairMutation,
  useDeleteRepairMutation,
  useUpdateRepairStatusMutation,
  useGetRepairHistoryQuery,
} = repairsApi; 