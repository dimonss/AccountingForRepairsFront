import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { getReportsApiUrl, getAuthApiUrl } from '../../config/api.config';

// Types for reports data
export interface OverviewStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  issued: number;
  cancelled: number;
  waitingParts: number;
  completionRate: number;
}

export interface DeviceTypeStats {
  device_type: string;
  count: number;
}

export interface BrandStats {
  brand: string;
  count: number;
}

export interface MonthlyStats {
  month: string;
  count: number;
}

export interface FinancialStats {
  totalRepairs: number;
  completedRepairs: number;
  totalEstimated: number;
  totalActual: number;
  averageEstimated: number;
  averageActual: number;
}

export interface ReportsSummary {
  overview: OverviewStats;
  devices: DeviceTypeStats[];
  brands: BrandStats[];
  monthly: MonthlyStats[];
  financial: FinancialStats;
}

export interface DateRange {
  week: 'week';
  month: 'month';
  quarter: 'quarter';
  year: 'year';
}

export type DateRangeType = keyof DateRange;

export interface ReportsQueryParams {
  dateRange?: DateRangeType;
  startDate?: string;
  endDate?: string;
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
    baseUrl: getReportsApiUrl(),
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

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Reports'],
  endpoints: (builder) => ({
    getOverviewStats: builder.query<{ success: boolean; data: OverviewStats }, ReportsQueryParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.dateRange) queryParams.append('dateRange', params.dateRange);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        return `?${queryParams.toString()}`;
      },
      providesTags: ['Reports'],
    }),
    getDeviceStats: builder.query<{ success: boolean; data: DeviceTypeStats[] }, ReportsQueryParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.dateRange) queryParams.append('dateRange', params.dateRange);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        return `/devices?${queryParams.toString()}`;
      },
      providesTags: ['Reports'],
    }),
    getBrandStats: builder.query<{ success: boolean; data: BrandStats[] }, ReportsQueryParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.dateRange) queryParams.append('dateRange', params.dateRange);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        return `/brands?${queryParams.toString()}`;
      },
      providesTags: ['Reports'],
    }),
    getMonthlyStats: builder.query<{ success: boolean; data: MonthlyStats[] }, ReportsQueryParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.dateRange) queryParams.append('dateRange', params.dateRange);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        return `/monthly?${queryParams.toString()}`;
      },
      providesTags: ['Reports'],
    }),
    getFinancialStats: builder.query<{ success: boolean; data: FinancialStats }, ReportsQueryParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.dateRange) queryParams.append('dateRange', params.dateRange);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        return `/financial?${queryParams.toString()}`;
      },
      providesTags: ['Reports'],
    }),
    getReportsSummary: builder.query<{ success: boolean; data: ReportsSummary }, ReportsQueryParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.dateRange) queryParams.append('dateRange', params.dateRange);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        return `/summary?${queryParams.toString()}`;
      },
      providesTags: ['Reports'],
    }),
  }),
});

export const {
  useGetOverviewStatsQuery,
  useGetDeviceStatsQuery,
  useGetBrandStatsQuery,
  useGetMonthlyStatsQuery,
  useGetFinancialStatsQuery,
  useGetReportsSummaryQuery,
} = reportsApi;
