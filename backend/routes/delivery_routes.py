from flask import Blueprint, request, jsonify
from models.delivery_people import (
    get_all_delivery_people,
    get_delivery_person_by_id,
    update_delivery_person_status,
    get_delivery_person_ratings
)

delivery_bp = Blueprint("delivery", __name__)

# Get all delivery people
@delivery_bp.route("/delivery", methods=["GET"])
def all_delivery_people():
    workers = get_all_delivery_people()
    return jsonify(workers)


# Get delivery person details by id
@delivery_bp.route("/delivery/<int:delivery_id>", methods=["GET"])
def get_delivery_person(delivery_id):
    worker = get_delivery_person_by_id(delivery_id)
    if not worker:
        return jsonify({"error": "Not found"}), 404
    return jsonify(worker)


# Update availability (active/busy/offline)
@delivery_bp.route("/delivery/<int:delivery_id>/status", methods=["PUT"])
def update_status(delivery_id):
    data = request.get_json()
    status = data.get("status")

    update_delivery_person_status(delivery_id, status)
    return jsonify({"message": "Status updated"})


# Get rating score
@delivery_bp.route("/delivery/<int:delivery_id>/ratings", methods=["GET"])
def ratings(delivery_id):
    ratings = get_delivery_person_ratings(delivery_id)
    return jsonify(ratings)
