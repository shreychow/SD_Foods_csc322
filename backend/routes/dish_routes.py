from flask import Blueprint, request, jsonify
from models.dishes import (
    get_all_dishes,
    get_dish,
    create_dish,
    update_dish,
    delete_dish
)

dish_bp = Blueprint("dishes", __name__)


@dish_bp.route("/dishes", methods=["GET"])
def list_dishes():
    dishes = get_all_dishes()
    return jsonify(dishes)


@dish_bp.route("/dishes/<int:dish_id>", methods=["GET"])
def get_single_dish(dish_id):
    dish = get_dish(dish_id)
    if not dish:
        return jsonify({"error": "Dish not found"}), 404
    return jsonify(dish)


@dish_bp.route("/dishes", methods=["POST"])
def add_dish():
    data = request.get_json()
    create_dish(data["name"], data["price"], data["description"])
    return jsonify({"message": "Dish created"}), 201
