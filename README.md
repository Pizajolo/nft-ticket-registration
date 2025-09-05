# THETA EuroCon NFT Registration System

A comprehensive NFT registration and ticket management system for THETA EuroCon, built with Next.js frontend and Express.js backend.

## Features

- **Dual Authentication Methods**: SIWE-style message signing or TFuel micro-transfer challenge
- **NFT Ownership Verification**: Automatic detection of user's NFTs from specified contracts
- **Ticket Generation**: Unique QR codes for each registered NFT
- **Admin Portal**: Comprehensive management dashboard with CSV export
- **Check-in System**: QR scanner for event check-in
- **Session Management**: Secure 1-hour cookie-based sessions

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript, lowdb (JSON storage)
- **Blockchain**: Theta EVM, ethers.js, viem
- **Authentication**: JWT, HttpOnly cookies, CSRF protection
- **Wallet Support**: Reown WalletConnect, Magic Link, ThetaPass

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nft-ticket-registration
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy and configure environment files
cp .env.example .env
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.local.example packages/frontend/.env.local
```

4. Start development servers:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Environment Configuration

### Root (.env)
```
CHAIN_NAME=theta
CHAIN_ID=361
RPC_URL=https://...
TNT721_CONTRACTS=0xTicketNft1,0xTicketNft2
ORG_DEPOSIT_ADDRESS=0x...
CHALLENGE_TTL_SECONDS=300
CHALLENGE_MIN_AMOUNT=0.0001
SESSION_COOKIE_NAME=eucon_sess
SESSION_TTL_SECONDS=3600
CSRF_COOKIE_NAME=eucon_csrf
```

### Backend (.env)
```
PORT=4000
JWT_SECRET=your-secret-here
ADMIN_PASSWORD_HASH=bcrypt-hash
ADMIN_WALLET=0x...
BASE_URL=http://localhost:4000
DB_FILE=./src/db/db.json
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_CHAIN_ID=361
NEXT_PUBLIC_RPC_URL=https://...
NEXT_PUBLIC_API_BASE=http://localhost:4000
NEXT_PUBLIC_TNT721_CONTRACTS=0xTicketNft1,0xTicketNft2
```

## Project Structure

```
eucon-reg/
├── packages/
│   ├── frontend/          # Next.js frontend
│   └── backend/           # Express.js backend
├── scripts/               # Build and deployment scripts
└── package.json           # Root workspace configuration
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

## Development

### Available Scripts

- `npm run dev` - Start development servers
- `npm run build` - Build all packages
- `npm run start` - Start production servers
- `npm run lint` - Run linting
- `npm run typecheck` - Run TypeScript checks

### Adding Dependencies

- **Root dependencies**: `npm add -w <package>`
- **Package-specific**: `npm add <package> --workspace=packages/<package-name>`

## Security Features

- HttpOnly, SameSite=Lax cookies
- CSRF protection with double-submit tokens
- Rate limiting per IP and wallet
- Input validation with Zod
- JWT-based session management
- Secure admin authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
