import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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
  notes?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const repairsApi = createApi({
  reducerPath: 'repairsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3001/api',
  }),
  tagTypes: ['Repair'],
  endpoints: (builder) => ({
    getRepairs: builder.query<ApiResponse<Repair[]>, void>({
      query: () => '/repairs',
      providesTags: ['Repair'],
    }),
    getRepair: builder.query<ApiResponse<Repair>, number>({
      query: (id) => `/repairs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Repair', id }],
    }),
    createRepair: builder.mutation<ApiResponse<{ id: number; message: string }>, Partial<Repair>>({
      query: (repair) => ({
        url: '/repairs',
        method: 'POST',
        body: repair,
      }),
      invalidatesTags: ['Repair'],
    }),
    updateRepair: builder.mutation<ApiResponse<{ message: string }>, { id: number; repair: Partial<Repair> }>({
      query: ({ id, repair }) => ({
        url: `/repairs/${id}`,
        method: 'PUT',
        body: repair,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Repair', id }],
    }),
    deleteRepair: builder.mutation<ApiResponse<{ message: string }>, number>({
      query: (id) => ({
        url: `/repairs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Repair'],
    }),
    updateRepairStatus: builder.mutation<ApiResponse<{ message: string }>, { id: number; status: string; notes?: string }>({
      query: ({ id, status, notes }) => ({
        url: `/repairs/${id}/status`,
        method: 'PATCH',
        body: { status, notes },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Repair', id }],
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
} = repairsApi; 