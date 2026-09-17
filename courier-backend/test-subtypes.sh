#!/bin/bash

BASE="http://localhost:8081/api"

echo "================ CREATE TEMPORARY PARENT RECORDS ================"

curl -s -X POST "$BASE/staff" \
-H "Content-Type: application/json" \
-d '{"staffId":9101,"role":"Manager","branchId":1,"name":"Temp Manager","department":"Management"}'

curl -s -X POST "$BASE/staff" \
-H "Content-Type: application/json" \
-d '{"staffId":9102,"role":"Customer Support","branchId":1,"name":"Temp Support","department":"Support"}'

curl -s -X POST "$BASE/staff" \
-H "Content-Type: application/json" \
-d '{"staffId":9103,"role":"Accountant","branchId":1,"name":"Temp Accountant","department":"Accounts"}'

curl -s -X POST "$BASE/couriers" \
-H "Content-Type: application/json" \
-d '{"courierId":9201,"name":"Temp Delivery Boy","email":"temp1@test.com"}'

curl -s -X POST "$BASE/couriers" \
-H "Content-Type: application/json" \
-d '{"courierId":9202,"name":"Temp Branch Staff","email":"temp2@test.com"}'

curl -s -X POST "$BASE/couriers" \
-H "Content-Type: application/json" \
-d '{"courierId":9203,"name":"Temp Driver","email":"temp3@test.com"}'

curl -s -X POST "$BASE/payments" \
-H "Content-Type: application/json" \
-d '{"paymentId":9301,"customerId":1001,"orderId":4001,"amount":100,"status":"Paid"}'

curl -s -X POST "$BASE/payments" \
-H "Content-Type: application/json" \
-d '{"paymentId":9302,"customerId":1001,"orderId":4001,"amount":200,"status":"Paid"}'

curl -s -X POST "$BASE/payments" \
-H "Content-Type: application/json" \
-d '{"paymentId":9303,"customerId":1001,"orderId":4001,"amount":300,"status":"Paid"}'

echo
echo "================ MANAGER ================"

echo "POST Manager"
curl -s -X POST "$BASE/managers" \
-H "Content-Type: application/json" \
-d '{"staffId":9101,"managerId":9101}'
echo

echo "PUT Manager"
curl -s -X PUT "$BASE/managers/9101" \
-H "Content-Type: application/json" \
-d '{"staffId":9101,"managerId":9101}'
echo

echo "DELETE Manager"
curl -s -X DELETE "$BASE/managers/9101"
echo

echo "================ CUSTOMER SUPPORT ================"

echo "POST Customer Support"
curl -s -X POST "$BASE/customer-support" \
-H "Content-Type: application/json" \
-d '{"staffId":9102,"staffTiming":"10 AM - 6 PM"}'
echo

echo "PUT Customer Support"
curl -s -X PUT "$BASE/customer-support/9102" \
-H "Content-Type: application/json" \
-d '{"staffId":9102,"staffTiming":"9 AM - 5 PM"}'
echo

echo "DELETE Customer Support"
curl -s -X DELETE "$BASE/customer-support/9102"
echo

echo "================ ACCOUNTANT ================"

echo "POST Accountant"
curl -s -X POST "$BASE/accountants" \
-H "Content-Type: application/json" \
-d '{"staffId":9103,"qualification":"B.Com"}'
echo

echo "PUT Accountant"
curl -s -X PUT "$BASE/accountants/9103" \
-H "Content-Type: application/json" \
-d '{"staffId":9103,"qualification":"M.Com"}'
echo

echo "DELETE Accountant"
curl -s -X DELETE "$BASE/accountants/9103"
echo

echo "================ DELIVERY BOY ================"

echo "POST Delivery Boy"
curl -s -X POST "$BASE/delivery-boys" \
-H "Content-Type: application/json" \
-d '{"courierId":9201,"areaAssigned":"Hyderabad"}'
echo

echo "PUT Delivery Boy"
curl -s -X PUT "$BASE/delivery-boys/9201" \
-H "Content-Type: application/json" \
-d '{"courierId":9201,"areaAssigned":"Secunderabad"}'
echo

echo "DELETE Delivery Boy"
curl -s -X DELETE "$BASE/delivery-boys/9201"
echo

echo "================ BRANCH STAFF ================"

echo "POST Branch Staff"
curl -s -X POST "$BASE/branch-staff" \
-H "Content-Type: application/json" \
-d '{"courierId":9202,"department":"Operations"}'
echo

echo "PUT Branch Staff"
curl -s -X PUT "$BASE/branch-staff/9202" \
-H "Content-Type: application/json" \
-d '{"courierId":9202,"department":"Administration"}'
echo

echo "DELETE Branch Staff"
curl -s -X DELETE "$BASE/branch-staff/9202"
echo

echo "================ DRIVER ================"

echo "POST Driver"
curl -s -X POST "$BASE/drivers" \
-H "Content-Type: application/json" \
-d '{"courierId":9203,"licenseNo":"TEMP123"}'
echo

echo "PUT Driver"
curl -s -X PUT "$BASE/drivers/9203" \
-H "Content-Type: application/json" \
-d '{"courierId":9203,"licenseNo":"TEMP456"}'
echo

echo "DELETE Driver"
curl -s -X DELETE "$BASE/drivers/9203"
echo

echo "================ CASH MODE ================"

echo "POST Cash Mode"
curl -s -X POST "$BASE/cash-modes" \
-H "Content-Type: application/json" \
-d '{"paymentId":9301}'
echo

echo "PUT Cash Mode"
curl -s -X PUT "$BASE/cash-modes/9301" \
-H "Content-Type: application/json" \
-d '{"paymentId":9301}'
echo

echo "DELETE Cash Mode"
curl -s -X DELETE "$BASE/cash-modes/9301"
echo

echo "================ CARD MODE ================"

echo "POST Card Mode"
curl -s -X POST "$BASE/card-modes" \
-H "Content-Type: application/json" \
-d '{"paymentId":9302}'
echo

echo "PUT Card Mode"
curl -s -X PUT "$BASE/card-modes/9302" \
-H "Content-Type: application/json" \
-d '{"paymentId":9302}'
echo

echo "DELETE Card Mode"
curl -s -X DELETE "$BASE/card-modes/9302"
echo

echo "================ ONLINE MODE ================"

echo "POST Online Mode"
curl -s -X POST "$BASE/online-modes" \
-H "Content-Type: application/json" \
-d '{"paymentId":9303}'
echo

echo "PUT Online Mode"
curl -s -X PUT "$BASE/online-modes/9303" \
-H "Content-Type: application/json" \
-d '{"paymentId":9303}'
echo

echo "DELETE Online Mode"
curl -s -X DELETE "$BASE/online-modes/9303"
echo

echo "================ CLEANUP ================"

curl -s -X DELETE "$BASE/staff/9101"
curl -s -X DELETE "$BASE/staff/9102"
curl -s -X DELETE "$BASE/staff/9103"

curl -s -X DELETE "$BASE/couriers/9201"
curl -s -X DELETE "$BASE/couriers/9202"
curl -s -X DELETE "$BASE/couriers/9203"

curl -s -X DELETE "$BASE/payments/9301"
curl -s -X DELETE "$BASE/payments/9302"
curl -s -X DELETE "$BASE/payments/9303"

echo
echo "================ SUBTYPE CRUD TEST COMPLETE ================"