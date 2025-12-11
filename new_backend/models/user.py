from db import get_db_connection
from typing import Optional, Dict, List


class User:
    """User model for database operations"""
    
    def __init__(self, user_id=None, username=None, password_hash=None, name=None,
                 email=None, phone=None, home_address=None, role='customer',
                 total_balance=0, amount_warnings=0, vip_status=False, is_blacklisted=False):
        self.user_id = user_id
        self.username = username
        self.password_hash = password_hash
        self.name = name
        self.email = email
        self.phone = phone
        self.home_address = home_address
        self.role = role
        self.total_balance = total_balance
        self.amount_warnings = amount_warnings
        self.vip_status = vip_status
        self.is_blacklisted = is_blacklisted
    
    @staticmethod
    def create(username: str, password_hash: str, name: str, email: str, 
               phone: str, home_address: str) -> Optional[int]:
        """
        Create a new user
        
        Args:
            username: User's username
            password_hash: Hashed password
            name: User's full name
            email: Email address
            phone: Phone number
            home_address: Home address
            
        Returns:
            int: New user ID or None on failure
        """
        try:
            conn = get_db_connection()
            if not conn:
                return None
            
            cursor = conn.cursor()
            
            query = """
            INSERT INTO users (username, password_hash, name, email, phone, home_address,
                              role, total_balance, amount_warnings, vip_status, is_blacklisted)
            VALUES (%s, %s, %s, %s, %s, %s, 'customer', 0, 0, FALSE, FALSE)
            """
            
            cursor.execute(query, (username, password_hash, name, email, phone, home_address))
            conn.commit()
            
            user_id = cursor.lastrowid
            
            cursor.close()
            conn.close()
            
            return user_id
            
        except Exception as e:
            print(f"Error creating user: {e}")
            return None
    
    @staticmethod
    def find_by_id(user_id: int) -> Optional['User']:
        """
        Find user by ID
        
        Args:
            user_id: User ID to search for
            
        Returns:
            User object or None if not found
        """
        try:
            conn = get_db_connection()
            if not conn:
                return None
            
            cursor = conn.cursor(dictionary=True)
            
            query = "SELECT * FROM users WHERE user_id = %s"
            cursor.execute(query, (user_id,))
            
            result = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            if result:
                return User(
                    user_id=result['user_id'],
                    username=result['username'],
                    password_hash=result['password_hash'],
                    name=result['name'],
                    email=result['email'],
                    phone=result['phone'],
                    home_address=result['home_address'],
                    role=result['role'],
                    total_balance=float(result['total_balance']),
                    amount_warnings=result['amount_warnings'],
                    vip_status=result['vip_status'],
                    is_blacklisted=result['is_blacklisted']
                )
            
            return None
            
        except Exception as e:
            print(f"Error finding user: {e}")
            return None
    
    @staticmethod
    def find_by_username(username: str) -> Optional['User']:
        """
        Find user by username
        
        Args:
            username: Username to search for
            
        Returns:
            User object or None if not found
        """
        try:
            conn = get_db_connection()
            if not conn:
                return None
            
            cursor = conn.cursor(dictionary=True)
            
            query = "SELECT * FROM users WHERE username = %s"
            cursor.execute(query, (username,))
            
            result = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            if result:
                return User(
                    user_id=result['user_id'],
                    username=result['username'],
                    password_hash=result['password_hash'],
                    name=result['name'],
                    email=result['email'],
                    phone=result['phone'],
                    home_address=result['home_address'],
                    role=result['role'],
                    total_balance=float(result['total_balance']),
                    amount_warnings=result['amount_warnings'],
                    vip_status=result['vip_status'],
                    is_blacklisted=result['is_blacklisted']
                )
            
            return None
            
        except Exception as e:
            print(f"Error finding user: {e}")
            return None
    
    @staticmethod
    def find_by_email(email: str) -> Optional['User']:
        """
        Find user by email
        
        Args:
            email: Email to search for
            
        Returns:
            User object or None if not found
        """
        try:
            conn = get_db_connection()
            if not conn:
                return None
            
            cursor = conn.cursor(dictionary=True)
            
            query = "SELECT * FROM users WHERE email = %s"
            cursor.execute(query, (email,))
            
            result = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            if result:
                return User(**result)
            
            return None
            
        except Exception as e:
            print(f"Error finding user: {e}")
            return None
    
    @staticmethod
    def get_all(role: Optional[str] = None) -> List['User']:
        """
        Get all users, optionally filtered by role
        
        Args:
            role: Optional role filter (customer, chef, driver, manager, admin)
            
        Returns:
            List of User objects
        """
        try:
            conn = get_db_connection()
            if not conn:
                return []
            
            cursor = conn.cursor(dictionary=True)
            
            if role:
                query = "SELECT * FROM users WHERE role = %s"
                cursor.execute(query, (role,))
            else:
                query = "SELECT * FROM users"
                cursor.execute(query)
            
            results = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            users = []
            for result in results:
                users.append(User(
                    user_id=result['user_id'],
                    username=result['username'],
                    password_hash=result['password_hash'],
                    name=result['name'],
                    email=result['email'],
                    phone=result['phone'],
                    home_address=result['home_address'],
                    role=result['role'],
                    total_balance=float(result['total_balance']),
                    amount_warnings=result['amount_warnings'],
                    vip_status=result['vip_status'],
                    is_blacklisted=result['is_blacklisted']
                ))
            
            return users
            
        except Exception as e:
            print(f"Error getting users: {e}")
            return []
    
    def update_balance(self, amount: float, action: str = 'add') -> bool:
        """
        Update user's balance
        
        Args:
            amount: Amount to add or subtract
            action: 'add' or 'subtract'
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            conn = get_db_connection()
            if not conn:
                return False
            
            cursor = conn.cursor()
            
            if action == 'add':
                query = "UPDATE users SET total_balance = total_balance + %s WHERE user_id = %s"
            else:
                query = "UPDATE users SET total_balance = total_balance - %s WHERE user_id = %s"
            
            cursor.execute(query, (amount, self.user_id))
            conn.commit()
            
            # Update local balance
            if action == 'add':
                self.total_balance += amount
            else:
                self.total_balance -= amount
            
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error updating balance: {e}")
            return False
    
    def add_warning(self) -> bool:
        """
        Add a warning to the user
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            conn = get_db_connection()
            if not conn:
                return False
            
            cursor = conn.cursor()
            
            query = "UPDATE users SET amount_warnings = amount_warnings + 1 WHERE user_id = %s"
            cursor.execute(query, (self.user_id,))
            conn.commit()
            
            self.amount_warnings += 1
            
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error adding warning: {e}")
            return False
    
    def blacklist(self) -> bool:
        """
        Blacklist the user
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            conn = get_db_connection()
            if not conn:
                return False
            
            cursor = conn.cursor()
            
            query = "UPDATE users SET is_blacklisted = TRUE WHERE user_id = %s"
            cursor.execute(query, (self.user_id,))
            conn.commit()
            
            self.is_blacklisted = True
            
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error blacklisting user: {e}")
            return False
    
    def make_vip(self) -> bool:
        """
        Make user VIP
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            conn = get_db_connection()
            if not conn:
                return False
            
            cursor = conn.cursor()
            
            query = "UPDATE users SET vip_status = TRUE WHERE user_id = %s"
            cursor.execute(query, (self.user_id,))
            conn.commit()
            
            self.vip_status = True
            
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error making user VIP: {e}")
            return False
    
    def to_dict(self) -> Dict:
        """
        Convert user to dictionary (for JSON serialization)
        
        Returns:
            dict: User data
        """
        return {
            'user_id': self.user_id,
            'username': self.username,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'home_address': self.home_address,
            'role': self.role,
            'balance': float(self.total_balance),
            'warnings': self.amount_warnings,
            'vip_status': self.vip_status,
            'is_blacklisted': self.is_blacklisted
        }
    
    def __repr__(self):
        return f"<User {self.username} ({self.role})>"