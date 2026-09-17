#!/bin/bash

BASE="http://localhost:8081"

echo "================ CUSTOMER ================"

echo "POST Customer"
curl -s -X POST "$BASE/api/customers" \
-H "Content-Type: application/json" \
-d '{"customerId":9001,"name":"Test Customer","email":"testcustomer@gmail.com","street":"Test Street","city":"Hyderabad","pin":"500001"}'
echo
echo

echo "PUT Customer"
curl -s -X PUT "$BASE/api/customers/9001" \
-H "Content-Type: application/json" \
-d '{"customerId":9001,"name":"Updated Customer","email":"updated@gmail.com","street":"Updated Street","city":"Hyderabad","pin":"500002"}'
echo
echo

echo "DELETE Customer"
curl -s -X DELETE "$BASE/api/customers/9001"
echo
echo


echo "================ COURIER ================"

echo "POST Courier"
curl -s -X POST "$BASE/api/couriers" \
-H "Content-Type: application/json" \
-d '{"courierId":9001,"name":"Test Courier","email":"testcourier@gmail.com"}'
echo
echo

echo "PUT Courier"
curl -s -X PUT "$BASE/api/couriers/9001" \
-H "Content-Type: application/json" \
-d '{"courierId":9001,"name":"Updated Courier","email":"updatedcourier@gmail.com"}'
echo
echo

echo "DELETE Courier"
curl -s -X DELETE "$BASE/api/couriers/9001"
echo
echo


echo "================ BRANCH ================"

echo "POST Branch"
curl -s -X POST "$BASE/api/branches" \
-H "Content-Type: application/json" \
-d '{"branchId":9001,"branchName":"Test Branch","street":"Test Street","city":"Hyderabad","pin":"500003"}'
echo
echo

echo "PUT Branch"
curl -s -X PUT "$BASE/api/branches/9001" \
-H "Content-Type: application/json" \
-d '{"branchId":9001,"branchName":"Updated Branch","street":"Updated Street","city":"Hyderabad","pin":"500004"}'
echo
echo

echo "DELETE Branch"
curl -s -X DELETE "$BASE/api/branches/9001"
echo
echo


echo "================ STAFF ================"

echo "POST Staff"
curl -s -X POST "$BASE/api/staff" \
-H "Content-Type: application/json" \
-d '{"staffId":9001,"role":"Test Staff","branchId":1,"name":"Test Staff","department":"Testing"}'
echo
echo

echo "PUT Staff"
curl -s -X PUT "$BASE/api/staff/9001" \
-H "Content-Type: application/json" \
-d '{"staffId":9001,"role":"Updated Staff","branchId":1,"name":"Updated Staff","department":"Development"}'
echo
echo

echo "DELETE Staff"
curl -s -X DELETE "$BASE/api/staff/9001"
echo
echo


echo "================ COURIER SERVICE ================"

echo "POST Courier Service"
curl -s -X POST "$BASE/api/courier-services" \
-H "Content-Type: application/json" \
-d '{"serviceId":9001,"branchId":1,"courierId":101,"charges":999}'
echo
echo

echo "PUT Courier Service"
curl -s -X PUT "$BASE/api/courier-services/9001" \
-H "Content-Type: application/json" \
-d '{"serviceId":9001,"branchId":1,"courierId":101,"charges":888}'
echo
echo

echo "DELETE Courier Service"
curl -s -X DELETE "$BASE/api/courier-services/9001"
echo
echo


echo "================ ORDERS ================"

echo "POST Order"
curl -s -X POST "$BASE/api/orders" \
-H "Content-Type: application/json" \
-d '{"orderId":9001,"customerId":1001,"serviceId":301,"orderDate":"2026-09-14T16:00:00","status":"Pending","amount":999}'
echo
echo

