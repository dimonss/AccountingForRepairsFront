# Accounting for Repairs - Frontend

Modern React frontend with TypeScript and RTK Query for the Accounting for Repairs application.

## Features

- **React 18** with TypeScript for type safety
- **Redux Toolkit** with RTK Query for efficient state management
- **Modern UI Design** with gradient backgrounds and glass morphism effects
- **Responsive Layout** that works on all devices
- **Real-time Updates** with automatic cache invalidation
- **Form Validation** for data integrity
- **Loading States** and error handling

## Prerequisites

- Node.js 24.x (use NVM)
- npm

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development Server

The development server will be available at http://localhost:5173

## Project Structure

```
src/
├── components/
│   ├── RepairsList.tsx    # List of all repairs
│   └── RepairForm.tsx     # Form for creating repairs
├── store/
│   ├── store.ts           # Redux store configuration
│   └── api/
│       └── repairsApi.ts  # RTK Query API definitions
├── App.tsx                # Main application component
├── main.tsx              # Application entry point
├── App.css               # Application styles
└── index.css             # Global styles
```

## Components

### RepairsList
- Displays all repairs in a responsive grid layout
- Allows status updates via dropdown
- Provides delete functionality with confirmation
- Shows loading and error states

### RepairForm
- Form for creating new repairs
- Field validation for required inputs
- Device type selection
- Cost estimation input
- Responsive form layout

## State Management

The application uses Redux Toolkit with RTK Query for:
- Automatic caching and background updates
- Optimistic updates for better UX
- Error handling and loading states
- Normalized data structure

## Styling

The application features a modern design with:
- Gradient backgrounds
- Glass morphism effects with backdrop-filter
- Smooth animations and transitions
- Responsive grid layouts
- Color-coded status badges
- Hover effects and interactive elements

## API Integration

The frontend communicates with the backend API at http://localhost:3001/api using RTK Query for:
- Fetching repairs data
- Creating new repairs
- Updating existing repairs
- Deleting repairs
- Status updates

## Build and Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The build output will be in the `dist/` directory, ready for deployment to any static hosting service.

## Dependencies

### Production
- react - UI library
- react-dom - React DOM rendering
- react-redux - React bindings for Redux
- @reduxjs/toolkit - Redux state management

### Development
- typescript - TypeScript compiler
- vite - Build tool and dev server
- @vitejs/plugin-react - React support for Vite
- eslint - Code linting
- @types/* - Type definitions

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

The application uses modern CSS features like backdrop-filter, which are supported in all modern browsers.
