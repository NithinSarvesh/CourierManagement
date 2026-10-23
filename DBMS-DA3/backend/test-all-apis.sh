#!/bin/bash

BASE="http://localhost:8082"
CUSTOMER_ID="C006"
ORIGIN="B004"
DESTINATION="B001"
SERVICE="CS001"

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

test_api() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    local test_name="$1"
    local expected_status="$2"
    shift 2

    echo
    echo "========================================"
    echo "TEST [$TOTAL_TESTS]: $test_name"
    echo "========================================"
    
    local response_file=$(mktemp)
    local http_code=$(curl -sS -w "%{http_code}" -o "$response_file" "$@")
    
    echo "HTTP Status: $http_code (Expected: $expected_status)"
    cat "$response_file" | head -n 30
    echo
    
    if [[ "$http_code" == "$expected_status" ]]; then
        echo "--> RESULT: PASS"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "--> RESULT: FAIL (Expected $expected_status but got $http_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    rm -f "$response_file"
}

echo "COURIER MANAGEMENT SYSTEM - COMPREHENSIVE API TEST SUITE"
echo "Backend Base URL: $BASE"

# 1. Core Reference / Listing APIs
test_api "Branches Listing" "200" "$BASE/api/branches"
test_api "Connected Branches for B001" "200" "$BASE/api/branches/B001/connected"
test_api "Services Listing" "200" "$BASE/api/services"
test_api "Customers Listing (Paged)" "200" "$BASE/api/customers?page=0&size=10"
test_api "Customer Details for $CUSTOMER_ID" "200" "$BASE/api/customers/$CUSTOMER_ID"
test_api "Customer History for $CUSTOMER_ID" "200" "$BASE/api/customers/$CUSTOMER_ID/history"
test_api "Dashboard Summary" "200" "$BASE/api/dashboard"
test_api "Agents Listing" "200" "$BASE/api/agents"
test_api "Available Agents" "200" "$BASE/api/agents/available"
test_api "Delivery Attempts Listing" "200" "$BASE/api/delivery-attempts"
test_api "Parcels Listing (Paged)" "200" "$BASE/api/parcels?page=0&size=10"
test_api "Payments Listing" "200" "$BASE/api/payments"
test_api "Payments Summary" "200" "$BASE/api/payments/summary"
test_api "Routes Exploration" "200" "$BASE/api/routes"
test_api "Staff Listing" "200" "$BASE/api/staff"
test_api "Support Tickets Listing" "200" "$BASE/api/support-tickets"
test_api "Vehicles Listing" "200" "$BASE/api/vehicles"
test_api "Tracking Events Listing" "200" "$BASE/api/tracking"

# 2. Parcel Booking Workflow (Transactional Write & Verify)
echo
echo "========================================"
echo "TEST: Parcel Booking (POST /api/parcels)"
echo "========================================"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
BOOKING_RESPONSE=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/parcels" \
  -H "Content-Type: application/json" \
  -d "{\"customerId\":\"$CUSTOMER_ID\",\"originBranchId\":\"$ORIGIN\",\"destinationBranchId\":\"$DESTINATION\",\"serviceId\":\"$SERVICE\",\"weight\":2.5}")

BOOKING_HTTP_CODE=$(echo "$BOOKING_RESPONSE" | tail -n 1)
BOOKING_BODY=$(echo "$BOOKING_RESPONSE" | sed '$d')

echo "HTTP Status: $BOOKING_HTTP_CODE"
echo "$BOOKING_BODY"

BOOKED_TRACKING=$(echo "$BOOKING_BODY" | grep -o '"trackingNumber":"[^"]*"' | head -n 1 | cut -d'"' -f4)

if [[ "$BOOKING_HTTP_CODE" == "201" && -n "$BOOKED_TRACKING" ]]; then
    echo "--> RESULT: PASS (Booked: $BOOKED_TRACKING)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "--> RESULT: FAIL"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 3. Post-Booking Verification with the generated tracking number
