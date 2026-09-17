-- ==========================================================
-- COURIER MANAGEMENT SYSTEM - PL/SQL PROCEDURES, FUNCTIONS & VIEWS
-- Oracle Database 23c / XE Compatible
-- ==========================================================

-- ==========================================================
-- 1. SEQUENCES (For Auto-Increment Primary Keys)
-- ==========================================================
BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE customer_seq START WITH 1006 INCREMENT BY 1 NOCACHE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE courier_seq START WITH 105 INCREMENT BY 1 NOCACHE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE branch_seq START WITH 5 INCREMENT BY 1 NOCACHE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE staff_seq START WITH 206 INCREMENT BY 1 NOCACHE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE service_seq START WITH 305 INCREMENT BY 1 NOCACHE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE order_seq START WITH 4006 INCREMENT BY 1 NOCACHE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE payment_seq START WITH 5006 INCREMENT BY 1 NOCACHE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE parcel_seq START WITH 6005 INCREMENT BY 1 NOCACHE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'CREATE SEQUENCE tracking_seq START WITH 7005 INCREMENT BY 1 NOCACHE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- ==========================================================
-- 2. DATABASE VIEWS (Demonstrating DBMS Views)
-- ==========================================================

-- View 1: Customer Order Summary
CREATE OR REPLACE VIEW VW_CUSTOMER_ORDER_SUMMARY AS
SELECT 
    c.customer_id,
    c.name AS customer_name,
    c.email,
    c.city,
    COUNT(o.order_id) AS total_orders,
    NVL(SUM(o.amount), 0) AS total_amount_spent,
    NVL(MAX(o.order_date), NULL) AS latest_order_date
FROM CUSTOMER c
LEFT JOIN ORDERS o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name, c.email, c.city;
/

-- View 2: Active Parcel Tracking Details
CREATE OR REPLACE VIEW VW_ACTIVE_PARCEL_TRACKING AS
SELECT 
    p.parcel_id,
    o.order_id,
    c.name AS customer_name,
    cr.name AS courier_name,
    o.status AS order_status,
    p.price AS parcel_price,
    te.event_type AS latest_event,
    te.event_time AS latest_update
FROM PARCEL p
JOIN ORDERS o ON p.order_id = o.order_id
JOIN CUSTOMER c ON o.customer_id = c.customer_id
LEFT JOIN COURIER cr ON p.courier_id = cr.courier_id
LEFT JOIN (
    SELECT parcel_id, event_type, event_time,
           ROW_NUMBER() OVER (PARTITION BY parcel_id ORDER BY event_time DESC) as rn
    FROM TRACKING_EVENT
) te ON p.parcel_id = te.parcel_id AND te.rn = 1;
/

-- View 3: Branch Performance & Resource Summary
CREATE OR REPLACE VIEW VW_BRANCH_PERFORMANCE AS
SELECT 
    b.branch_id,
    b.branch_name,
    b.city,
    COUNT(DISTINCT s.staff_id) AS total_staff,
    COUNT(DISTINCT cs.service_id) AS services_offered
FROM BRANCH b
LEFT JOIN STAFF s ON b.branch_id = s.branch_id
LEFT JOIN COURIER_SERVICE cs ON b.branch_id = cs.branch_id
GROUP BY b.branch_id, b.branch_name, b.city;
/

-- ==========================================================
-- 3. PL/SQL STORED PROCEDURES & FUNCTIONS
-- ==========================================================

-- Procedure 1: Get Customer Order Count (Basic IN/OUT Parameters)
CREATE OR REPLACE PROCEDURE GET_CUSTOMER_ORDER_COUNT(
    p_customer_id IN NUMBER,
    p_count OUT NUMBER
) AS
BEGIN
    SELECT COUNT(*) INTO p_count FROM ORDERS WHERE customer_id = p_customer_id;
END;
/

-- Procedure 2: Update Parcel & Order Status with Tracking Event
CREATE OR REPLACE PROCEDURE UPDATE_PARCEL_STATUS(
    p_parcel_id IN NUMBER,
    p_new_status IN VARCHAR2,
    p_message OUT VARCHAR2
) AS
    v_order_id NUMBER;
    v_new_event_id NUMBER;
