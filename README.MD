# SD Foods - Restaurant Management System

A full-stack restaurant management system featuring delivery bidding, AI chat support with voice input, VIP membership, and real-time feedback management.

---

## Features

- **Customer Portal** - Browse menu, place orders, wallet system, VIP membership (5% discount), AI chatbot with voice input
- **Chef Dashboard** - Accept/prepare orders, mark ready for delivery, view performance stats and feedback
- **Delivery System** - Competitive bidding on deliveries, real-time order tracking, auto-refresh stats
- **Manager Portal** - Approve delivery bids, manage VIP requests, handle feedback, employee management
- **AI Chat** - Voice-enabled chatbot with knowledge base, learning from user interactions
- **Feedback System** - Automated rating-to-feedback conversion, warning system, complaint management

---

## Tech Stack

**Backend:** Flask 3.0, MySQL 8.0, Ollama (AI)  
**Frontend:** React 18, Vite 5.0, React Router, Axios  
**Database:** MySQL with delivery bidding, VIP requests, knowledge base  
**AI Model:** Phi via Ollama

---

## Prerequisites

Install the following software:

- **MySQL 8.0+** - https://dev.mysql.com/downloads/mysql/
- **Python 3.8+** - https://www.python.org/downloads/
- **Node.js 16+** - https://nodejs.org/
- **Ollama** - https://ollama.ai/download

---

## Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd sd-foods-restaurant
```

### 2. Database Setup
```bash
mysql -u root -p
CREATE DATABASE restaurant_database;
USE restaurant_database;
SOURCE new_backend/schema.sql;
exit
```

Or use Python script:
```bash
cd new_backend
python setup_database.py
```

### 3. Backend Setup
```bash
cd new_backend

# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=restaurant_database
FLASK_SECRET_KEY=change-this-secret-key
EOF

# Install dependencies
pip install flask flask-cors mysql-connector-python ollama python-dotenv

# Start server
python app.py
```

Runs on http://localhost:5000

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Runs on http://localhost:5173

### 5. AI Setup
```bash
# Download model (one-time, ~2GB)
ollama pull Phi

# Start server
ollama serve
```

Runs on http://localhost:11434

---

## Running the System

Keep 3 terminals open:

1. **Backend:** `cd new_backend && python app.py`
2. **Frontend:** `cd frontend && npm run dev`
3. **AI Chat:** `ollama serve`

Open browser to http://localhost:5173

---

## Test Accounts

| Role     | Username       | Password    |
|----------|----------------|-------------|
| Chef     | Headchef       | chef123     |
| Driver   | deliverydriver | delivery123 |
| Manager  | manager        | manager123  |

---

## System Workflow

1. **Customer** places order → Uses wallet (VIP gets 5% off)
2. **Chef** accepts and prepares → Marks ready for delivery
3. **Drivers** place bids → Multiple drivers compete
4. **Manager** approves bid → Lowest bid or higher with justification
5. **Driver** delivers order → Updates status in real-time
6. **Customer** rates order → Auto-generates feedback (4-5 stars = compliment, 1-3 = complaint)
7. **AI Chat** assists users → Knowledge base + voice input
8. **Manager** reviews feedback → Approves/dismisses complaints, manages warnings

---

## Key Packages

**Python (requirements.txt):**
- flask==3.0.0
- flask-cors==4.0.0
- mysql-connector-python==8.2.0
- ollama==0.1.0
- python-dotenv==1.0.0

**Node.js (package.json):**
- react@18.2.0
- react-router-dom@6.20.0
- axios@1.6.0
- vite@5.0.0
- lucide-react@0.294.0

---

## Troubleshooting

**Database connection failed:**
- Check MySQL is running: `mysql -u root -p`
- Verify password in `.env` file

**Port conflicts:**
- Backend (5000), Frontend (5173), MySQL (3306), Ollama (11434)
- Change ports in config files if needed

**Module not found:**
- Backend: `pip install -r requirements.txt`
- Frontend: `npm install`

**AI not responding:**
- Verify Ollama is running: `ollama list`
- Restart: `ollama serve`

**Blank pages:**
- Clear cache: Ctrl+Shift+R
- Check browser console (F12)

---

## For Teammates

Share these files:
- `schema.sql` - Database with test users
- `.env.example` - Environment template
- `db.py` - Auto-create database

Run setup:
```bash
python db.py 
```

---

## Development Notes

- Backend uses Flask blueprints for modular routes
- Frontend uses React Router for navigation
- Database supports delivery bidding, VIP requests, AI knowledge base
- Auto-refresh stats every 5 seconds in delivery dashboard
- Voice input uses Web Speech API (Chrome/Edge only)
- VIP customers get 5% discount and special privileges

---

Built with Flask, React, MySQL, and Ollama