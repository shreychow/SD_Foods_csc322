from flask import Blueprint, request, jsonify
from models.customers import (
    get_customer_by_id,
    update_customer_profile,
    get_warnings,
    get_customer_balance
)

customer_bp = Blueprint("customer", __name__)

# -------------------------
# View Profile
# -------------------------
@customer_bp.route("/profile/<int:customer_id>", methods=["GET"])
def view_profile(customer_id):
    user = get_customer_by_id(customer_id)
    if not user:
        return jsonify({"error": "Customer not found"}), 404
    return jsonify(user), 200


# -------------------------
# Update Profile
# -------------------------
@customer_bp.route("/profile/<int:customer_id>", methods=["PUT"])
def edit_profile(customer_id):
    data = request.get_json()
    success = update_customer_profile(customer_id, data)
    if not success:
        return jsonify({"error": "Update failed"}), 400
    return jsonify({"message": "Profile updated successfully"}), 200


# -------------------------
# View Warnings
# -------------------------
@customer_bp.route("/warnings/<int:customer_id>", methods=["GET"])
def view_warnings(customer_id):
    warnings = get_warnings(customer_id)
    return jsonify({"warnings": warnings}), 200


# -------------------------
# Check Wallet Balance
# -------------------------
@customer_bp.route("/balance/<int:customer_id>", methods=["GET"])
def check_balance(customer_id):
    balance = get_customer_balance(customer_id)
    return jsonify({"balance": balance}), 200


