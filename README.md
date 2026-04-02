# FrameKart 📸

**India's premier marketplace for visual arts professionals** — photographers, videographers, drone operators, video editors, and album designers.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS, Lucide Icons, Sonner |
| Backend | FastAPI (Python 3.12), Motor (async MongoDB driver) |
| Database | MongoDB (Atlas or self-hosted) |
| Auth | JWT (httpOnly cookies) + Google OAuth |
| Storage | Cloudinary (all file uploads) |
| Payments | Razorpay (₹99/month provider subscription) |
| Deploy | Railway / Render + MongoDB Atlas |

---

## Features

- **Auth** — Email/password + Google OAuth. JWT access (24h) + refresh (7d) via httpOnly cookies. Rate-limited login (5 attempts → 15 min lockout)
- **Two Roles** — Client (hire talent) and Provider (list gigs). Providers pay ₹99/month via Razorpay
- **Gigs** — 3 pricing tiers (Basic/Standard/Premium), Cloudinary images, tags, categories
- **Bookings** — Full status flow: pending → accepted/rejected → completed/cancelled
- **Messaging** — Real-time conversations with polling every 30s, unread badge in navbar
- **Reviews** — Star ratings + comments on completed bookings
- **Dashboard** — Stats, booking management, gig management
- **Search & Filter** — By category, subcategory, price, rating, location, keyword
- **Location Autocomplete** — 80+ Indian cities
- **Dark theme** — Black background, zinc grays, emerald green accent

---

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- MongoDB (local or Atlas)
- Cloudinary account
- Razorpay account (test keys OK)

### 1. Clone & configure

```bash
git clone https://github.com/your-username/framekart.git
cd framekart

# Backend
cp backend/.env.example backend/.env
# → Fill in MONGO_URI, JWT_SECRET, Cloudinary, Razorpay, Google OAuth

# Frontend
cp frontend/.env.example frontend/.env
# → Fill in REACT_APP_API_URL, REACT_APP_RAZORPAY_KEY_ID
```

### 2. Run backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### 3. Run frontend

```bash
cd frontend
npm install
npm start
```

App runs at **http://localhost:3000** — backend at **http://localhost:8000**

### Docker (all-in-one)

```bash
cp backend/.env.example backend/.env  # fill in secrets
docker-compose up --build
```

---

## Demo Accounts

Seeded automatically on first startup:

| Email | Password | Role |
|---|---|---|
| client@demo.com | demo123 | Client |
| arjun@demo.com | demo123 | Provider (Photography) |
| priya@demo.com | demo123 | Provider (Videography) |
| ravi@demo.com | demo123 | Provider (Drone) |
| sneha@demo.com | demo123 | Provider (Album Design) |

> In dev mode, Razorpay is **mocked** — click Subscribe to instantly activate provider access without real payment.

---

## API Reference

All endpoints prefixed with `/api/`

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login (rate-limited) |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Clear refresh cookie |
| GET | `/auth/google` | Get Google OAuth URL |
| POST | `/auth/google/callback` | Exchange code for tokens |
| GET | `/auth/me` | Current user |
| GET | `/gigs` | List/search gigs |
| GET | `/gigs/:id` | Gig detail + reviews |
| POST | `/gigs` | Create gig (provider) |
| PUT | `/gigs/:id` | Update gig |
| DELETE | `/gigs/:id` | Deactivate gig |
| POST | `/bookings` | Book a gig |
| GET | `/bookings` | My bookings |
| PATCH | `/bookings/:id/status` | Update booking status |
| GET | `/conversations` | List conversations |
| POST | `/conversations` | Get or create conversation |
| GET | `/conversations/:id/messages` | Get messages |
| POST | `/messages` | Send message |
| GET | `/messages/unread-count` | Unread badge count |
| POST | `/reviews` | Submit review |
| GET | `/dashboard/stats` | Dashboard statistics |
| GET | `/categories` | All categories + subcategories |
| GET | `/cities` | City autocomplete |
| POST | `/subscription/create-order` | Create Razorpay order |
| POST | `/subscription/verify` | Verify payment & activate |

---

## Deployment

### Railway

1. Create two services: Python (backend) and Static (frontend build)
2. Set environment variables from `.env.example`
3. Backend start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Frontend: `npm run build`, serve `build/` as static

### Render

1. Web service for backend (Python), static site for frontend
2. Set env vars in Render dashboard
3. MongoDB Atlas for database (free tier available)

---

## Security

- All secrets via environment variables — never hardcoded
- `.env` gitignored, `.env.example` committed
- CORS locked to `ALLOWED_ORIGINS`
- JWT tokens with expiry + httpOnly refresh cookies
- Cloudinary for all uploads — no local disk storage
- Password hashing with bcrypt
- Rate limiting on login endpoint
- Google OAuth via standard redirect flow

---

## Project Structure

```
framekart/
├── backend/
│   ├── server.py          # All FastAPI routes + seed data
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.css
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── lib/
│   │   │   └── api.js
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── GigCard.js
│   │   │   ├── GigForm.js
│   │   │   ├── StarRating.js
│   │   │   └── CitySearch.js
│   │   └── pages/
│   │       ├── Home.js
│   │       ├── Login.js
│   │       ├── Register.js
│   │       ├── Gigs.js
│   │       ├── GigDetail.js
│   │       ├── Dashboard.js
│   │       ├── Messages.js
│   │       ├── Subscription.js
│   │       ├── Profile.js
│   │       └── GoogleCallback.js
│   ├── public/index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## License

MIT — built for India's visual arts community 🇮🇳
