import { configureStore } from '@reduxjs/toolkit';
import { repairsApi } from './api/repairsApi';

export const store = configureStore({
  reducer: {
    [repairsApi.reducerPath]: repairsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(repairsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 