import { configureStore } from '@reduxjs/toolkit';
import { repairsApi } from './api/repairsApi';
import { authApi } from './api/authApi';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [repairsApi.reducerPath]: repairsApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      repairsApi.middleware,
      authApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 