BEGIN
    SELECT order_id INTO v_order_id FROM PARCEL WHERE parcel_id = p_parcel_id;
    
    UPDATE ORDERS SET status = p_new_status WHERE order_id = v_order_id;
    
    SELECT NVL(MAX(event_id), 7000) + 1 INTO v_new_event_id FROM TRACKING_EVENT;
    INSERT INTO TRACKING_EVENT (event_id, parcel_id, event_type, event_time)
    VALUES (v_new_event_id, p_parcel_id, p_new_status, CURRENT_TIMESTAMP);
    
    COMMIT;
    p_message := 'Parcel ' || p_parcel_id || ' status updated to ' || p_new_status || ' successfully.';
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_message := 'Error: Parcel ID ' || p_parcel_id || ' not found.';
    WHEN OTHERS THEN
        ROLLBACK;
        p_message := 'Error updating parcel status: ' || SQLERRM;
END;
/

-- Procedure 3: Calculate Delivery Charge based on Weight, Distance, and Service
CREATE OR REPLACE PROCEDURE CALCULATE_DELIVERY_CHARGE(
    p_weight_kg IN NUMBER,
    p_distance_km IN NUMBER,
    p_service_id IN NUMBER,
    p_final_charge OUT NUMBER
) AS
    v_base_rate NUMBER := 50;
    v_weight_factor NUMBER := 15;
    v_distance_factor NUMBER := 0.5;
    v_service_charge NUMBER := 0;
BEGIN
    BEGIN
        SELECT NVL(charges, 0) INTO v_service_charge FROM COURIER_SERVICE WHERE service_id = p_service_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_service_charge := 50;
    END;
    
    p_final_charge := v_base_rate + v_service_charge + (p_weight_kg * v_weight_factor) + (p_distance_km * v_distance_factor);
END;
/

-- Function 4: Calculate Customer Loyalty Discount
CREATE OR REPLACE FUNCTION CALCULATE_DISCOUNT(
    p_amount IN NUMBER
) RETURN NUMBER AS
    v_discount NUMBER := 0;
BEGIN
    IF p_amount >= 2000 THEN
        v_discount := ROUND(p_amount * 0.15, 2);
    ELSIF p_amount >= 1000 THEN
        v_discount := ROUND(p_amount * 0.10, 2);
    ELSIF p_amount >= 500 THEN
        v_discount := ROUND(p_amount * 0.05, 2);
    ELSE
        v_discount := 0;
    END IF;
    RETURN v_discount;
END;
/

-- Procedure 5: Process Delivery Attempt
CREATE OR REPLACE PROCEDURE PROCESS_DELIVERY_ATTEMPT(
    p_branch_id IN NUMBER,
    p_courier_id IN NUMBER,
    p_status IN VARCHAR2,
    p_remarks IN VARCHAR2,
    p_result OUT VARCHAR2
) AS
    v_next_attempt NUMBER;
BEGIN
    SELECT NVL(MAX(attempt_no), 0) + 1 INTO v_next_attempt 
    FROM DELIVERY_ATTEMPT WHERE branch_id = p_branch_id;
    
    INSERT INTO DELIVERY_ATTEMPT (branch_id, courier_id, attempt_no, attempt_time, status)
    VALUES (p_branch_id, p_courier_id, v_next_attempt, CURRENT_TIMESTAMP, p_status);
    
    COMMIT;
    p_result := 'Delivery attempt #' || v_next_attempt || ' recorded for branch ' || p_branch_id || ' with status: ' || p_status;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_result := 'Failed to record delivery attempt: ' || SQLERRM;
END;
/

-- Procedure 6: Record Payment with Transaction Management (COMMIT / ROLLBACK)
CREATE OR REPLACE PROCEDURE RECORD_PAYMENT_TXN(
    p_customer_id IN NUMBER,
    p_order_id IN NUMBER,
    p_amount IN NUMBER,
    p_mode IN VARCHAR2,
    p_result OUT VARCHAR2
) AS
    v_payment_id NUMBER;
    v_order_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_order_count FROM ORDERS WHERE order_id = p_order_id;
    IF v_order_count = 0 THEN
        p_result := 'Error: Order ' || p_order_id || ' does not exist.';
        RETURN;
    END IF;
    
    SELECT NVL(MAX(payment_id), 5000) + 1 INTO v_payment_id FROM PAYMENT;
    
    INSERT INTO PAYMENT (payment_id, customer_id, order_id, amount, status)
    VALUES (v_payment_id, p_customer_id, p_order_id, p_amount, 'Paid');
    
    IF UPPER(p_mode) = 'CASH' THEN
        INSERT INTO CASH_MODE (payment_id) VALUES (v_payment_id);
    ELSIF UPPER(p_mode) = 'CARD' THEN
        INSERT INTO CARD_MODE (payment_id) VALUES (v_payment_id);
    ELSE
        INSERT INTO ONLINE_MODE (payment_id) VALUES (v_payment_id);
    END IF;
    
    UPDATE ORDERS SET status = 'Delivered' WHERE order_id = p_order_id;
    
    COMMIT;
    p_result := 'Transaction Committed: Payment #' || v_payment_id || ' of ₹' || p_amount || ' processed via ' || p_mode || '. Order marked Delivered.';
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_result := 'Transaction Rolled Back: ' || SQLERRM;
END;
/

