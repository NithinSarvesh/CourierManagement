-- ==========================================================
-- COURIER MANAGEMENT SYSTEM - SAMPLE DATA INSERTS
-- ==========================================================

-- 1. CUSTOMER DATA
INSERT INTO CUSTOMER (customer_id, name, email, street, city, pin) VALUES (1001, 'Rahul Sharma', 'rahul.sharma@example.com', '12 Anna Salai', 'Chennai', '600001');
INSERT INTO CUSTOMER (customer_id, name, email, street, city, pin) VALUES (1002, 'Priya Patel', 'priya.patel@example.com', '45 Marine Drive', 'Mumbai', '400001');
INSERT INTO CUSTOMER (customer_id, name, email, street, city, pin) VALUES (1003, 'Arjun Mehta', 'arjun.mehta@example.com', '88 MG Road', 'Bengaluru', '560001');
INSERT INTO CUSTOMER (customer_id, name, email, street, city, pin) VALUES (1004, 'Neha Singh', 'neha.singh@example.com', '23 Connaught Place', 'Delhi', '110001');
INSERT INTO CUSTOMER (customer_id, name, email, street, city, pin) VALUES (1005, 'Karthik Raja', 'karthik.raja@example.com', '7 Gandhi Road', 'Hyderabad', '500001');

-- 2. COURIER DATA
INSERT INTO COURIER (courier_id, name, email) VALUES (101, 'Express Logistics', 'contact@expresslogistics.com');
INSERT INTO COURIER (courier_id, name, email) VALUES (102, 'FastTrack Couriers', 'support@fasttrack.com');
INSERT INTO COURIER (courier_id, name, email) VALUES (103, 'QuickShip India', 'info@quickship.com');
INSERT INTO COURIER (courier_id, name, email) VALUES (104, 'BlueDart Partner', 'bluedart@courierhub.com');

-- 3. BRANCH DATA
INSERT INTO BRANCH (branch_id, branch_name, street, city, pin) VALUES (1, 'Chennai Central Hub', '10 Mount Road', 'Chennai', '600002');
INSERT INTO BRANCH (branch_id, branch_name, street, city, pin) VALUES (2, 'Mumbai West Terminal', '22 Bandra Link Road', 'Mumbai', '400050');
INSERT INTO BRANCH (branch_id, branch_name, street, city, pin) VALUES (3, 'Bengaluru North Station', '14 Outer Ring Road', 'Bengaluru', '560045');
INSERT INTO BRANCH (branch_id, branch_name, street, city, pin) VALUES (4, 'Delhi Hub Central', '5 Barakhamba Road', 'Delhi', '110001');

-- 4. STAFF DATA
INSERT INTO STAFF (staff_id, role, branch_id, name, department) VALUES (201, 'Manager', 1, 'Ravi Kumar', 'Operations');
INSERT INTO STAFF (staff_id, role, branch_id, name, department) VALUES (202, 'Customer Support', 1, 'Anita Rao', 'Support');
INSERT INTO STAFF (staff_id, role, branch_id, name, department) VALUES (203, 'Accountant', 2, 'Vikram Das', 'Finance');
INSERT INTO STAFF (staff_id, role, branch_id, name, department) VALUES (204, 'Delivery Boy', 3, 'Suresh Nair', 'Logistics');
INSERT INTO STAFF (staff_id, role, branch_id, name, department) VALUES (205, 'Driver', 1, 'Manoj Verma', 'Transport');

-- 5. COURIER SERVICE DATA
INSERT INTO COURIER_SERVICE (service_id, branch_id, courier_id, charges) VALUES (301, 1, 101, 120.00);
INSERT INTO COURIER_SERVICE (service_id, branch_id, courier_id, charges) VALUES (302, 1, 102, 80.00);
INSERT INTO COURIER_SERVICE (service_id, branch_id, courier_id, charges) VALUES (303, 2, 103, 50.00);
INSERT INTO COURIER_SERVICE (service_id, branch_id, courier_id, charges) VALUES (304, 3, 104, 200.00);

-- 6. ORDERS DATA
INSERT INTO ORDERS (order_id, customer_id, service_id, order_date, status, amount) VALUES (4001, 1001, 301, TIMESTAMP '2026-09-14 10:30:00', 'Delivered', 1250.00);
INSERT INTO ORDERS (order_id, customer_id, service_id, order_date, status, amount) VALUES (4002, 1002, 302, TIMESTAMP '2026-09-15 11:15:00', 'In Transit', 780.00);
INSERT INTO ORDERS (order_id, customer_id, service_id, order_date, status, amount) VALUES (4003, 1003, 303, TIMESTAMP '2026-09-15 15:45:00', 'Processing', 2100.00);
INSERT INTO ORDERS (order_id, customer_id, service_id, order_date, status, amount) VALUES (4004, 1004, 301, TIMESTAMP '2026-09-16 09:20:00', 'Delivered', 560.00);
INSERT INTO ORDERS (order_id, customer_id, service_id, order_date, status, amount) VALUES (4005, 1001, 304, TIMESTAMP '2026-09-16 14:00:00', 'Pending', 1800.00);

