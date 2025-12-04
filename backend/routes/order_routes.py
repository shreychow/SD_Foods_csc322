from flask import Blueprint, request, jsonify
from models.orders import (
    create_order,
    get_orders_by_customer,
    get_order,
    update_order_status
)

order_bp = Blueprint("orders", __name__)


# --------------------------------------------------
# PLACE AN ORDER
# --------------------------------------------------
@order_bp.route("/orders", methods=["POST"])
def place_order():
    data = request.get_json()

    customer_id = data.get("customer_id")
    dish_id = data.get("dish_id")
    quantity = data.get("quantity")
    total_price = data.get("total_price")

    create_order(customer_id, dish_id, quantity, total_price)

    return jsonify({"message": "Order placed successfully"}), 201


# --------------------------------------------------
# GET ALL ORDERS FOR A CUSTOMER
# --------------------------------------------------
@order_bp.route("/orders/<int:customer_id>", methods=["GET"])
def get_customer_orders(customer_id):
    orders = get_orders_by_customer(customer_id)
    return jsonify(orders)


# --------------------------------------------------
# DELIVERY/MANAGER UPDATES ORDER STATUS
# --------------------------------------------------
@order_bp.route("/orders/status/<int:order_id>", methods=["PUT"])
def update_status(order_id):
    data = request.get_json()
    new_status = data.get("status")

    update_order_status(order_id, new_status)

    return jsonify({"message": "Order status updated"})