echo "PUT Order"
curl -s -X PUT "$BASE/api/orders/9001" \
-H "Content-Type: application/json" \
-d '{"orderId":9001,"customerId":1001,"serviceId":301,"orderDate":"2026-09-14T16:00:00","status":"Delivered","amount":888}'
echo
echo

echo "DELETE Order"
curl -s -X DELETE "$BASE/api/orders/9001"
echo
echo


echo "================ PAYMENT ================"

echo "POST Payment"
curl -s -X POST "$BASE/api/payments" \
-H "Content-Type: application/json" \
-d '{"paymentId":9001,"customerId":1001,"orderId":4001,"amount":999,"status":"Paid"}'
echo
echo

echo "PUT Payment"
curl -s -X PUT "$BASE/api/payments/9001" \
-H "Content-Type: application/json" \
-d '{"paymentId":9001,"customerId":1001,"orderId":4001,"amount":888,"status":"Pending"}'
echo
echo

echo "DELETE Payment"
curl -s -X DELETE "$BASE/api/payments/9001"
echo
echo


echo "================ PARCEL ================"

echo "POST Parcel"
curl -s -X POST "$BASE/api/parcels" \
-H "Content-Type: application/json" \
-d '{"parcelId":9001,"orderId":4001,"price":999,"courierId":101,"staffId":202}'
echo
echo

echo "PUT Parcel"
curl -s -X PUT "$BASE/api/parcels/9001" \
-H "Content-Type: application/json" \
-d '{"parcelId":9001,"orderId":4001,"price":888,"courierId":101,"staffId":202}'
echo
echo

echo "DELETE Parcel"
curl -s -X DELETE "$BASE/api/parcels/9001"
echo
echo


echo "================ VEHICLE ================"

echo "POST Vehicle"
curl -s -X POST "$BASE/api/vehicles" \
-H "Content-Type: application/json" \
-d '{"vehicleNo":"TEST9001","licenseNo":"TESTLIC9001","staffId":202}'
echo
echo

echo "PUT Vehicle"
curl -s -X PUT "$BASE/api/vehicles/TEST9001" \
-H "Content-Type: application/json" \
-d '{"vehicleNo":"TEST9001","licenseNo":"UPDATED9001","staffId":202}'
echo
echo

echo "DELETE Vehicle"
curl -s -X DELETE "$BASE/api/vehicles/TEST9001"
echo
echo


echo "================ TRACKING EVENT ================"

echo "POST Tracking Event"
curl -s -X POST "$BASE/api/tracking-events" \
-H "Content-Type: application/json" \
-d '{"eventId":9001,"parcelId":6001,"eventType":"Testing","eventTime":"2026-09-14T16:00:00"}'
echo
echo

echo "PUT Tracking Event"
curl -s -X PUT "$BASE/api/tracking-events/9001" \
-H "Content-Type: application/json" \
-d '{"eventId":9001,"parcelId":6001,"eventType":"Updated Testing","eventTime":"2026-09-14T16:30:00"}'
echo
echo

echo "DELETE Tracking Event"
curl -s -X DELETE "$BASE/api/tracking-events/9001"
echo
echo


echo "================ DELIVERY ATTEMPT ================"

echo "POST Delivery Attempt"
curl -s -X POST "$BASE/api/delivery-attempts" \
-H "Content-Type: application/json" \
-d '{"branchId":1,"courierId":101,"attemptNo":9001,"attemptTime":"2026-09-14T16:00:00","status":"Testing"}'
echo
echo

echo "PUT Delivery Attempt"
curl -s -X PUT "$BASE/api/delivery-attempts/1/9001" \
-H "Content-Type: application/json" \
-d '{"branchId":1,"courierId":101,"attemptNo":9001,"attemptTime":"2026-09-14T16:30:00","status":"Updated"}'
echo
echo

echo "DELETE Delivery Attempt"
curl -s -X DELETE "$BASE/api/delivery-attempts/1/9001"
echo
echo

echo "================ CRUD TEST COMPLETE ================"