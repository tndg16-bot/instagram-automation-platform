# Phase 1 Testing Results

**Date:** January 20, 2026
**Environment:** Windows (Docker not accessible via bash tool)

## Testing Status

Due to Docker connection limitations in the current environment, end-to-end testing cannot be performed automatically via the bash tool. However, all code has been implemented and is ready for manual testing.

## Manual Testing Instructions

### 1. Start Database Services

**Option A: Using Docker Compose (Recommended)**
```bash
cd backend
docker-compose up -d postgres redis
```

**Option B: Using Local Installation**
If you have PostgreSQL and Redis installed locally:
```bash
# Make sure PostgreSQL is running on port 5432
# Make sure Redis is running on port 6379
```

### 2. Initialize Database Schema

```bash
node scripts/init-db.js
```

### 3. Configure Environment Variables

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env with your settings
```

**Frontend (.env.local):**
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your Instagram App ID
```

### 4. Start Backend Server

```bash
cd backend
npm run dev
```

Backend will start on http://localhost:8000

### 5. Start Frontend Server

In a new terminal:

```bash
cd frontend
npm run dev
```

Frontend will start on http://localhost:3000

## Test Cases

### Test 1: User Registration
1. Navigate to http://localhost:3000
2. Should be redirected to http://localhost:3000/login
3. Click "Sign up" link
4. Fill in registration form:
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
   - Name: Test User
5. Click "Sign up"
6. **Expected:** Success message and redirect to dashboard
7. **Verify:** Access token stored in localStorage

### Test 2: User Login
1. Navigate to http://localhost:3000/login
2. Fill in login form:
   - Email: test@example.com
   - Password: password123
3. Click "Sign in"
4. **Expected:** Success message and redirect to dashboard
5. **Verify:** Access token stored in localStorage

### Test 3: Dashboard Display
1. After login, should be redirected to http://localhost:3000/dashboard
2. **Expected:** Dashboard displays:
   - User profile (name, email)
   - Statistics (connected accounts, followers, posts)
   - Connected Instagram Accounts table (empty initially)
3. **Verify:** No errors in browser console

### Test 4: Logout
1. Click "Logout" button in dashboard
2. **Expected:** Redirect to login page
3. **Verify:** localStorage cleared (accessToken, refreshToken, user removed)

### Test 5: Connect Instagram Account (Requires Instagram App)
**Prerequisites:**
- Create Instagram App at https://developers.facebook.com/apps/
- Get App ID and App Secret
- Add Redirect URI: http://localhost:3000/auth/instagram/callback
- Configure Required Permissions:
  - instagram_basic
  - instagram_manage_comments
  - instagram_manage_insights
  - instagram_content_publish
  - instagram_manage_messages

**Steps:**
1. Configure Instagram App credentials in backend/.env
2. Restart backend server
3. On dashboard, click "Connect Account" button
4. **Expected:** Redirects to Instagram OAuth page
5. Login to Instagram (if not already logged in)
6. Grant permissions
7. **Expected:** Redirect to http://localhost:3000/auth/instagram/callback with success
8. **Expected:** Automatically redirects to dashboard
9. **Expected:** Connected Instagram account appears in accounts table

### Test 6: Disconnect Instagram Account
1. After connecting an account, click "Disconnect" button
2. **Expected:** Account removed from table
3. **Refresh page:** Account should still be removed

## API Endpoint Testing

### Health Check
```bash
curl http://localhost:8000/health
```
**Expected:** `{"status":"ok","timestamp":"..."}`

### Register User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123",
    "name":"Test User"
  }'
```
**Expected:** User data with access token and refresh token

### Login User
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123"
  }'
```
**Expected:** User data with tokens

### Get Current User
```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <access_token>"
```
**Expected:** Current user data

### Get Instagram Accounts
```bash
curl http://localhost:8000/api/instagram/accounts \
  -H "Authorization: Bearer <access_token>"
```
**Expected:** Array of connected accounts (empty initially)

## Known Issues / Limitations

1. **Docker Not Accessible:** The bash tool cannot connect to Docker on Windows in this environment. Manual Docker setup required.

2. **Instagram App Required:** Instagram OAuth testing requires a valid Instagram App with proper permissions configured at https://developers.facebook.com/apps/

3. **Missing Instagram App ID in Frontend:** The frontend needs `NEXT_PUBLIC_INSTAGRAM_APP_ID` environment variable to properly initiate OAuth flow.

## Code Quality Checklist

- ✅ TypeScript types properly defined
- ✅ Error handling implemented
- ✅ Input validation on API endpoints
- ✅ JWT token refresh mechanism
- ✅ Password hashing with bcrypt
- ✅ Environment configuration files
- ✅ Database schema with proper indexes
- ✅ Frontend responsive design with Tailwind CSS

## Next Steps for Phase 2

Based on the project requirements (要件定義書.md), Phase 2 should focus on:

1. **DM Automation**
   - Auto-reply rules
   - Keyword triggers
   - Template management
   - Rate limiting

2. **Comment Automation**
   - Auto-comment features
   - Engagement monitoring
   - Content moderation

3. **Workflow Engine**
   - Create workflow system
   - Workflow builder UI
   - Trigger conditions
   - Action execution

## Conclusion

All Phase 1 features have been successfully implemented and committed to GitHub. The code is production-ready pending:

1. PostgreSQL database setup
2. Instagram App configuration
3. Environment variables configuration
4. Manual end-to-end testing

The implementation follows best practices for:
- Security (JWT, bcrypt, helmet, rate limiting)
- Code organization (services, routes, utils separation)
- Type safety (TypeScript)
- User experience (responsive UI, loading states, error handling)
