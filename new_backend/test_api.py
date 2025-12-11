"""
Test script for SD Foods Backend API
Run this after starting the Flask server to test all endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_endpoint(method, endpoint, data=None, description=""):
    print(f"\n🧪 Testing: {description}")
    print(f"   {method} {endpoint}")
    
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}")
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", json=data)
        elif method == "PUT":
            response = requests.put(f"{BASE_URL}{endpoint}", json=data)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code < 400:
            print(f"   ✅ Success")
            if response.text:
                try:
                    print(f"   Response: {json.dumps(response.json(), indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
        else:
            print(f"   ❌ Failed")
            print(f"   Error: {response.text}")
        
        return response
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return None

def main():
    print("\n" + "🍕"*30)
    print("  SD Foods Backend API Test Suite")
    print("🍕"*30)
    
    # Health Check
    print_section("1. HEALTH CHECK")
    test_endpoint("GET", "/health", description="Health check")
    
    # Authentication
    print_section("2. AUTHENTICATION")
    
    # Register
    register_data = {
        "username": "testuser123",
        "password": "password123",
        "name": "Test User",
        "email": "testuser@example.com",
        "phone": "5551234567",
        "home_address": "123 Test St, New York, NY, 10001"
    }
    test_endpoint("POST", "/auth/register", register_data, "Register new user")
    
    # Login
    login_data = {
        "username": "username123",  # From sample data
        "password": "password123"
    }
    response = test_endpoint("POST", "/auth/login", login_data, "Login user")
    
    user_id = None
    if response and response.status_code == 200:
        user_id = response.json().get('customer_id')
        print(f"   📝 User ID: {user_id}")
    
    # Menu
    print_section("3. MENU")
    test_endpoint("GET", "/menu", description="Get all menu items")
    test_endpoint("GET", "/menu/1", description="Get specific menu item")
    
    # Orders
    print_section("4. ORDERS")
    if user_id:
        order_data = {
            "customer_id": user_id,
            "items": [
                {"dish_id": 1, "quantity": 2, "price": 29.99}
            ],
            "delivery_address": "160 Convent Ave, New York, NY, 10031",
            "phone": "5551234567",
            "total_amount": 59.98
        }
        test_endpoint("POST", "/orders/", order_data, "Create new order")
    
    test_endpoint("GET", "/orders/history", description="Get order history")
    
    # Reservations
    print_section("5. RESERVATIONS")
    if user_id:
        reservation_data = {
            "customer_id": user_id,
            "table_id": 1,
            "reservation_date": "2025-12-15",
            "reservation_time": "19:00:00",
            "duration": 90,
            "number_of_guests": 4,
            "special_request": "Window seat please"
        }
        test_endpoint("POST", "/reservations/", reservation_data, "Create reservation")
    
    test_endpoint("GET", "/reservations/", description="Get all reservations")
    
    # Chat
    print_section("6. AI CHAT")
    chat_data = {
        "message": "What's on the menu?",
        "customer_id": user_id
    }
    test_endpoint("POST", "/chat/", chat_data, "Chat with AI assistant")
    
    # Chef Routes
    print_section("7. CHEF ROUTES")
    test_endpoint("GET", "/chef/orders", description="Get chef orders")
    
    # Delivery Routes
    print_section("8. DELIVERY ROUTES")
    test_endpoint("GET", "/delivery/orders", description="Get delivery orders")
    
    # Manager Routes
    print_section("9. MANAGER ROUTES")
    test_endpoint("GET", "/manager/feedback", description="Get pending feedback")
    
    # User Routes
    print_section("10. USER ROUTES")
    if user_id:
        test_endpoint("GET", f"/users/{user_id}", description="Get user details")
        
        balance_data = {
            "action": "add",
            "amount": 50.00
        }
        test_endpoint("PUT", f"/users/{user_id}/balance", balance_data, "Add to balance")
    
    print("\n" + "🎉"*30)
    print("  Test Suite Complete!")
    print("🎉"*30 + "\n")

if __name__ == "__main__":
    print("\n⚠️  Make sure the Flask server is running on http://localhost:5000")
    print("   Run: python app.py\n")
    
    try:
        input("Press Enter to start tests...")
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Tests cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Error running tests: {str(e)}")