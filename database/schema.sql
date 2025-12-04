CREATE DATABASE IF NOT EXISTS resturant_database; -- create a db if called resturant if it doesnt already exist 
USE resturant_database; -- work inside this database for the following commands.

/* CUSTOMER TABLE */
CREATE TABLE customers(
    customer_id INT AUTO_INCREMENT PRIMARY KEY, -- auto increase for every new customer by 1, primary key = customer id will be the identifier for this table
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- password should be hashed and not in plain text
    name VARCHAR(100) NOT NULL, -- name can be up to 100 letters, cannot be left blank 
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    home_address VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* EMPLOYEE TABLE */
CREATE TABLE employee(
    employee_id INT AUTO_INCREMENT PRIMARY KEY, -- auto increase for every new employee by 1
    name VARCHAR(100) NOT NULL, 
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* MODIFY EMPLOYEE TABLE TO ADD ROLE, SALARY, WARNINGS, EMPLOYMENT STATUS */
ALTER TABLE employee 
ADD COLUMN role ENUM('chef','delivery','manager') NOT NULL DEFAULT 'chef',
ADD COLUMN salary DECIMAL(10,2) DEFAULT 1000,
ADD COLUMN warnings INT DEFAULT 0,
ADD COLUMN employment_status ENUM('active','demoted','fired') DEFAULT 'active';


/* ALL PARTICIPANTS CAN LOGIN */

/* CUSTOMER CAN : LOGIN, BROSE, ORDER, RATE, COMPLAIN, RECEIVE WARNING, BE BLACKLISTED, 
   BE DOWNGRADED (OF VIP), QUERY, ADD FUNDS, BIDDING? these should all be tables */


/* COMPLAINTS TABLE */
CREATE TABLE complaints (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    
    filer_customer_id INT,
    filer_employee_id INT, 

    target_customer_id INT,
    target_employee_id INT,

    message VARCHAR(500) NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (filer_customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (filer_employee_id) REFERENCES employee(employee_id),

    FOREIGN KEY (target_customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (target_employee_id) REFERENCES employee(employee_id)
);

/* WARNING Table */
CREATE TABLE warnings (
    warning_id INT AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('customer','vip','chef','delivery'),
    user_id INT NOT NULL,
    reason VARCHAR(300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* MODIFIED EMPLOYEE TABLE */
ALTER TABLE employee
ADD COLUMN complaints INT DEFAULT 0;

/* MODIFIED COMPLAINTS TABLE */
ALTER TABLE complaints
    DROP COLUMN filer_employee_id,
    DROP COLUMN target_customer_id,
    DROP COLUMN target_employee_id,
    DROP COLUMN resolved,
    DROP COLUMN message;

/* Adding new columns to complaints table */
ALTER TABLE complaints
    ADD COLUMN against_id INT NOT NULL AFTER filer_customer_id,
    ADD COLUMN target_type ENUM('customer','chef','delivery') NOT NULL AFTER against_id,
    ADD COLUMN complaint_text VARCHAR(500) NOT NULL AFTER target_type,
    ADD COLUMN status ENUM('pending','approved','rejected') DEFAULT 'pending' AFTER complaint_text;


SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'complaints';
-- this query helps to find foreign keys in the complaints table for cleanup if needed

ALTER TABLE complaints DROP FOREIGN KEY complaints_ibfk_1;
ALTER TABLE complaints DROP FOREIGN KEY complaints_ibfk_2;
ALTER TABLE complaints DROP FOREIGN KEY complaints_ibfk_3;
ALTER TABLE complaints DROP FOREIGN KEY complaints_ibfk_4;
-- dropping foreign keys that are no longer needed after modification of complaints table

ALTER TABLE complaints
DROP COLUMN filer_customer_id,
DROP COLUMN filer_employee_id,
DROP COLUMN target_customer_id,
DROP COLUMN target_employee_id,
DROP COLUMN message,
DROP COLUMN resolved;
-- cleaning up old columns from complaints table after modification

ALTER TABLE complaints
ADD COLUMN filer_id INT,
ADD COLUMN against_id INT,
ADD COLUMN target_type ENUM('customer','chef','delivery') NOT NULL,
ADD COLUMN complaint_text VARCHAR(500),
ADD COLUMN status ENUM('pending','approved','rejected') DEFAULT 'pending';
-- re-adding necessary columns to complaints table after cleanup