-- 7. PAYMENT DATA
INSERT INTO PAYMENT (payment_id, customer_id, order_id, amount, status) VALUES (5001, 1001, 4001, 1250.00, 'Paid');
INSERT INTO PAYMENT (payment_id, customer_id, order_id, amount, status) VALUES (5002, 1002, 4002, 780.00, 'Paid');
INSERT INTO PAYMENT (payment_id, customer_id, order_id, amount, status) VALUES (5003, 1003, 4003, 2100.00, 'Pending');
INSERT INTO PAYMENT (payment_id, customer_id, order_id, amount, status) VALUES (5004, 1004, 4004, 560.00, 'Paid');
INSERT INTO PAYMENT (payment_id, customer_id, order_id, amount, status) VALUES (5005, 1001, 4005, 1800.00, 'Pending');

-- 8. PARCEL DATA
INSERT INTO PARCEL (parcel_id, order_id, price, courier_id, staff_id) VALUES (6001, 4001, 1250.00, 101, 204);
INSERT INTO PARCEL (parcel_id, order_id, price, courier_id, staff_id) VALUES (6002, 4002, 780.00, 102, 204);
INSERT INTO PARCEL (parcel_id, order_id, price, courier_id, staff_id) VALUES (6003, 4003, 2100.00, 103, 203);
INSERT INTO PARCEL (parcel_id, order_id, price, courier_id, staff_id) VALUES (6004, 4004, 560.00, 101, 204);

-- 9. VEHICLE DATA
INSERT INTO VEHICLE (vehicle_no, license_no, staff_id) VALUES ('TN01AB1234', 'LIC-8821', 204);
INSERT INTO VEHICLE (vehicle_no, license_no, staff_id) VALUES ('MH02CD5678', 'LIC-7742', 205);
INSERT INTO VEHICLE (vehicle_no, license_no, staff_id) VALUES ('KA03EF9012', 'LIC-6634', 205);

-- 10. TRACKING EVENT DATA
INSERT INTO TRACKING_EVENT (event_id, parcel_id, event_type, event_time) VALUES (7001, 6001, 'Picked Up', TIMESTAMP '2026-09-14 11:00:00');
INSERT INTO TRACKING_EVENT (event_id, parcel_id, event_type, event_time) VALUES (7002, 6001, 'In Transit', TIMESTAMP '2026-09-14 14:30:00');
INSERT INTO TRACKING_EVENT (event_id, parcel_id, event_type, event_time) VALUES (7003, 6001, 'Delivered', TIMESTAMP '2026-09-14 18:00:00');
INSERT INTO TRACKING_EVENT (event_id, parcel_id, event_type, event_time) VALUES (7004, 6002, 'In Transit', TIMESTAMP '2026-09-15 12:00:00');

-- 11. DELIVERY ATTEMPT DATA
INSERT INTO DELIVERY_ATTEMPT (branch_id, courier_id, attempt_no, attempt_time, status) VALUES (1, 101, 1, TIMESTAMP '2026-09-14 16:30:00', 'Delivered');
INSERT INTO DELIVERY_ATTEMPT (branch_id, courier_id, attempt_no, attempt_time, status) VALUES (1, 102, 1, TIMESTAMP '2026-09-15 15:00:00', 'Pending');
INSERT INTO DELIVERY_ATTEMPT (branch_id, courier_id, attempt_no, attempt_time, status) VALUES (2, 103, 1, TIMESTAMP '2026-09-15 17:30:00', 'Failed');

-- 12. SUB-TYPE DATA
INSERT INTO MANAGER (staff_id, manager_id) VALUES (201, 201);
INSERT INTO CUSTOMER_SUPPORT (staff_id, staff_timing) VALUES (202, '9:00 AM - 6:00 PM');
INSERT INTO ACCOUNTANT (staff_id, qualification) VALUES (203, 'M.Com, CPA');
INSERT INTO DELIVERY_BOY (courier_id, area_assigned) VALUES (101, 'Chennai Central');
INSERT INTO BRANCH_STAFF (courier_id, department) VALUES (102, 'Customer Desk');
INSERT INTO DRIVER (courier_id, license_no) VALUES (103, 'DL-IND-99231');
INSERT INTO CASH_MODE (payment_id) VALUES (5001);
INSERT INTO CARD_MODE (payment_id) VALUES (5002);
INSERT INTO ONLINE_MODE (payment_id) VALUES (5004);

COMMIT;
