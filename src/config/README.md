# Environment Configuration

## API Base URL Configuration

The frontend API base URL has been moved to environment variables for better configuration management.

### Setting up Environment Variables

Create a `.env.local` file in the root of the frontend project (`AccountingForRepairsFront/`) with the following content:

```
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:3001/api
```

### Available Environment Variables

- `VITE_API_BASE_URL` - The base URL for the backend API (default: `http://localhost:3001/api`)

### Configuration File

The configuration is managed in `src/config/api.config.ts`:

- Uses environment variables when available
- Falls back to default values if environment variables are not set
- Provides helper functions for getting complete API URLs

### Different Environments

For different deployment environments, you can create different `.env` files:

- `.env.local` - Local development (not committed to git)
- `.env.development` - Development environment
- `.env.production` - Production environment
- `.env.staging` - Staging environment

### Note

Make sure to add `.env.local` to your `.gitignore` file to avoid committing sensitive configuration values. 