# THETA EuroCon NFT Registration - Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### 2. Clone and Setup
```bash
git clone <repository-url>
cd nft-ticket-registration

# Install dependencies
npm install

# Copy environment files
cp .env.example .env
cp packages/backend/env.example packages/backend/.env
cp packages/frontend/env.local.example packages/frontend/.env.local
```

### 3. Configure Environment Variables

#### Root (.env)
```bash
# Update these values for your setup
CHAIN_NAME=theta
CHAIN_ID=361
RPC_URL=https://eth-rpc-api.thetatoken.org/rpc
TNT721_CONTRACTS=0xYourContract1,0xYourContract2
ORG_DEPOSIT_ADDRESS=0xYourDepositAddress
```

#### Backend (.env)
```bash
# Generate a secure JWT secret (32+ characters)
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters

# Set admin wallet address
ADMIN_WALLET=0xYourAdminWalletAddress

# Update other values as needed
```

#### Frontend (.env.local)
```bash
# Update with your contract addresses
NEXT_PUBLIC_TNT721_CONTRACTS=0xYourContract1,0xYourContract2
```

### 4. Start Development
```bash
# Use the development script
./scripts/dev.sh

# Or manually
npm run dev
```

This will start:
- Backend: http://localhost:4000
- Frontend: http://localhost:3000
- Health check: http://localhost:4000/healthz

## Development Workflow

### Backend Development
```bash
cd packages/backend
npm run dev          # Start backend with hot reload
npm run build        # Build for production
npm run typecheck    # TypeScript check
```

### Frontend Development
```bash
cd packages/frontend
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run typecheck    # TypeScript check
```

### Production Build
```bash
# Build both packages
./scripts/build.sh

# Start production servers
./scripts/start.sh
```

## Project Structure

```
eucon-reg/
├── packages/
│   ├── backend/           # Express.js API server
│   │   ├── src/
│   │   │   ├── routes/    # API endpoints
│   │   │   ├── services/  # Business logic
│   │   │   ├── middlewares/ # Auth, validation, etc.
│   │   │   └── db/        # Database (lowdb)
│   │   └── .env          # Backend environment
│   └── frontend/          # Next.js frontend
│       ├── src/
│       │   ├── app/       # App Router pages
│       │   ├── components/ # React components
│       │   └── lib/       # Utilities
│       └── .env.local     # Frontend environment
├── scripts/               # Build and dev scripts
├── .env                   # Root environment
└── package.json           # Workspace configuration
```

## API Endpoints

### Authentication
- `POST /session/nonce` - Get nonce for signing
- `POST /session/siwe` - Verify signature and create session
- `POST /session/challenge/create` - Create TFuel challenge
- `POST /session/challenge/verify` - Verify challenge completion
- `GET /session/me` - Get current session info
- `POST /session/logout` - End session

### NFTs & Registration
- `POST /nfts/of` - Get user's NFTs
- `POST /registration/submit` - Submit registration(s)
- `GET /tickets` - Get user's tickets
- `GET /tickets/:id` - Get specific ticket

### Admin
- `POST /admin/login/*` - Admin authentication
- `GET /admin/registrations` - List registrations
- `PATCH /admin/registrations/:id` - Edit registration
- `GET /admin/export.csv` - Export data
- `POST /checkin/:ticketId` - Check-in ticket

## Default Admin Credentials

The system creates a default admin user:
- **Email**: admin@theta-euro.com
- **Password**: admin123
- **Wallet**: Set in ADMIN_WALLET environment variable

⚠️ **Important**: Change these credentials in production!

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Backend: Change `PORT` in `packages/backend/.env`
   - Frontend: Change port in `packages/frontend/package.json`

2. **Database errors**
   - Check file permissions for `packages/backend/src/db/`
   - Ensure `.env` files are properly configured

3. **CORS errors**
   - Update `CORS_ORIGINS` in backend `.env`
   - Check frontend API calls use correct base URL

4. **JWT errors**
   - Ensure `JWT_SECRET` is at least 32 characters
   - Check cookie settings match between frontend/backend

### Development Tips

- Use the health check endpoint to verify backend is running
- Check browser console for frontend errors
- Monitor backend logs for API errors
- Use browser dev tools to inspect cookies and requests

## Next Steps

After setup, you can:
1. Test the authentication flows
2. Implement actual blockchain NFT verification
3. Add more wallet providers
4. Enhance the admin dashboard
5. Add QR code generation for tickets
6. Implement real-time check-in system
