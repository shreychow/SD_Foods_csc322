from db import get_db_connection
from typing import Optional, Dict, List
from datetime import datetime, timedelta


class Order:
    """Order model for database operations"""
    
    def __init__(self, order_id=None, customer_id=None, delivered_by=None,
                 delivered_to=None, delivery_status='Pending', total_price=0,
                 delivery_date=None, delivery_time=None, created_at=None):
        self.order_id = order_id
        self.customer_id = customer_id
        self.delivered_by = delivered_by
        self.delivered_to = delivered_to
        self.delivery_status = delivery_status
        self.total_price = total_price
        self.delivery_date = delivery_date
        self.delivery_time = delivery_time
        self.created_at = created_at
        self.items = []
    
    @staticmethod
    def create(customer_id: int, delivered_to: str, total_price: float,
               items: List[Dict], delivered_by: Optional[int] = None) -> Optional[int]:
        """
        Create a new order
        
        Args:
            customer_id: Customer ID
            delivered_to: Delivery address
            total_price: Total order price
            items: List of order items [{"dish_id": int, "quantity": int, "price": float}]
            delivered_by: Delivery person ID (optional)
            
        Returns:
            int: New order ID or None on failure
        """
        try:
            conn = get_db_connection()
            if not conn:
                return None
            
            cursor = conn.cursor()
            
            # Find a delivery person if not specified
            if not delivered_by:
                cursor.execute("SELECT user_id FROM users WHERE role = 'driver' LIMIT 1")
                driver_result = cursor.fetchone()
                delivered_by = driver_result[0] if driver_result else customer_id
            
            # Set delivery for tomorrow
            delivery_date = (datetime.now() + timedelta(days=1)).date()
            delivery_time = datetime.now().time()
            
            # Create order
            order_query = """
            INSERT INTO orders (customer_id, delivered_by, delivered_to, delivery_status,
                               total_price, delivery_date, delivery_time)
            VALUES (%s, %s, %s, 'Pending', %s, %s, %s)
            """
            
            cursor.execute(order_query, (
                customer_id, delivered_by, delivered_to, total_price, delivery_date, delivery_time
            ))
            
            order_id = cursor.lastrowid
            
            # Add order items
            for item in items:
                item_query = """
                INSERT INTO order_items (order_id, item_id, quantity, item_price)
                VALUES (%s, %s, %s, %s)
                """
                cursor.execute(item_query, (
                    order_id, item['dish_id'], item['quantity'], item['price']
                ))
            
            # Deduct from customer balance
            cursor.execute(
                "UPDATE users SET total_balance = total_balance - %s WHERE user_id = %s",
                (total_price, customer_id)
            )
            
            # Create payment record
            payment_query = """
            INSERT INTO payment (order_id, payed_by, amount_paid, payment_successful)
            VALUES (%s, %s, %s, TRUE)
            """
            cursor.execute(payment_query, (order_id, customer_id, total_price))
            
            # Create notification
            notif_query = """
            INSERT INTO notifications (notify_user, message, is_read)
            VALUES (%s, %s, FALSE)
            """
            cursor.execute(notif_query, (
                customer_id,
                f"Your order #{order_id} has been placed successfully!"
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return order_id
            
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Error creating order: {e}")
            return None
    
    @staticmethod
    def find_by_id(order_id: int) -> Optional['Order']:
        """
        Find order by ID
        
        Args:
            order_id: Order ID to search for
            
        Returns:
            Order object or None if not found
        """
        try:
            conn = get_db_connection()
            if not conn:
                return None
            
            cursor = conn.cursor(dictionary=True)
            
            query = "SELECT * FROM orders WHERE order_id = %s"
            cursor.execute(query, (order_id,))
            
            result = cursor.fetchone()
            
            if not result:
                cursor.close()
                conn.close()
                return None
            
            order = Order(
                order_id=result['order_id'],
                customer_id=result['customer_id'],
                delivered_by=result['delivered_by'],
                delivered_to=result['delivered_to'],
                delivery_status=result['delivery_status'],
                total_price=float(result['total_price']),
                delivery_date=result['delivery_date'],
                delivery_time=result['delivery_time'],
                created_at=result['created_at']
            )
            
            # Get order items
            cursor.execute("""
                SELECT oi.*, m.name, m.image_url
                FROM order_items oi
                JOIN menu_items m ON oi.item_id = m.item_id
                WHERE oi.order_id = %s
            """, (order_id,))
            
            order.items = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return order
            
        except Exception as e:
            print(f"Error finding order: {e}")
            return None
    
    @staticmethod
    def get_by_customer(customer_id: int) -> List['Order']:
        """
        Get all orders for a customer
        
        Args:
            customer_id: Customer ID
            
        Returns:
            List of Order objects
        """
        try:
            conn = get_db_connection()
            if not conn:
                return []
            
            cursor = conn.cursor(dictionary=True)
            
            query = """
            SELECT o.*, u.name as customer_name
            FROM orders o
            JOIN users u ON o.customer_id = u.user_id
            WHERE o.customer_id = %s
            ORDER BY o.created_at DESC
            """
            cursor.execute(query, (customer_id,))
            
            results = cursor.fetchall()
            orders = []
            
            for result in results:
                order = Order(
                    order_id=result['order_id'],
                    customer_id=result['customer_id'],
                    delivered_by=result['delivered_by'],
                    delivered_to=result['delivered_to'],
                    delivery_status=result['delivery_status'],
                    total_price=float(result['total_price']),
                    delivery_date=result['delivery_date'],
                    delivery_time=result['delivery_time'],
                    created_at=result['created_at']
                )
                
                # Get items for this order
                cursor.execute("""
                    SELECT oi.*, m.name, m.image_url
                    FROM order_items oi
                    JOIN menu_items m ON oi.item_id = m.item_id
                    WHERE oi.order_id = %s
                """, (order.order_id,))
                
                order.items = cursor.fetchall()
                orders.append(order)
            
            cursor.close()
            conn.close()
            
            return orders
            
        except Exception as e:
            print(f"Error getting customer orders: {e}")
            return []
    
    @staticmethod
    def get_by_status(status: str) -> List['Order']:
        """
        Get all orders with a specific status
        
        Args:
            status: Order status (Pending, Preparing, Ready for Delivery, etc.)
            
        Returns:
            List of Order objects
        """
        try:
            conn = get_db_connection()
            if not conn:
                return []
            
            cursor = conn.cursor(dictionary=True)
            
            query = """
            SELECT o.*, u.name as customer_name
            FROM orders o
            JOIN users u ON o.customer_id = u.user_id
            WHERE o.delivery_status = %s
            ORDER BY o.created_at ASC
            """
            cursor.execute(query, (status,))
            
            results = cursor.fetchall()
            orders = []
            
            for result in results:
                order = Order(
                    order_id=result['order_id'],
                    customer_id=result['customer_id'],
                    delivered_by=result['delivered_by'],
                    delivered_to=result['delivered_to'],
                    delivery_status=result['delivery_status'],
                    total_price=float(result['total_price']),
                    delivery_date=result['delivery_date'],
                    delivery_time=result['delivery_time'],
                    created_at=result['created_at']
                )
                
                # Get items
                cursor.execute("""
                    SELECT oi.*, m.name
                    FROM order_items oi
                    JOIN menu_items m ON oi.item_id = m.item_id
                    WHERE oi.order_id = %s
                """, (order.order_id,))
                
                order.items = cursor.fetchall()
                orders.append(order)
            
            cursor.close()
            conn.close()
            
            return orders
            
        except Exception as e:
            print(f"Error getting orders by status: {e}")
            return []
    
    def update_status(self, new_status: str) -> bool:
        """
        Update order status
        
        Args:
            new_status: New status (Pending, Preparing, Ready for Delivery, Out for Delivery, Delivered, Cancelled)
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            conn = get_db_connection()
            if not conn:
                return False
            
            cursor = conn.cursor()
            
            query = "UPDATE orders SET delivery_status = %s WHERE order_id = %s"
            cursor.execute(query, (new_status, self.order_id))
            conn.commit()
            
            self.delivery_status = new_status
            
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error updating order status: {e}")
            return False
    
    def cancel_and_refund(self) -> bool:
        """
        Cancel order and refund customer
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            conn = get_db_connection()
            if not conn:
                return False
            
            cursor = conn.cursor()
            
            # Update status
            cursor.execute(
                "UPDATE orders SET delivery_status = 'Cancelled' WHERE order_id = %s",
                (self.order_id,)
            )
            
            # Refund customer
            cursor.execute("""
                UPDATE users
                SET total_balance = total_balance + %s
                WHERE user_id = %s
            """, (self.total_price, self.customer_id))
            
            conn.commit()
            
            self.delivery_status = 'Cancelled'
            
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error cancelling order: {e}")
            return False
    
    def to_dict(self) -> Dict:
        """
        Convert order to dictionary
        
        Returns:
            dict: Order data
        """
        return {
            'order_id': self.order_id,
            'customer_id': self.customer_id,
            'delivered_by': self.delivered_by,
            'delivered_to': self.delivered_to,
            'delivery_status': self.delivery_status,
            'total_price': float(self.total_price),
            'delivery_date': str(self.delivery_date) if self.delivery_date else None,
            'delivery_time': str(self.delivery_time) if self.delivery_time else None,
            'created_at': str(self.created_at) if self.created_at else None,
            'items': [dict(item) for item in self.items] if self.items else []
        }
    
    def __repr__(self):
        return f"<Order #{self.order_id} - {self.delivery_status}>"