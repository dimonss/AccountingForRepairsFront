# Internet Connection Status Monitoring

This document describes the internet connection status monitoring and offline functionality implemented in the application.

## Features Implemented

### 1. Connection Status Monitoring
- **Real-time monitoring**: Uses browser's `navigator.onLine` API and network events
- **Connection quality testing**: Periodically tests connection quality with lightweight requests
- **Redux state management**: Connection status is managed in Redux store for global access

### 2. Visual Connection Indicator
- **Header indicator**: Shows connection status in the app header
- **Status colors**: 
  - 🟢 Green: Online with good connection
  - 🟡 Yellow: Online with poor connection  
  - 🔴 Red: Offline
- **Responsive design**: Adapts to different screen sizes

### 3. Offline Blocking for Repair Creation
- **Button disabling**: "Add Repair" button is disabled when offline
- **Modal blocking**: Repair creation is blocked in the modal when offline
- **User feedback**: Clear tooltips and alerts explain why actions are blocked
- **Edit mode exception**: Existing repair editing is still allowed when offline

### 4. Smart Caching Configuration
- **Repair creation**: No caching to ensure fresh data
- **Search queries**: Reduced caching (30 seconds) for more responsive search results
- **Other operations**: Standard caching maintained for performance

### 5. Offline Notifications
- **Toast notifications**: Appear when connection status changes
- **Auto-dismiss**: Notifications automatically disappear after 4 seconds
- **Manual dismiss**: Users can close notifications manually
- **Responsive positioning**: Adapts to mobile screens

## Technical Implementation

### Files Created/Modified

#### New Files:
- `src/store/connectionSlice.ts` - Redux slice for connection state
- `src/hooks/useConnectionStatus.ts` - Custom hook for connection monitoring
- `src/components/ConnectionStatus.tsx` - Connection status indicator component
- `src/components/ConnectionStatus.css` - Styles for connection indicator
- `src/components/OfflineNotification.tsx` - Offline notification component
- `src/components/OfflineNotification.css` - Styles for notifications

#### Modified Files:
- `src/store/store.ts` - Added connection reducer
- `src/App.tsx` - Added connection status indicator and offline blocking
- `src/components/RepairModal.tsx` - Added offline blocking for repair creation
- `src/store/api/repairsApi.ts` - Configured caching for search queries
- `src/App.css` - Added disabled button styles

### Connection Quality Testing
The system tests connection quality by making lightweight GET requests to the repairs API endpoint (`/repairs?limit=1`) and measuring response time:
- **Good**: Response time < 2 seconds
- **Poor**: Response time 2-5 seconds or failed requests
- **Testing frequency**: Every 30 seconds when online
- **Endpoint**: Uses the actual API endpoint to ensure the backend is reachable
- **Authorization**: Includes Bearer token from Redux store for authenticated requests
- **Optimization**: Prevents multiple simultaneous requests and enforces minimum 5-second intervals between tests
- **Single instance**: Only one component (App.tsx) manages connection monitoring to prevent duplicate requests

### Offline Behavior
- **Repair creation**: Completely blocked when offline
- **Repair editing**: Allowed (assumes user has local data)
- **Search/filtering**: Completely blocked when offline (requires server requests)
- **Barcode scanning**: Blocked when offline
- **Filter controls**: All disabled when offline
- **Repair list**: Shows cached data when available, displays offline indicator
- **Reports**: Uses cached data when available
- **Authentication**: Maintains existing behavior

## User Experience

### Visual Feedback
1. **Connection indicator** in header shows current status
2. **Disabled buttons** with tooltips explain why actions are unavailable
3. **Toast notifications** inform users of connection changes
4. **Alert messages** provide clear explanations when actions are blocked

### Responsive Design
- Connection indicator adapts to screen size
- On mobile, only the status icon is shown to save space
- Notifications adjust positioning for mobile screens

## Browser Compatibility
- Uses standard `navigator.onLine` API (supported in all modern browsers)
- Network event listeners for real-time updates
- Graceful degradation for older browsers

## Future Enhancements
Potential improvements that could be added:
- Offline data synchronization when connection is restored
- Service worker for better offline experience
- Connection quality metrics and analytics
- Retry mechanisms for failed requests
