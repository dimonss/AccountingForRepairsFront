import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { setOnline, setOffline, setConnectionQuality } from '../store';
import { getRepairsApiUrl } from '../config/api.config';

export const useConnectionStatus = () => {
  const dispatch = useDispatch();
  const { isOnline, lastOnlineTime, lastOfflineTime, connectionQuality } = useSelector(
    (state: RootState) => state.connection
  );
  const { accessToken } = useSelector((state: RootState) => state.auth);
  
  // Use ref to store the latest accessToken to avoid recreating the function
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;
  
  // Use ref to track if we're already testing to prevent multiple simultaneous requests
  const isTestingRef = useRef(false);
  
  // Use ref to track last test time to prevent too frequent requests
  const lastTestTimeRef = useRef(0);

  // Test connection quality by making a lightweight request
  const testConnectionQuality = useCallback(async () => {
    const now = Date.now();
    
    // Prevent multiple simultaneous requests
    if (isTestingRef.current) {
      return;
    }
    
    // Prevent too frequent requests (minimum 5 seconds between tests)
    if (now - lastTestTimeRef.current < 5000) {
      return;
    }
    
    isTestingRef.current = true;
    lastTestTimeRef.current = now;
    
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      // Prepare headers
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };
      
      // Add authorization header if token exists (use ref to get latest value)
      if (accessTokenRef.current) {
        headers['Authorization'] = `Bearer ${accessTokenRef.current}`;
      }
      
      // Use the repairs API endpoint for connection testing
      const response = await fetch(`${getRepairsApiUrl()}?limit=1`, {
        method: 'GET',
        cache: 'no-cache',
        signal: controller.signal,
        headers
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Consider response time and status for quality assessment
      if (response.ok && responseTime < 2000) {
        dispatch(setConnectionQuality('good'));
      } else if (response.ok && responseTime < 5000) {
        dispatch(setConnectionQuality('poor'));
      } else {
        dispatch(setConnectionQuality('poor'));
      }
    } catch {
      dispatch(setConnectionQuality('poor'));
    } finally {
      isTestingRef.current = false;
    }
  }, [dispatch]);

  // Handle online event
  const handleOnline = useCallback(() => {
    const timestamp = Date.now();
    dispatch(setOnline({ timestamp }));
    // Test connection quality when coming back online
    testConnectionQuality();
  }, [dispatch, testConnectionQuality]);

  // Handle offline event
  const handleOffline = useCallback(() => {
    const timestamp = Date.now();
    dispatch(setOffline({ timestamp }));
  }, [dispatch]);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test initial connection quality if online
    if (navigator.onLine) {
      testConnectionQuality();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline, testConnectionQuality]);

  // Periodic connection quality check when online
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      testConnectionQuality();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline, testConnectionQuality]);

  return {
    isOnline,
    lastOnlineTime,
    lastOfflineTime,
    connectionQuality,
    testConnectionQuality
  };
};
