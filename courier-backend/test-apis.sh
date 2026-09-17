#!/bin/bash

echo "CUSTOMERS"
curl -s http://localhost:8081/api/customers
echo -e "\n\nCOURIERS"
curl -s http://localhost:8081/api/couriers
echo -e "\n\nBRANCHES"
curl -s http://localhost:8081/api/branches
echo -e "\n\nSTAFF"
curl -s http://localhost:8081/api/staff
echo -e "\n\nCOURIER SERVICES"
curl -s http://localhost:8081/api/courier-services
echo -e "\n\nORDERS"
curl -s http://localhost:8081/api/orders
echo -e "\n\nPAYMENTS"
curl -s http://localhost:8081/api/payments
echo -e "\n\nCASH MODES"
curl -s http://localhost:8081/api/cash-modes
echo -e "\n\nCARD MODES"
curl -s http://localhost:8081/api/card-modes
echo -e "\n\nONLINE MODES"
curl -s http://localhost:8081/api/online-modes
echo -e "\n\nPARCELS"
curl -s http://localhost:8081/api/parcels
echo -e "\n\nVEHICLES"
curl -s http://localhost:8081/api/vehicles
echo -e "\n\nTRACKING EVENTS"
curl -s http://localhost:8081/api/tracking-events
echo -e "\n\nDELIVERY ATTEMPTS"
curl -s http://localhost:8081/api/delivery-attempts
echo -e "\n\nMANAGERS"
curl -s http://localhost:8081/api/managers
echo -e "\n\nCUSTOMER SUPPORT"
curl -s http://localhost:8081/api/customer-support
echo -e "\n\nACCOUNTANTS"
curl -s http://localhost:8081/api/accountants
echo -e "\n\nDELIVERY BOYS"
curl -s http://localhost:8081/api/delivery-boys
echo -e "\n\nBRANCH STAFF"
curl -s http://localhost:8081/api/branch-staff
echo -e "\n\nDRIVERS"
curl -s http://localhost:8081/api/drivers
echo