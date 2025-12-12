# SD Foods - Restaurant Management System

Full-stack restaurant system with delivery bidding, AI chat support, and feedback management.

---
## Quick Setup

### Requirements
- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- Ollama

### Installation

**1. Database**
```bash
mysql -u root -p
CREATE DATABASE restaurant_database;
USE restaurant_database;
source backend_modular/schema_COMPLETE_WITH_AI.sql
```

**2. Backend**
```bash
cd backend_modular

# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=restaurant_database
FLASK_SECRET_KEY=your-secret-key-here
EOF

# Install dependencies
pip install flask flask-cors mysql-connector-python ollama python-dotenv

# Run server
python app.py
```
Runs on: http://localhost:5000

**3. Frontend**
```bash
cd frontend
npm install
npm run dev
```
Runs on: http://localhost:5173

**4. AI Chat**
```bash
ollama pull llama3.2
ollama serve
```

---

## Environment Variables

Create a `.env` file in the `backend_modular/` folder:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=restaurant_database

# Flask Configuration
FLASK_SECRET_KEY=your-secret-key-here
```

**Important:** Never commit `.env` to git. Add it to `.gitignore`:
```
# .gitignore
.env
__pycache__/
*.pyc
node_modules/
```

---

## Test Accounts

| Role     | Username  | Password    |
|----------|-----------|-------------|
| Customer | john      | john        |
| Chef     | chef1     | chef123     |
| Driver   | driver1   | driver123   |
| Manager  | manager   | manager123  |

---

## Features

**Customer**
- Browse menu and place orders
- Wallet system with VIP discount (5%)
- Rate orders and give feedback
- AI chatbot support with voice input
- Submit complaints and compliments

**Chef**
- Accept and prepare orders
- Mark orders ready for delivery
- View stats and ratings
- Receive feedback from customers

**Delivery Driver**
- Bid on available deliveries
- Lowest bid highlighted
- Pick up and deliver orders
- Real-time stats updates
- Submit feedback about customers

**Manager**
- Approve/reject delivery bids
- Approve/reject VIP requests
- Manage employees (promote/demote/fire)
- Review and manage all feedback
- Review AI chat knowledge base entries

---

## Tech Stack

- Backend: Flask + MySQL
- Frontend: React + Vite
- AI: Ollama (Model: Phi)

---

## Complete System Workflow

**1. Customer places order**
   - Browses menu and adds items to cart
   - Uses wallet balance (VIP gets 5% discount)
   - Order created with status: Pending

**2. Chef accepts and prepares order**
   - Chef sees order in dashboard
   - Clicks "Accept" to start preparing
   - Order status changes to: Preparing

**3. Chef marks order ready for delivery**
   - Chef completes cooking
   - Marks order as "Ready for Delivery"
   - Order now available for driver bidding

**4. Drivers bid on the order**
   - Multiple drivers see the order
   - Each driver enters their bid amount
   - System highlights the lowest bid
   - Drivers can update their bids

**5. Manager approves bid**
   - Manager reviews all bids for each order
   - Can approve lowest bid instantly
   - Higher bids require written justification
   - Approved driver gets order assigned

**6. Driver delivers order**
   - Driver picks up order from restaurant
   - Updates status to "Out for Delivery"
   - Delivers to customer address
   - Marks order as "Delivered"

**7. Customer rates food and delivery**
   - Customer rates food quality (1-5 stars)
   - Customer rates delivery service (1-5 stars)
   - Ratings automatically generate feedback:
     - 4-5 stars = Compliment
     - 1-3 stars = Complaint

**8. AI Chat & Feedback System**
   
   **AI Chatbot:**
   - Customers can ask questions via text or voice input
   - Voice recognition for hands-free interaction
   - AI searches knowledge base first for accurate answers
   - Falls back to general AI if no match found
   - Users can rate responses (helpful/not helpful)
   - Flagged responses go to manager for review
   
   **Feedback Management:**
   - Customers can submit complaints about food or service
   - Drivers can submit feedback about customers
   - Chefs receive feedback on food quality
   - Manager reviews all complaints
   - Manager can approve (adds warning) or dismiss (warns reporter)
   - Employees and customers see feedback in their dashboards
   - Auto-refresh keeps feedback stats updated
   
   **Knowledge Base:**
   - Users can submit new Q&A pairs
   - Submissions go to manager for approval
   - Manager reviews and approves/rejects entries
   - Approved entries added to AI knowledge base
   - System learns from user interactions

---
## Troubleshooting

**Database connection failed**
```bash
# Check .env file exists and has correct password
cat backend_modular/.env

# Test MySQL connection
mysql -u root -p restaurant_database
```
**AI chat not responding**
```bash
# Check Ollama is running
ollama list
ollama serve

# Test model
ollama run llama3.2
```

**Voice input not working**
```
# Ensure browser supports Web Speech API
# Works in Chrome, Edge (not Firefox)
# Check microphone permissions in browser settings
```

**Module not found: python-dotenv**
```bash
pip install python-dotenv
```

**Clear browser cache**
```
Ctrl + Shift + R
```

---

Built with Flask, React, MySQL, and Ollama