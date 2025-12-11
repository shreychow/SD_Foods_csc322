from flask import Blueprint, request, jsonify
from models.manager import get_employees, update_employee_status, update_salary

manager_bp = Blueprint('manager', __name__)

# Get all employees
@manager_bp.route("/employees", methods=["GET"])
def all_employees():
    return jsonify(get_employees()), 200


# Update employment status (fire / demote / activate)
@manager_bp.route("/employee/status/<int:employee_id>", methods=["PUT"])
def change_status(employee_id):
    data = request.get_json()
    status = data.get("status")

    update_employee_status(employee_id, status)
    return jsonify({"message": "Status updated successfully"}), 200


# Update salary
@manager_bp.route("/employee/salary/<int:employee_id>", methods=["PUT"])
def change_salary(employee_id):
    data = request.get_json()
    new_salary = data.get("salary")

    update_salary(employee_id, new_salary)
    return jsonify({"message": "Salary updated successfully"}), 200
