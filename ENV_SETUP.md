# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the **root directory** of your project (same level as `package.json`) with the following variables:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://dlttavfwnblfrcxlyrls.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdHRhdmZ3bmJsZnJjeGx5cmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA2OTYzOCwiZXhwIjoyMDc2NjQ1NjM4fQ.ZS6Yp2bMknBxi0Re54k1lrY8b9vhscJ3Ukm1-ALRSAY
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# SellAuth Configuration
SELLAUTH_TOKEN=5293070|TDXAko3e1zOaupNW67hvLDGWEcI04cB4hlRlXl6g338a34b8
MASTER_SHOP_ID=1277
DUMMY_PRODUCT_ID=502976
DUMMY_VARIANT_ID=747170

# Admin Secret Key
ADMIN_SECRET_KEY=a9f3b2c1d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e2f3

# SellAuth Webhook IPs (comma-separated)
SELLAUTH_IPS=1.2.3.4,5.6.7.8

# Binance API for crypto rates
BINANCE_API_URL=https://api.binance.com
\`\`\`

## Important Steps

1. **Create the file**: Make sure `.env.local` is in the root directory (same folder as `package.json`)

2. **Copy the values**: Copy the exact values from above into your `.env.local` file

3. **Restart the dev server**: After creating or updating `.env.local`, you MUST restart your Next.js development server:
   - Stop the server (Ctrl+C or Cmd+C)
   - Start it again with `npm run dev` or `yarn dev`

4. **Verify**: Visit `/api/v1/test` to check if environment variables are loaded correctly

## Troubleshooting

If you still see "Missing Supabase environment variables":

1. Check that `.env.local` is in the root directory (not in a subdirectory)
2. Make sure there are no syntax errors (no spaces around `=`, no quotes needed)
3. Restart the dev server completely
4. Check the terminal for any error messages when the server starts
