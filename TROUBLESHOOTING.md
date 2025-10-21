# MetaPay Troubleshooting Guide

## Database Setup Issues

### Error: "Could not find the table 'public.sellers' in the schema cache"

**Cause**: The database tables haven't been created in Supabase yet.

**Solution**:
1. Open your Supabase project dashboard at https://supabase.com/dashboard
2. Click on your project (dlttavfwnblfrcxlyrls)
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `scripts/01-create-tables.sql` from this project
6. Paste it into the SQL editor
7. Click **Run** (or press Ctrl/Cmd + Enter)
8. You should see a success message
9. Repeat steps 4-7 with `scripts/02-create-balance-functions.sql`

**Verify tables were created**:
- In Supabase, go to **Table Editor** in the left sidebar
- You should see: `sellers`, `transactions`, `payouts`, and `config` tables

---

## Authentication Issues

### Admin Login Not Working

**Symptoms**: 
- Entering admin secret key shows "Unauthorized" or "Failed to verify admin"
- Can't access admin dashboard

**Solution**:
1. Check your `.env.local` file has `ADMIN_SECRET_KEY` set
2. Make sure you're entering the EXACT same value (case-sensitive, no extra spaces)
3. The admin secret key should be a long random string like: `a9f3b2c1d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e2f3`
4. Restart your dev server after changing `.env.local`: `npm run dev`

**Generate a new admin key**:
\`\`\`bash
openssl rand -hex 32
\`\`\`

### Seller Login Shows "Failed to fetch profile"

**Symptoms**:
- Entering API key shows "Failed to fetch profile" error
- Can't access seller dashboard

**Possible causes and solutions**:

1. **Database tables not created**
   - Follow the "Database Setup Issues" section above

2. **Seller not approved yet**
   - Sellers must be approved by an admin before they can log in
   - Go to `/admin` → Sellers tab → Approve the seller

3. **Wrong API key**
   - Make sure you're using the API key shown after registration
   - API keys are case-sensitive

4. **Supabase credentials wrong**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
   - Get these from Supabase Dashboard → Settings → API

---

## Environment Variable Issues

### Missing Environment Variables

If you see errors about missing environment variables:

1. Create a `.env.local` file in the root directory (same level as `package.json`)
2. Copy all contents from `.env.example`
3. Fill in your actual values
4. Restart the dev server

**Required variables**:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (secret)
- `ADMIN_SECRET_KEY` - A secure random string you generate
- `SELLAUTH_TOKEN` - Your SellAuth API token
- `MASTER_SHOP_ID` - Your SellAuth shop ID
- `DUMMY_PRODUCT_ID` - A product in your SellAuth shop priced at $0.01
- `DUMMY_VARIANT_ID` - The variant ID of that product

---

## SellAuth Integration Issues

### Payments Not Creating

**Check**:
1. `SELLAUTH_TOKEN` is valid and has API permissions
2. `DUMMY_PRODUCT_ID` and `DUMMY_VARIANT_ID` exist in your SellAuth shop
3. The dummy product is priced at exactly $0.01
4. Your SellAuth shop is active

### Webhooks Not Working

**Setup**:
1. In SellAuth dashboard, go to Settings → Webhooks
2. Add your webhook URL: `https://yourdomain.com/api/v1/webhooks/sellauth`
3. For local testing, use a tool like ngrok to expose your local server
4. Make sure `SELLAUTH_IPS` in `.env.local` matches the IPs SellAuth uses

---

## Common Development Issues

### Port Already in Use

If you see "Port 3000 is already in use":

\`\`\`bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
\`\`\`

### Module Not Found Errors

\`\`\`bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
\`\`\`

### TypeScript Errors

\`\`\`bash
# Regenerate TypeScript types
npm run build
\`\`\`

---

## Getting Help

If you're still having issues:

1. Check the browser console for error messages (F12 → Console tab)
2. Check the terminal where `npm run dev` is running for server errors
3. Look for `[v0]` prefixed console logs that show what's happening
4. Verify all environment variables are set correctly
5. Make sure the Supabase database tables are created

**Quick Checklist**:
- [ ] Supabase tables created (run both SQL scripts)
- [ ] `.env.local` file exists with all variables filled
- [ ] Dev server restarted after changing `.env.local`
- [ ] Admin secret key matches exactly between `.env.local` and login form
- [ ] Sellers are approved before trying to log in
