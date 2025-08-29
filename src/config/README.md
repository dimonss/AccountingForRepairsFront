# Environment Configuration

## API Base URL Configuration

The frontend API base URL has been moved to environment variables for better configuration management.

### Setting up Environment Variables

Create a `.env.local` file in the root of the frontend project (`AccountingForRepairsFront/`) with the following content:

```
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:3001
```

### Available Environment Variables

- `VITE_API_BASE_URL` - The base URL for the backend API (default: `http://localhost:3001`)

### Configuration File

The configuration is managed in `src/config/api.config.ts`:

- Uses environment variables when available
- Falls back to default values if environment variables are not set
- Provides helper functions for getting complete API URLs

### Different Deployment Scenarios

#### 1. Local Development
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3001
```

#### 2. Production - Same Domain (root)
```bash
# .env.production
VITE_API_BASE_URL=
```
Both frontend and backend served from the same domain root

#### 3. Production - API with same base path
```bash
# .env.production
VITE_API_BASE_URL=/repairs_accounting/api
```
Both frontend and API under the same base path (API proxied under `/repairs_accounting/api`)

#### 4. Production - Different Domain
```bash
# .env.production
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Different Environment Files

For different deployment environments, you can create different `.env` files:

- `.env.local` - Local development (not committed to git)
- `.env.development` - Development environment
- `.env.production` - Production environment
- `.env.staging` - Staging environment

### Note

Make sure to add `.env.local` to your `.gitignore` file to avoid committing sensitive configuration values. 