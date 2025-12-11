from db.db import get_db_connection

# Get ALL dishes
def get_all_dishes():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM dishes")
    dishes = cursor.fetchall()

    cursor.close()
    conn.close()
    return dishes


# Get ONE dish by ID
def get_dish(dish_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM dishes WHERE dish_id = %s", (dish_id,))
    dish = cursor.fetchone()

    cursor.close()
    conn.close()
    return dish


# Create new dish
def create_dish(name, price, description, chef_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    sql = """
        INSERT INTO dishes (name, price, description, chef_id)
        VALUES (%s, %s, %s, %s)
    """

    cursor.execute(sql, (name, price, description, chef_id))
    conn.commit()

    cursor.close()
    conn.close()


# Update dish
def update_dish(dish_id, name, price, description):
    conn = get_db_connection()
    cursor = conn.cursor()

    sql = """
        UPDATE dishes
        SET name=%s, price=%s, description=%s
        WHERE dish_id=%s
    """

    cursor.execute(sql, (name, price, description, dish_id))
    conn.commit()

    cursor.close()
    conn.close()


# Delete dish
def delete_dish(dish_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM dishes WHERE dish_id = %s", (dish_id,))
    conn.commit()

    cursor.close()
    conn.close()
