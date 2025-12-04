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

ALTER TABLE employee 
ADD COLUMN role ENUM('chef','delivery','manager') NOT NULL DEFAULT 'chef',
ADD COLUMN salary DECIMAL(10,2) DEFAULT 1000,
ADD COLUMN warnings INT DEFAULT 0,
ADD COLUMN employment_status ENUM('active','demoted','fired') DEFAULT 'active';


/* ALL PARTICIPANTS CAN LOGIN */

/* CUSTOMER CAN : LOGIN, BROSE, ORDER, RATE, COMPLAIN, RECEIVE WARNING, BE BLACKLISTED, 
   BE DOWNGRADED (OF VIP), QUERY, ADD FUNDS, BIDDING? these should all be tables */
