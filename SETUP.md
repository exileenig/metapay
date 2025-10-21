# MetaPay Setup Guide

## Prerequisites

1. A Supabase account and project
2. A SellAuth account with API access
3. Node.js 18+ installed

## Step 1: Create Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** (left sidebar)
3. Create a new query
4. Copy and paste the contents of `scripts/01-create-tables.sql`
5. Click **Run** to execute the script
6. Create another new query
7. Copy and paste the contents of `scripts/02-create-balance-functions.sql`
8. Click **Run** to execute the script

You should see success messages indicating all tables and functions were created.

## Step 2: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **service_role key** (under "Project API keys" - this is the secret key)

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in the root of your project
2. Copy the contents from `.env.example`
3. Fill in the values:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your-project-url-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# SellAuth Configuration
SELLAUTH_TOKEN="your-sellauth-api-token"
MASTER_SHOP_ID="your-shop-id"
DUMMY_PRODUCT_ID="your-dummy-product-id"
DUMMY_VARIANT_ID="your-dummy-variant-id"

# Admin Secret Key (generate with: openssl rand -hex 32)
ADMIN_SECRET_KEY="generate-a-strong-random-string"

# SellAuth Webhook IPs (comma-separated, get from SellAuth docs)
SELLAUTH_IPS="1.2.3.4,5.6.7.8"

# Binance API for crypto rates
BINANCE_API_URL="https://api.binance.com"
\`\`\`

### Generating Admin Secret Key

Run this command in your terminal to generate a secure admin secret key:

\`\`\`bash
openssl rand -hex 32
\`\`\`

Copy the output and paste it as your `ADMIN_SECRET_KEY` value.

## Step 4: SellAuth Setup

1. Log in to your SellAuth dashboard
2. Create a **dummy product** priced at **$0.01**
3. Note the Product ID and Variant ID
4. Create an API token with full permissions
5. Add these values to your `.env.local` file

## Step 5: Install Dependencies and Run

\`\`\`bash
npm install
npm run dev
\`\`\`

Your MetaPay platform should now be running at `http://localhost:3000`

## Step 6: Access Admin Dashboard

1. Navigate to `http://localhost:3000/admin`
2. Enter the `ADMIN_SECRET_KEY` value from your `.env.local` file
3. You should now have access to the admin dashboard

## Step 7: Test Seller Registration

1. Go to `http://localhost:3000/register`
2. Fill out the seller registration form
3. Check the admin dashboard to approve the seller
4. Use the generated API key to access the seller dashboard

## Troubleshooting

### "Could not find the table 'public.sellers' in the schema cache"

This means the database tables haven't been created yet. Make sure you ran both SQL scripts in the Supabase SQL Editor.

### Admin login not working

Make sure the `ADMIN_SECRET_KEY` in your `.env.local` file exactly matches what you're entering in the admin login form. It's case-sensitive.

### Seller login not working

Make sure the seller has been approved by an admin first. Only approved sellers can log in.

## API Documentation

### Seller Endpoints

All seller endpoints require the `Authorization: Bearer <api_key>` header.

- `POST /api/v1/payments` - Create a new payment
- `GET /api/v1/invoices` - List all invoices
- `GET /api/v1/invoices/[id]` - Get invoice details
- `POST /api/v1/payouts` - Request a payout
- `GET /api/v1/payouts` - List all payouts
- `GET /api/v1/profile` - Get seller profile
- `PUT /api/v1/profile` - Update seller profile

### Admin Endpoints

All admin endpoints require the `x-admin-secret: <admin_secret_key>` header.

- `GET /api/v1/admin/sellers` - List all sellers
- `POST /api/v1/admin/approve-seller` - Approve a seller
- `GET /api/v1/admin/transactions` - List all transactions
- `GET /api/v1/admin/payouts` - List all payout requests
- `POST /api/v1/admin/payouts` - Approve/reject payout
- `GET /api/v1/admin/config/fees` - Get fee configuration
- `PUT /api/v1/admin/config/fees` - Update fee configuration

### Webhook Endpoint

- `POST /api/v1/webhooks/sellauth` - SellAuth webhook handler

Configure this URL in your SellAuth dashboard to receive payment notifications.
