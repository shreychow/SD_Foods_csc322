from flask import Blueprint, request, jsonify
from models.complaints import (
    file_complaint,
    review_complaint,
    get_complaints,
)
from models.customers import apply_customer_warning
from models.employees import apply_employee_warning

complaint_bp = Blueprint('complaints', __name__)

# Customer or delivery person creates complaint
@complaint_bp.route("/complaints", methods=["POST"])
def create_complaint():
    data = request.get_json()
    filer_id = data.get("filer_id")
    against_id = data.get("against_id")
    target_type = data.get("target_type")  # chef, delivery, customer
    complaint_text = data.get("complaint_text")

    complaint_id = file_complaint(filer_id, against_id, target_type, complaint_text)

    return jsonify({"message": "Complaint submitted!", "complaint_id": complaint_id}), 201


# Manager reviews complaint
@complaint_bp.route("/complaints/<int:complaint_id>/review", methods=["PUT"])
def review(complaint_id):
    data = request.get_json()
    action = data.get("action")  # approve / reject

    review_complaint(complaint_id, action)

    if action == "approve":
        target_type, target_id = apply_warning_logic(complaint_id)
        return jsonify({"message": f"Warning applied to {target_type}", "id": target_id}), 200

    return jsonify({"message": "Complaint dismissed"}), 200


def apply_warning_logic(complaint_id):
    # Auto-action handling here
    target_type, target_id = apply_employee_warning(complaint_id)
    if not target_id:
        target_type, target_id = apply_customer_warning(complaint_id)

    return target_type, target_id


# Manager view all complaints
@complaint_bp.route("/complaints", methods=["GET"])
def all_complaints():
    return jsonify(get_complaints()), 200
