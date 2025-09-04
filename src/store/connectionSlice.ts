import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ConnectionState {
  isOnline: boolean;
  lastOnlineTime: number | null;
  lastOfflineTime: number | null;
  connectionQuality: 'good' | 'poor' | 'unknown';
}

const initialState: ConnectionState = {
  isOnline: navigator.onLine,
  lastOnlineTime: navigator.onLine ? Date.now() : null,
  lastOfflineTime: navigator.onLine ? null : Date.now(),
  connectionQuality: 'unknown'
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setOnline: (state, action: PayloadAction<{ timestamp: number; quality?: 'good' | 'poor' }>) => {
      state.isOnline = true;
      state.lastOnlineTime = action.payload.timestamp;
      if (action.payload.quality) {
        state.connectionQuality = action.payload.quality;
      }
    },
    setOffline: (state, action: PayloadAction<{ timestamp: number }>) => {
      state.isOnline = false;
      state.lastOfflineTime = action.payload.timestamp;
    },
    setConnectionQuality: (state, action: PayloadAction<'good' | 'poor' | 'unknown'>) => {
      state.connectionQuality = action.payload;
    },
    resetConnectionState: () => initialState
  }
});

export const { setOnline, setOffline, setConnectionQuality, resetConnectionState } = connectionSlice.actions;
export default connectionSlice.reducer;