-- Procedure 7: PL/SQL Exception Handling Demonstration
CREATE OR REPLACE PROCEDURE DEMO_EXCEPTION_HANDLING(
    p_customer_id IN NUMBER,
    p_order_id IN NUMBER,
    p_result OUT VARCHAR2
) AS
    v_cust_name VARCHAR2(100);
    v_order_amount NUMBER;
    NEGATIVE_AMOUNT_EXC EXCEPTION;
BEGIN
    -- Raises NO_DATA_FOUND if customer does not exist
    SELECT name INTO v_cust_name FROM CUSTOMER WHERE customer_id = p_customer_id;
    
    -- Raises NO_DATA_FOUND if order does not exist
    SELECT amount INTO v_order_amount FROM ORDERS WHERE order_id = p_order_id;
    
    IF v_order_amount < 0 THEN
        RAISE NEGATIVE_AMOUNT_EXC;
    END IF;
    
    p_result := 'Verification Passed: Customer [' || v_cust_name || '] has valid Order #' || p_order_id || ' with amount ₹' || v_order_amount;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_result := 'HANDLED EXCEPTION (NO_DATA_FOUND): Customer ID ' || p_customer_id || ' or Order ID ' || p_order_id || ' does not exist in database.';
    WHEN NEGATIVE_AMOUNT_EXC THEN
        p_result := 'HANDLED USER EXCEPTION (NEGATIVE_AMOUNT): Order amount cannot be negative.';
    WHEN OTHERS THEN
        p_result := 'HANDLED GENERAL EXCEPTION: ' || SQLERRM;
END;
/

-- Procedure 8: PL/SQL Explicit Cursor Demonstration (Branch Staff Report)
CREATE OR REPLACE PROCEDURE GENERATE_BRANCH_REPORT(
    p_branch_id IN NUMBER,
    p_report OUT VARCHAR2
) AS
    v_branch_name VARCHAR2(100);
    v_city VARCHAR2(100);
    v_staff_line VARCHAR2(4000) := '';
    v_staff_count NUMBER := 0;
    
    CURSOR c_staff IS
        SELECT staff_id, name, role, department 
        FROM STAFF 
        WHERE branch_id = p_branch_id
        ORDER BY staff_id;
        
    v_staff_rec c_staff%ROWTYPE;
BEGIN
    SELECT branch_name, city INTO v_branch_name, v_city FROM BRANCH WHERE branch_id = p_branch_id;
    
    v_staff_line := 'BRANCH REPORT: ' || v_branch_name || ' (' || v_city || ')' || CHR(10) || 'STAFF ROSTER (via PL/SQL Cursor):' || CHR(10);
    
    OPEN c_staff;
    LOOP
        FETCH c_staff INTO v_staff_rec;
        EXIT WHEN c_staff%NOTFOUND;
        
        v_staff_count := v_staff_count + 1;
        v_staff_line := v_staff_line || '  #' || v_staff_count || ' ID:' || v_staff_rec.staff_id || ' | ' || v_staff_rec.name || ' | ' || v_staff_rec.role || ' (' || v_staff_rec.department || ')' || CHR(10);
    END LOOP;
    CLOSE c_staff;
    
    IF v_staff_count = 0 THEN
        v_staff_line := v_staff_line || '  (No staff currently assigned)' || CHR(10);
    END IF;
    
    v_staff_line := v_staff_line || 'Total Staff Count: ' || v_staff_count;
    p_report := v_staff_line;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_report := 'Error: Branch ID ' || p_branch_id || ' does not exist.';
    WHEN OTHERS THEN
        IF c_staff%ISOPEN THEN
            CLOSE c_staff;
        END IF;
        p_report := 'Error generating branch report: ' || SQLERRM;
END;
/
