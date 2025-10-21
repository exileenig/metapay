# Database Setup Guide

## Step 1: Create Tables in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/dlttavfwnblfrcxlyrls
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `scripts/01-create-tables.sql`
5. Click **Run** or press `Ctrl+Enter`
6. You should see: "Success. No rows returned"

## Step 2: Create Helper Functions

1. In SQL Editor, click **New Query** again
2. Copy and paste the contents of `scripts/02-create-balance-functions.sql`
3. Click **Run**
4. You should see: "Success. No rows returned"

## Step 3: Verify Tables Were Created

Run this query in SQL Editor to verify:

\`\`\`sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
\`\`\`

You should see:
- config
- payouts
- sellers
- transactions

## Step 4: Refresh Supabase Schema Cache

**IMPORTANT:** After creating tables, you MUST restart the Supabase API to refresh the schema cache.

### Option A: Restart via Dashboard (Recommended)
1. Go to **Project Settings** → **API**
2. Click **Restart API** button
3. Wait 30-60 seconds for the restart to complete

### Option B: Wait for Auto-Refresh
Supabase automatically refreshes the schema cache every few minutes, but this can take up to 5 minutes.

## Step 5: Get Your Anon Key

1. Go to **Project Settings** → **API**
2. Copy the **anon/public** key (starts with `eyJ...`)
3. Add it to your `.env.local` file:

\`\`\`env
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
\`\`\`

## Step 6: Test the Connection

1. Restart your Next.js dev server: `npm run dev`
2. Try registering a seller at http://localhost:3000/register
3. Check the browser console and terminal for any errors

## Troubleshooting

### Error: "Could not find the table 'public.sellers' in the schema cache"

This means Supabase hasn't refreshed its schema cache yet. Solutions:

1. **Restart the Supabase API** (see Step 4 above)
2. **Wait 5 minutes** for auto-refresh
3. **Verify tables exist** using the query in Step 3
4. **Check you're using the correct project** - make sure the URL matches your `.env.local`

### Error: "Missing Supabase environment variables"

Make sure your `.env.local` file has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Tables created but still getting 404

1. Go to **Database** → **Tables** in Supabase Dashboard
2. Verify all 4 tables are visible
3. Click on `sellers` table and verify it has columns: id, email, business_name, etc.
4. If tables are there but API returns 404, **restart the Supabase API**

## Next Steps

Once the database is working:
1. Register a test seller
2. Login to admin dashboard at `/admin` with your `ADMIN_SECRET_KEY`
3. Approve the seller
4. Test creating a payment
