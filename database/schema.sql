CREATE DATABASE IF NOT EXISITS resturant_database; -- create a db if called resturant if it doesnt alreasy exists 
USE resturant_database; -- work inside this database for the following commands.

/* CUSTOMER TABLE */
CREATE TABLE customers(
    customer_id INT AUTO_INCREMENT PRIMARY KEY -- auto incrase foe every new customer by 1, primary key = customer id will be the indeifer for this table if we need to refer to it again 
    username VARCHAR(50) UNIQUE NOT NULL 
    password_hash VARCHAR (255) NOT NULL -- password should be hased and not in plain text
    name VARCHAR (100) NOT NULL, -- name can be up to 100 letters, cannot be left blank 
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    home_address VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* EMPLOYEE TABLE */
CREATE TABLE employee(
    employee_id INT AUTO_INCREMENT PRIMARY KEY -- auto incrase foe every new customer by 1, primary key = customer id will be the indeifer for this table if we need to refer to it again 
    name VARCHAR (100) NOT NULL, 
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ALL PARTICIPNANTS CAN LOGIN

/* CUSTOMER CAN : LOGIN,BROSE,ORDER,RATE,COMPLAIN,RECIVE WARNING,BE BLACKLISTED,BE DOWNGRADED(OF VIP),QUERY,ADD FUNDS,BIDDNG? these should all be tables 
