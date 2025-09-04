import { useEffect, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { setOnline, setOffline, setConnectionQuality } from '../store';
import { useGetRepairsQuery } from '../store/api/repairsApi';

export const useConnectionStatus = () => {
  const dispatch = useDispatch();
  const { isOnline, lastOnlineTime, lastOfflineTime, connectionQuality } = useSelector(
    (state: RootState) => state.connection
  );
  
  // State to trigger connection tests
  const [shouldTestConnection, setShouldTestConnection] = useState(false);
  
  // Use RTK Query for connection testing with skip parameter
  const { data, isSuccess, isError } = useGetRepairsQuery(
    { limit: 1, page: 1, sortBy: 'created_at', sortOrder: 'DESC' },
    { 
      skip: !shouldTestConnection,
      // Don't cache connection test results
      refetchOnMountOrArgChange: true
    }
  );
  
  // Use ref to track if we're already testing to prevent multiple simultaneous requests
  const isTestingRef = useRef(false);
  
  // Use ref to track last test time to prevent too frequent requests
  const lastTestTimeRef = useRef(0);

  // Test connection quality using RTK Query (includes token refresh logic)
  const testConnectionQuality = useCallback(() => {
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
    
    // Trigger the RTK Query request
    setShouldTestConnection(true);
  }, []);
  
  // Handle connection test results
  useEffect(() => {
    if (shouldTestConnection && (isSuccess || isError)) {
      if (isSuccess && data) {
        dispatch(setConnectionQuality('good'));
      } else if (isError) {
        dispatch(setConnectionQuality('poor'));
      }
      
      // Reset state
      setShouldTestConnection(false);
      isTestingRef.current = false;
    }
  }, [shouldTestConnection, isSuccess, isError, data, dispatch]);

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