if [[ -n "$BOOKED_TRACKING" ]]; then
    test_api "Get Booked Parcel Details ($BOOKED_TRACKING)" "200" "$BASE/api/parcels/$BOOKED_TRACKING"
    test_api "Get Tracking History for $BOOKED_TRACKING" "200" "$BASE/api/tracking/$BOOKED_TRACKING"
    test_api "Get Current Status for $BOOKED_TRACKING" "200" "$BASE/api/tracking/$BOOKED_TRACKING/current-status"

    # Add tracking event: PICKED_UP
    echo
    echo "========================================"
    echo "TEST: Add Tracking Event for $BOOKED_TRACKING"
    echo "========================================"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    TRACK_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/tracking" \
      -H "Content-Type: application/json" \
      -d "{\"trackingNumber\":\"$BOOKED_TRACKING\",\"location\":\"Hub Central\",\"status\":\"PICKED_UP\",\"remarks\":\"Picked up by agent\"}")
    TRACK_CODE=$(echo "$TRACK_RESP" | tail -n 1)
    echo "HTTP Status: $TRACK_CODE"
    echo "$TRACK_RESP" | sed '$d'
    if [[ "$TRACK_CODE" == "201" ]]; then
        echo "--> RESULT: PASS"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "--> RESULT: FAIL"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    # Record Payment for the parcel
    echo
    echo "========================================"
    echo "TEST: Record Payment for $BOOKED_TRACKING"
    echo "========================================"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PAY_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/payments" \
      -H "Content-Type: application/json" \
      -d "{\"trackingNumber\":\"$BOOKED_TRACKING\",\"amount\":160.0,\"method\":\"UPI\",\"status\":\"PAID\"}")
    PAY_CODE=$(echo "$PAY_RESP" | tail -n 1)
    echo "HTTP Status: $PAY_CODE"
    echo "$PAY_RESP" | sed '$d'
    if [[ "$PAY_CODE" == "201" ]]; then
        echo "--> RESULT: PASS"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "--> RESULT: FAIL"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    test_api "Get Payment by Parcel ($BOOKED_TRACKING)" "200" "$BASE/api/payments/parcel/$BOOKED_TRACKING"

    # Record Delivery Attempt
    echo
    echo "========================================"
    echo "TEST: Record Delivery Attempt for $BOOKED_TRACKING"
    echo "========================================"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    ATTEMPT_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/delivery-attempts" \
      -H "Content-Type: application/json" \
      -d "{\"trackingNumber\":\"$BOOKED_TRACKING\",\"attemptNumber\":1,\"result\":\"CUSTOMER_UNAVAILABLE\",\"remarks\":\"Door locked\"}")
    ATTEMPT_CODE=$(echo "$ATTEMPT_RESP" | tail -n 1)
    echo "HTTP Status: $ATTEMPT_CODE"
    echo "$ATTEMPT_RESP" | sed '$d'
    if [[ "$ATTEMPT_CODE" == "201" ]]; then
        echo "--> RESULT: PASS"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "--> RESULT: FAIL"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    test_api "Get Delivery Attempts for Parcel ($BOOKED_TRACKING)" "200" "$BASE/api/delivery-attempts/parcel/$BOOKED_TRACKING"
fi

# 4. Vehicle Assignment Verification
test_api "Get Specific Vehicle V001" "200" "$BASE/api/vehicles/V001"
echo
echo "========================================"
echo "TEST: Vehicle Assignment (V001 to A001)"
echo "========================================"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
ASSIGN_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/vehicles/V001/assign-agent/A001")
ASSIGN_CODE=$(echo "$ASSIGN_RESP" | tail -n 1)
ASSIGN_BODY=$(echo "$ASSIGN_RESP" | sed '$d')
echo "HTTP Status: $ASSIGN_CODE"
echo "$ASSIGN_BODY"
if [[ "$ASSIGN_CODE" == "200" && "$ASSIGN_BODY" == *"assignedAgentId\":\"A001"* ]]; then
    echo "--> RESULT: PASS (Vehicle V001 assigned to A001 verified)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "--> RESULT: FAIL"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 5. Negative Test Cases
test_api "Parcel Not Found (404 Expected)" "404" "$BASE/api/parcels/NONEXISTENT_999"
test_api "Customer Not Found (404 Expected)" "404" "$BASE/api/customers/UNKNOWN_CUST"

echo
echo "========================================"
echo "TEST SUMMARY"
echo "========================================"
echo "Total Tests Run : $TOTAL_TESTS"
echo "Passed          : $PASSED_TESTS"
echo "Failed          : $FAILED_TESTS"
echo "========================================"

if [[ "$FAILED_TESTS" -eq 0 ]]; then
    echo "ALL TESTS PASSED SUCCESSFULLY!"
    exit 0
else
    echo "SOME TESTS FAILED!"
    exit 1
fi
