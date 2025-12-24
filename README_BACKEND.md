# CredX Backend API

Backend system for CredX with SQLite database for user credentials, cards, and wallet management.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

### 3. Database
The SQLite database (`credx.db`) will be automatically created when you first run the server.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Cards
- `GET /api/cards` - Get user's card
- `POST /api/cards` - Create/Update card
- `DELETE /api/cards` - Delete card

### Wallet
- `GET /api/wallet/balance` - Get wallet balance
- `PUT /api/wallet/balance` - Update wallet balance
- `GET /api/wallet/transactions` - Get transactions (optional ?type=income|expense)
- `POST /api/wallet/transactions` - Add transaction
- `GET /api/wallet/stats` - Get wallet statistics

## Default Credentials
- Username: `CredX`
- Password: `credxteam`

## Frontend Integration

Include `api.js` in your HTML files and use the `CredXAPI` object:

```javascript
// Login
await CredXAPI.Auth.login('username', 'password');

// Get card
const card = await CredXAPI.Card.getCard();

// Save card
await CredXAPI.Card.saveCard({
  cardNumber: '1234567890123456',
  cardName: 'John Doe',
  cardMonth: '12',
  cardYear: '2025',
  cardBg: './path/to/image.jpg',
  cardType: 'visa'
});

// Get balance
const balance = await CredXAPI.Wallet.getBalance();

// Add transaction
await CredXAPI.Wallet.addTransaction({
  purpose: 'Coffee Shop',
  amount: -5.50,
  type: 'expense',
  status: 'Done'
});
```

