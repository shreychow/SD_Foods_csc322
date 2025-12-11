from db import get_db_connection
from typing import Optional, Dict, List


class MenuItem:
    """MenuItem model for database operations"""
    
    def __init__(self, item_id=None, name=None, description=None, price=None,
                 category=None, category_type=None, is_time_limited=False,
                 in_stock=True, image_url=None, created_by=None, updated_by=None,
                 dietary_restrictions=False):
        self.item_id = item_id
        self.name = name
        self.description = description
        self.price = price
        self.category = category
        self.category_type = category_type
        self.is_time_limited = is_time_limited
        self.in_stock = in_stock
        self.image_url = image_url
        self.created_by = created_by
        self.updated_by = updated_by
        self.dietary_restrictions = dietary_restrictions
    
    @staticmethod
    def create(name: str, description: str, price: float, category_id: int,
               created_by: int, is_time_limited: bool = False, in_stock: bool = True,
               image_url: str = None, dietary_restrictions: bool = False) -> Optional[int]:
        """
        Create a new menu item
        
        Args:
            name: Item name
            description: Item description
            price: Item price
            category_id: Category ID
            created_by: User ID who created the item
            is_time_limited: Whether item is time-limited
            in_stock: Whether item is in stock
            image_url: Image URL
            dietary_restrictions: Has dietary restrictions
            
        Returns:
            int: New item ID or None on failure
        """
        try:
            conn = get_db_connection()
            if not conn:
                return None
            
            cursor = conn.cursor()
            
            query = """
            INSERT INTO menu_items (name, description, price, category, is_time_limited,
                                   in_stock, image_url, created_by, updated_by, dietary_restrictions)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            cursor.execute(query, (
                name, description, price, category_id, is_time_limited,
                in_stock, image_url, created_by, created_by, dietary_restrictions
            ))
            
            conn.commit()
            item_id = cursor.lastrowid
            
            cursor.close()
            conn.close()
            
            return item_id
            
        except Exception as e:
            print(f"Error creating menu item: {e}")
            return None
    
    @staticmethod
    def find_by_id(item_id: int) -> Optional['MenuItem']:
        """
        Find menu item by ID
        
        Args:
            item_id: Item ID to search for
            
        Returns:
            MenuItem object or None if not found
        """
        try:
            conn = get_db_connection()
            if not conn:
                return None
            
            cursor = conn.cursor(dictionary=True)
            
            query = """
            SELECT m.*, c.category_type
            FROM menu_items m
            JOIN category c ON m.category = c.category_id
            WHERE m.item_id = %s
            """
            cursor.execute(query, (item_id,))
            
            result = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            if result:
                return MenuItem(
                    item_id=result['item_id'],
                    name=result['name'],
                    description=result['description'],
                    price=float(result['price']),
                    category=result['category'],
                    category_type=result['category_type'],
                    is_time_limited=result['is_time_limited'],
                    in_stock=result['in_stock'],
                    image_url=result['image_url'],
                    created_by=result['created_by'],
                    updated_by=result['updated_by'],
                    dietary_restrictions=result['dietary_restrictions']
                )
            
            return None
            
        except Exception as e:
            print(f"Error finding menu item: {e}")
            return None
    
    @staticmethod
    def get_all(in_stock_only: bool = True, category: Optional[str] = None) -> List['MenuItem']:
        """
        Get all menu items
        
        Args:
            in_stock_only: Only return in-stock items
            category: Filter by category type
            
        Returns:
            List of MenuItem objects
        """
        try:
            conn = get_db_connection()
            if not conn:
                return []
            
            cursor = conn.cursor(dictionary=True)
            
            query = """
            SELECT m.*, c.category_type
            FROM menu_items m
            JOIN category c ON m.category = c.category_id
            WHERE 1=1
            """
            params = []
            
            if in_stock_only:
                query += " AND m.in_stock = TRUE"
            
            if category:
                query += " AND c.category_type = %s"
                params.append(category)
            
            cursor.execute(query, params)
            results = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            items = []
            for result in results:
                items.append(MenuItem(
                    item_id=result['item_id'],
                    name=result['name'],
                    description=result['description'],
                    price=float(result['price']),
                    category=result['category'],
                    category_type=result['category_type'],
                    is_time_limited=result['is_time_limited'],
                    in_stock=result['in_stock'],
                    image_url=result['image_url'],
                    created_by=result['created_by'],
                    updated_by=result['updated_by'],
                    dietary_restrictions=result['dietary_restrictions']
                ))
            
            return items
            
        except Exception as e:
            print(f"Error getting menu items: {e}")
            return []
    
    def update(self, **kwargs) -> bool:
        """
        Update menu item fields
        
        Args:
            **kwargs: Fields to update (name, description, price, in_stock, etc.)
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            conn = get_db_connection()
            if not conn:
                return False
            
            cursor = conn.cursor()
            
            # Build dynamic update query
            update_fields = []
            update_values = []
            
            allowed_fields = ['name', 'description', 'price', 'in_stock', 
                            'is_time_limited', 'image_url', 'dietary_restrictions', 'updated_by']
            
            for field, value in kwargs.items():
                if field in allowed_fields:
                    update_fields.append(f"{field} = %s")
                    update_values.append(value)
                    setattr(self, field, value)
            
            if not update_fields:
                return False
            
            query = f"UPDATE menu_items SET {', '.join(update_fields)} WHERE item_id = %s"
            update_values.append(self.item_id)
            
            cursor.execute(query, update_values)
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error updating menu item: {e}")
            return False
    
    def delete(self) -> bool:
        """
        Delete menu item
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            conn = get_db_connection()
            if not conn:
                return False
            
            cursor = conn.cursor()
            
            query = "DELETE FROM menu_items WHERE item_id = %s"
            cursor.execute(query, (self.item_id,))
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error deleting menu item: {e}")
            return False
    
    def mark_out_of_stock(self) -> bool:
        """
        Mark item as out of stock
        
        Returns:
            bool: True if successful, False otherwise
        """
        return self.update(in_stock=False)
    
    def mark_in_stock(self) -> bool:
        """
        Mark item as in stock
        
        Returns:
            bool: True if successful, False otherwise
        """
        return self.update(in_stock=True)
    
    def to_dict(self) -> Dict:
        """
        Convert menu item to dictionary
        
        Returns:
            dict: Menu item data
        """
        return {
            'item_id': self.item_id,
            'name': self.name,
            'description': self.description,
            'price': float(self.price) if self.price else 0,
            'category': self.category,
            'category_type': self.category_type,
            'is_time_limited': self.is_time_limited,
            'in_stock': self.in_stock,
            'image_url': self.image_url,
            'dietary_restrictions': self.dietary_restrictions
        }
    
    def __repr__(self):
        return f"<MenuItem {self.name} (${self.price})>"
    