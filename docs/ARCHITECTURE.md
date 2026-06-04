# Architecture Overview

## Design Principles

- **Monorepo** with npm workspaces for shared types and constants
- **Clean separation**: routes → controllers → services → models
- **Security-first**: helmet, CORS, rate limits, hashed refresh tokens, HTTP-only cookies
- **Horizontal scaling**: stateless API, MongoDB connection pooling, JWT-based auth

## Backend Layers

```
Request → Middleware (auth, validate, rate limit)
       → Controller (HTTP)
       → Service (business logic)
       → Model (Mongoose)
```

## Frontend Layers

```
Page → React Hook Form + Zod
     → React Query / Redux
     → auth.api.ts → axios (interceptors, token refresh)
     → Express API
```

## JWT Strategy

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access | 15 minutes | localStorage + Authorization header |
| Refresh | 7 days | HTTP-only cookie + DB hash |

Token rotation on every refresh invalidates the previous refresh token hash.

## RBAC

Roles: `user`, `admin`. Use `authorize('admin')` middleware on admin-only routes in future phases.

## Database Indexes

- `email` (unique)
- `provider` + `providerId` (compound, sparse)
