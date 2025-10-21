# MetaPay

Privacy-focused payment gateway that proxies SellAuth for credit card processing with crypto payouts.

## Features

- Credit card payments via SellAuth (NMI gateway)
- Manual crypto payouts: USDC (Solana/BSC) and Litecoin
- Configurable fees (customer surcharge + seller deduction)
- Admin dashboard for seller management and payout approval
- Seller dashboard for invoices and payout requests

## Setup

### 1. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# SellAuth Configuration
SELLAUTH_TOKEN="your-sellauth-token"
MASTER_SHOP_ID="your-shop-id"
DUMMY_PRODUCT_ID="your-product-id"
DUMMY_VARIANT_ID="your-variant-id"

# Admin Secret Key (generate with: openssl rand -hex 32)
ADMIN_SECRET_KEY="your-secure-random-string"

# SellAuth Webhook IPs (comma-separated)
SELLAUTH_IPS="1.2.3.4,5.6.7.8"

# Binance API for crypto rates
BINANCE_API_URL="https://api.binance.com"
\`\`\`

**Important Notes:**
- **ADMIN_SECRET_KEY**: Generate a strong random string using `openssl rand -hex 32` or any secure random generator. This is used to access the admin dashboard at `/admin`.
- **Supabase**: Get your URL and service role key from your Supabase project settings.
- **SellAuth**: Create a dummy product priced at $0.01 in your SellAuth shop. Payments are processed by adjusting the quantity.

### 3. Initialize Supabase database

Run the SQL scripts in the `scripts` folder in your Supabase SQL editor:

1. `01-create-tables.sql` - Creates tables
2. `02-create-balance-functions.sql` - Creates helper functions

### 4. Run development server

\`\`\`bash
npm run dev
\`\`\`

Visit:
- Landing page: `http://localhost:3000`
- Seller registration: `http://localhost:3000/register`
- Seller dashboard: `http://localhost:3000/dashboard`
- Admin dashboard: `http://localhost:3000/admin`

## API Endpoints

### Public
- `POST /api/v1/sellers/register` - Register new seller
- `POST /api/v1/webhooks/sellauth` - SellAuth webhook handler

### Authenticated (Bearer token)
- `GET /api/v1/profile` - Get seller profile
- `PUT /api/v1/profile` - Update profile/wallets
- `POST /api/v1/payments` - Create payment
- `GET /api/v1/invoices` - List invoices
- `GET /api/v1/invoices/:id` - Get invoice details
- `POST /api/v1/refunds/:id` - Refund payment
- `POST /api/v1/payouts` - Request payout
- `GET /api/v1/payouts` - List payouts

### Admin (x-admin-secret header)
- `POST /api/v1/admin/verify` - Verify admin secret
- `GET /api/v1/admin/sellers` - List sellers
- `POST /api/v1/admin/approve-seller` - Approve seller
- `GET /api/v1/admin/transactions` - List all transactions
- `GET /api/v1/admin/payouts` - List payout requests
- `POST /api/v1/admin/payouts` - Approve/reject payout
- `GET /api/v1/admin/config/fees` - Get fee config
- `POST /api/v1/admin/config/fees` - Update fees

## Usage Flow

### For Sellers

1. **Register**: Go to `/register` and fill in business details
2. **Wait for approval**: Admin reviews and approves your account
3. **Login**: Use your API key at `/dashboard` to access your account
4. **Configure wallets**: Add your crypto wallet addresses in the Profile tab
5. **Integrate API**: Use your API key to create payments via the API
6. **Request payouts**: When you have balance, request a payout in your preferred crypto
7. **Receive funds**: Admin manually sends crypto and approves your payout

### For Admins

1. **Login**: Go to `/admin` and enter your `ADMIN_SECRET_KEY`
2. **Approve sellers**: Review and approve new seller registrations
3. **Monitor transactions**: View all platform transactions
4. **Process payouts**: 
   - Review payout requests
   - Manually send crypto to seller's wallet
   - Enter transaction hash and approve the payout
5. **Configure fees**: Adjust global or per-seller fee rates

## Fee Structure

- **Customer fee**: 15% (default, added as surcharge to payment)
- **Seller fee**: 10% (default, deducted from payout amount)
- Both configurable globally or per-seller via admin dashboard

## Payout System

Payouts are **manual** for security:

1. Seller requests payout with desired crypto type
2. Admin reviews request in admin dashboard
3. Admin manually sends crypto to seller's wallet address
4. Admin enters transaction hash and approves payout
5. Seller's balance is deducted and payout marked as completed

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Supabase (PostgreSQL)
- SellAuth API
- Tailwind CSS + shadcn/ui

## Security Notes

- Keep `ADMIN_SECRET_KEY` secure and never commit it to version control
- Use Supabase Row Level Security (RLS) policies in production
- Validate all webhook requests from SellAuth using IP whitelist
- Store API keys securely and never expose them client-side
