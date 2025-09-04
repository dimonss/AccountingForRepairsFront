import { configureStore } from '@reduxjs/toolkit';
import { repairsApi } from './api/repairsApi';
import { authApi } from './api/authApi';
import { reportsApi } from './api/reportsApi';
import authReducer from './authSlice';
import connectionReducer from './connectionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    connection: connectionReducer,
    [repairsApi.reducerPath]: repairsApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      repairsApi.middleware,
      authApi.middleware,
      reportsApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 