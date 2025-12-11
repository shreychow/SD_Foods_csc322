import re
from typing import Dict, List, Optional


def validate_email(email: str) -> bool:
    """
    Validate email format
    
    Args:
        email (str): Email address to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """
    Validate phone number (basic validation)
    
    Args:
        phone (str): Phone number to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    # Remove common separators
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    # Check if it's 10-15 digits
    return bool(re.match(r'^\d{10,15}$', cleaned))


def validate_username(username: str) -> Dict[str, any]:
    """
    Validate username format
    
    Args:
        username (str): Username to validate
        
    Returns:
        dict: {"valid": bool, "message": str}
    """
    if len(username) < 3:
        return {"valid": False, "message": "Username must be at least 3 characters"}
    
    if len(username) > 50:
        return {"valid": False, "message": "Username must be less than 50 characters"}
    
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return {"valid": False, "message": "Username can only contain letters, numbers, and underscores"}
    
    return {"valid": True, "message": "Valid username"}


def validate_password(password: str) -> Dict[str, any]:
    """
    Validate password strength
    
    Args:
        password (str): Password to validate
        
    Returns:
        dict: {"valid": bool, "message": str}
    """
    if len(password) < 6:
        return {"valid": False, "message": "Password must be at least 6 characters"}
    
    if len(password) > 100:
        return {"valid": False, "message": "Password is too long"}
    
    # Optional: Add more strict requirements
    # has_upper = bool(re.search(r'[A-Z]', password))
    # has_lower = bool(re.search(r'[a-z]', password))
    # has_digit = bool(re.search(r'\d', password))
    
    return {"valid": True, "message": "Valid password"}


def validate_price(price: float) -> bool:
    """
    Validate price value
    
    Args:
        price (float): Price to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    return isinstance(price, (int, float)) and price >= 0 and price <= 10000


def validate_quantity(quantity: int) -> bool:
    """
    Validate quantity value
    
    Args:
        quantity (int): Quantity to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    return isinstance(quantity, int) and quantity > 0 and quantity <= 100


def sanitize_input(text: str, max_length: int = 500) -> str:
    """
    Sanitize text input
    
    Args:
        text (str): Text to sanitize
        max_length (int): Maximum allowed length
        
    Returns:
        str: Sanitized text
    """
    if not text:
        return ""
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    # Limit length
    if len(text) > max_length:
        text = text[:max_length]
    
    return text


def validate_registration_data(data: Dict) -> Dict[str, any]:
    """
    Validate user registration data
    
    Args:
        data (dict): Registration data
        
    Returns:
        dict: {"valid": bool, "errors": List[str]}
    """
    errors = []
    
    # Check required fields
    required_fields = ['username', 'password', 'name', 'email', 'home_address']
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f"{field} is required")
    
    # Validate username
    if 'username' in data:
        username_check = validate_username(data['username'])
        if not username_check['valid']:
            errors.append(username_check['message'])
    
    # Validate password
    if 'password' in data:
        password_check = validate_password(data['password'])
        if not password_check['valid']:
            errors.append(password_check['message'])
    
    # Validate email
    if 'email' in data and not validate_email(data['email']):
        errors.append("Invalid email format")
    
    # Validate phone (if provided)
    if 'phone' in data and data['phone'] and not validate_phone(data['phone']):
        errors.append("Invalid phone number format")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }


def validate_order_data(data: Dict) -> Dict[str, any]:
    """
    Validate order creation data
    
    Args:
        data (dict): Order data
        
    Returns:
        dict: {"valid": bool, "errors": List[str]}
    """
    errors = []
    
    # Check required fields
    required_fields = ['customer_id', 'items', 'delivery_address', 'total_amount']
    for field in required_fields:
        if field not in data:
            errors.append(f"{field} is required")
    
    # Validate items
    if 'items' in data:
        if not isinstance(data['items'], list) or len(data['items']) == 0:
            errors.append("Order must contain at least one item")
        else:
            for idx, item in enumerate(data['items']):
                if 'dish_id' not in item or 'quantity' not in item or 'price' not in item:
                    errors.append(f"Item {idx + 1} is missing required fields")
                elif not validate_quantity(item['quantity']):
                    errors.append(f"Item {idx + 1} has invalid quantity")
                elif not validate_price(item['price']):
                    errors.append(f"Item {idx + 1} has invalid price")
    
    # Validate total amount
    if 'total_amount' in data and not validate_price(data['total_amount']):
        errors.append("Invalid total amount")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }