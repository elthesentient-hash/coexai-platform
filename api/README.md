# CoExAI Backend API

Authentication and core API for CoExAI platform.

## Setup

```bash
cd api
npm install
npm run dev
```

## Environment Variables

Create `.env`:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3001
NODE_ENV=development
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

### Waitlist
- `POST /api/waitlist` - Join waitlist

## Database Schema

See `schema.sql` for full schema.
