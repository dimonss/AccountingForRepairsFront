import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { getRepairsApiUrl, getAuthApiUrl } from '../../config/api.config';

export interface RepairPhoto {
  id?: number;
  url: string;
  filename: string;
  caption?: string;
  uploaded_at?: string;
}

export interface Repair {
  id?: number;
  device_type: string;
  brand: string;
  model: string;
  serial_number?: string;
  repair_number?: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  issue_description: string;
  repair_status: 'pending' | 'in_progress' | 'waiting_parts' | 'completed' | 'issued' | 'cancelled';
  estimated_cost?: number;
  actual_cost?: number;
  notes?: string;
  photos?: RepairPhoto[];
  created_at?: string;
  updated_at?: string;
  created_by?: number;
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

export interface SearchParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  totalWithoutFilters?: number;
}

export interface RepairsResponse {
  success: boolean;
  data: Repair[];
  pagination: PaginationInfo;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Type for error responses
interface ApiErrorResponse {
  success: false;
  error: string;
  code?: 'TOKEN_EXPIRED' | 'INVALID_TOKEN';
}

// Type for refresh token response
interface RefreshTokenResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      username: string;
      email: string;
      full_name: string;
      role: string;
    };
  };
}

// Custom base query with automatic token refresh
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: getRepairsApiUrl(),
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
        const refreshResult = await fetchBaseQuery({
          baseUrl: getAuthApiUrl(),
        })({
          url: '/refresh',
          method: 'POST',
          body: { refreshToken },
        }, api, extraOptions);

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

export const repairsApi = createApi({
  reducerPath: 'repairsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Repair'],
  endpoints: (builder) => ({
    getRepairs: builder.query<RepairsResponse, SearchParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        
        if (params.search) searchParams.append('search', params.search);
        if (params.status && params.status !== 'all') searchParams.append('status', params.status);
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.sortBy) searchParams.append('sortBy', params.sortBy);
        if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
        
        const queryString = searchParams.toString();
        return queryString ? `?${queryString}` : '';
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }: Repair) => ({ type: 'Repair' as const, id })),
              { type: 'Repair', id: 'LIST' },
            ]
          : [{ type: 'Repair', id: 'LIST' }],
      // Reduce caching for search queries to ensure fresh results
      keepUnusedDataFor: 30, // 30 seconds instead of default 60
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
    getRepairHistory: builder.query<ApiResponse<Record<string, unknown>[]>, number>({
      query: (id) => `/${id}/history`,
    }),
    getNextRepairNumber: builder.mutation<ApiResponse<{ repair_number: string }>, void>({
      query: () => ({
        url: '/next-number',
        method: 'GET',
      }),
    }),
    uploadRepairPhotos: builder.mutation<ApiResponse<RepairPhoto[]>, { repairId: number; photos: RepairPhoto[] }>({
      query: ({ repairId, photos }) => ({
        url: `/${repairId}/photos`,
        method: 'POST',
        body: { photos },
      }),
      invalidatesTags: (_result, _error, { repairId }) => [{ type: 'Repair', id: repairId }, { type: 'Repair', id: 'LIST' }],
    }),
    deleteRepairPhoto: builder.mutation<ApiResponse<{ message: string }>, { repairId: number; photoId: number }>({
      query: ({ repairId, photoId }) => ({
        url: `/${repairId}/photos/${photoId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { repairId }) => [{ type: 'Repair', id: repairId }, { type: 'Repair', id: 'LIST' }],
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
  useGetNextRepairNumberMutation,
  useUploadRepairPhotosMutation,
  useDeleteRepairPhotoMutation,
} = repairsApi; 