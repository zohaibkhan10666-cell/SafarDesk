# SafarDesk Production Deployment Checklist

## ✅ Completed
- [x] GitHub changes pushed (vercel.json + schema.prisma)
- [x] Railway API health check: PASSING
- [x] Vercel domain: https://safar-desk-flame.vercel.app/

## 🔧 Step 2: Railway Environment Variables

**UPDATE these in Railway Dashboard → Your Project → Variables:**

```
DATABASE_URL=postgresql://postgres.mcgjwwpuerdjnbrofdan:zk121253%401066@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
JWT_SECRET=[your-secret-key]
SUPABASE_URL=https://mcgjwwpuerdjnbrofdan.supabase.co
SUPABASE_PUBLISHABLE_KEY=[get-from-supabase-dashboard]
SUPABASE_SECRET_KEY=[get-from-supabase-dashboard]
CLIENT_ORIGIN=https://safar-desk-flame.vercel.app
NODE_ENV=production
```

**⚠️ IMPORTANT: Set CLIENT_ORIGIN to: `https://safar-desk-flame.vercel.app`**

After updating, Railway will auto-redeploy.

---

## 🗄️ Step 3: Initialize Database Schema

Run this command from your local machine in the `server/` directory:

```bash
cd server
npm run db:push
```

This will:
- Create all database tables
- Apply schema migrations
- NOT delete existing data

---

## 🧪 Step 4: Test the Full Integration

### 4a) Test Health Endpoint (Through Vercel Proxy)
```bash
curl https://safar-desk-flame.vercel.app/api/v1/health
```

Expected Response:
```json
{"ok":true,"service":"safardesk-api"}
```

### 4b) Test Login Flow
1. Open: https://safar-desk-flame.vercel.app
2. Try signing in
3. Check browser Network tab for `/api/v1/auth/login` request
4. Verify response status is 200/201

### 4c) Test Database Persistence
1. Create a test record/document
2. Refresh the page (F5)
3. Verify the record still appears
4. Check that it's using the Supabase PostgreSQL database

---

## 📍 Endpoint Tests (After DB Schema is initialized)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/health` | GET | Database connectivity check |
| `/api/v1/auth/login` | POST | User authentication |
| `/api/v1/workspace` | GET | Fetch workspace data |
| `/api/v1/documents` | GET/POST | Document management |

---

## ⚠️ Troubleshooting

### If `/api/v1/health` returns 502/504:
- Railway service crashed: Check Railway logs
- DATABASE_URL is invalid: Verify connection string in Railway
- Client_ORIGIN mismatch: CORS may be blocking requests

### If database tables don't exist:
- `npm run db:push` was never run
- DATABASE_URL points to wrong database
- Supabase connection string is incorrect

### If login fails:
- JWT_SECRET not set in Railway
- DATABASE_URL not configured
- Client_ORIGIN causing CORS rejection

---

## 🎯 Success Criteria

✅ `/api/v1/health` returns 200 from Vercel
✅ Can login to the app
✅ Documents persist after page refresh
✅ No CORS errors in browser console
✅ No 502/504 errors from Railway

