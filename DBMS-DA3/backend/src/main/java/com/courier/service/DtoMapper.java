package com.courier.service;

import com.courier.dto.*;
import com.courier.repository.DeliveryAttemptRepository;
import com.courier.repository.TrackingEventRepository;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

public class DtoMapper {

    public static ParcelResponseDto mapToParcelResponse(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return null;
        }

        String trackingNumber = (String) map.get("trackingNumber");
        Double weight = map.get("weight") != null ? ((Number) map.get("weight")).doubleValue() : null;
        Double deliveryCharge = map.get("deliveryCharge") != null ? ((Number) map.get("deliveryCharge")).doubleValue() : null;
        String status = (String) map.get("status");

        ParcelResponseDto dto = new ParcelResponseDto(trackingNumber, weight, deliveryCharge, status);

        if (map.get("customerId") != null) {
            CustomerResponseDto cust = new CustomerResponseDto();
            cust.setCustomerId((String) map.get("customerId"));
            cust.setName((String) map.get("customerName"));
            cust.setEmail((String) map.get("customerEmail"));
            cust.setPhone((String) map.get("customerPhone"));
            cust.setAddress((String) map.get("customerAddress"));
            if (map.get("customerTotalParcels") != null) {
                cust.setTotalParcelsBooked(((Number) map.get("customerTotalParcels")).longValue());
            }
            dto.setCustomer(cust);
        }

        if (map.get("originBranchId") != null) {
            BranchDto origin = new BranchDto();
            origin.setBranchId((String) map.get("originBranchId"));
            origin.setName((String) map.get("originBranchName"));
            origin.setCity((String) map.get("originCity"));
            dto.setOriginBranch(origin);
        }

        if (map.get("destBranchId") != null) {
            BranchDto dest = new BranchDto();
            dest.setBranchId((String) map.get("destBranchId"));
            dest.setName((String) map.get("destBranchName"));
            dest.setCity((String) map.get("destCity"));
            dto.setDestinationBranch(dest);
        }

        if (map.get("serviceId") != null) {
            CourierServiceDto srv = new CourierServiceDto();
            srv.setServiceId((String) map.get("serviceId"));
            srv.setName((String) map.get("serviceName"));
            if (map.get("estimatedDays") != null) {
                srv.setEstimatedDays(((Number) map.get("estimatedDays")).intValue());
            }
            if (map.get("baseCharge") != null) {
                srv.setBaseCharge(((Number) map.get("baseCharge")).doubleValue());
            }
            srv.setDescription((String) map.get("serviceDescription"));
            if (map.get("serviceActive") != null) {
                srv.setActive((Boolean) map.get("serviceActive"));
            } else {
                srv.setActive(true);
            }
            dto.setCourierService(srv);
        }

        if (map.get("agentId") != null) {
            DeliveryAgentDto agent = new DeliveryAgentDto();
            agent.setAgentId((String) map.get("agentId"));
            agent.setName((String) map.get("agentName"));
            agent.setPhone((String) map.get("agentPhone"));
            agent.setStatus((String) map.get("agentStatus"));
            dto.setAssignedAgent(agent);
        }

        if (map.get("paymentId") != null) {
            PaymentResponseDto payment = new PaymentResponseDto();
            payment.setPaymentId((String) map.get("paymentId"));
            if (map.get("paymentAmount") != null) {
                payment.setAmount(((Number) map.get("paymentAmount")).doubleValue());
            }
            payment.setMethod((String) map.get("paymentMethod"));
            payment.setStatus((String) map.get("paymentStatus"));
            payment.setTrackingNumber(trackingNumber);
            payment.setCustomerId((String) map.get("customerId"));
            payment.setCustomerName((String) map.get("customerName"));
            if (map.get("paymentDate") != null) {
                payment.setPaymentDate(parseZonedDateTime(map.get("paymentDate")));
            }
            payment.setTransactionRef((String) map.get("transactionRef"));
            dto.setPayment(payment);
        }

        return dto;
    }

    public static PaymentResponseDto mapToPaymentResponse(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return null;
        }
        PaymentResponseDto dto = new PaymentResponseDto();
        dto.setPaymentId((String) map.get("paymentId"));
        dto.setTrackingNumber((String) map.get("trackingNumber"));
        dto.setCustomerId((String) map.get("customerId"));
        dto.setCustomerName((String) map.get("customerName"));
        if (map.get("amount") != null) {
            dto.setAmount(((Number) map.get("amount")).doubleValue());
        }
        dto.setMethod((String) map.get("method"));
        dto.setStatus((String) map.get("status"));
        dto.setTransactionRef((String) map.get("transactionRef"));
        if (map.get("paymentDate") != null) {
            dto.setPaymentDate(parseZonedDateTime(map.get("paymentDate")));
        }
        return dto;
    }

    public static SupportTicketDto mapToSupportTicketDto(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return null;
        }
        SupportTicketDto dto = new SupportTicketDto();
        dto.setTicketId((String) map.get("ticketId"));
        dto.setCustomerId((String) map.get("customerId"));
        dto.setCustomerName((String) map.get("customerName"));
        dto.setTrackingNumber((String) map.get("trackingNumber"));
        dto.setSubject((String) map.get("subject"));
        dto.setStatus((String) map.get("status"));
        dto.setPriority((String) map.get("priority"));
        dto.setRemarks((String) map.get("remarks"));
        dto.setAssignedStaffId((String) map.get("assignedStaffId"));
        dto.setAssignedStaffName((String) map.get("assignedStaffName"));
        if (map.get("createdAt") != null) {
            dto.setCreatedAt(parseZonedDateTime(map.get("createdAt")));
        }
        return dto;
    }

    public static TrackingEventResponseDto mapToTrackingEventDto(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return null;
        }
        TrackingEventResponseDto dto = new TrackingEventResponseDto();
        dto.setEventId((String) map.get("eventId"));
        dto.setTrackingNumber((String) map.get("trackingNumber"));
        dto.setLocation((String) map.get("location"));
        dto.setStatus((String) map.get("status"));
        dto.setRemarks((String) map.get("remarks"));
        if (map.get("timestamp") != null) {
            dto.setTimestamp(parseZonedDateTime(map.get("timestamp")));
        }
        return dto;
    }

    public static DeliveryAttemptDto mapToDeliveryAttemptDto(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return null;
        }
        DeliveryAttemptDto dto = new DeliveryAttemptDto();
        dto.setAttemptId((String) map.get("attemptId"));
        dto.setTrackingNumber((String) map.get("trackingNumber"));
        if (map.get("attemptNumber") != null) {
            dto.setAttemptNumber(((Number) map.get("attemptNumber")).intValue());
        }
        dto.setResult((String) map.get("result"));
        dto.setRemarks((String) map.get("remarks"));
        if (map.get("timestamp") != null) {
            dto.setTimestamp(parseInstant(map.get("timestamp")));
        }
        return dto;
    }

    private static ZonedDateTime parseZonedDateTime(Object val) {
        if (val == null) return null;
        if (val instanceof ZonedDateTime zdt) return zdt;
        if (val instanceof Instant inst) return inst.atZone(ZoneId.of("UTC"));
        if (val instanceof OffsetDateTime odt) return odt.toZonedDateTime();
        String str = val.toString();
        if (str.isBlank()) return null;
        try {
            return ZonedDateTime.parse(str);
        } catch (Exception e1) {
            try {
                return Instant.parse(str).atZone(ZoneId.of("UTC"));
            } catch (Exception e2) {
                try {
                    return OffsetDateTime.parse(str).toZonedDateTime();
                } catch (Exception ignored) {
                    return null;
                }
            }
        }
    }

    private static Instant parseInstant(Object val) {
        if (val == null) return null;
        if (val instanceof Instant inst) return inst;
        if (val instanceof ZonedDateTime zdt) return zdt.toInstant();
        if (val instanceof OffsetDateTime odt) return odt.toInstant();
        String str = val.toString();
        if (str.isBlank()) return null;
        try {
            return Instant.parse(str);
        } catch (Exception e1) {
            try {
                return ZonedDateTime.parse(str).toInstant();
            } catch (Exception e2) {
                try {
                    return OffsetDateTime.parse(str).toInstant();
                } catch (Exception ignored) {
                    return null;
                }
            }
        }
    }

    public static void enrichParcels(List<ParcelResponseDto> parcels,
                                     TrackingEventRepository trackingEventRepository,
                                     DeliveryAttemptRepository deliveryAttemptRepository) {
        if (parcels == null || parcels.isEmpty()) {
            return;
        }
        if (trackingEventRepository == null && deliveryAttemptRepository == null) {
            return;
        }
        List<String> trackingNumbers = parcels.stream()
                .map(ParcelResponseDto::getTrackingNumber)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        if (trackingNumbers.isEmpty()) {
            return;
        }

        Map<String, List<TrackingEventResponseDto>> eventsMap = (trackingEventRepository != null)
                ? trackingEventRepository.findEventsByParcelTrackingNumbers(trackingNumbers).stream()
                        .map(DtoMapper::mapToTrackingEventDto)
                        .filter(Objects::nonNull)
                        .collect(Collectors.groupingBy(TrackingEventResponseDto::getTrackingNumber))
                : Collections.emptyMap();

        Map<String, List<DeliveryAttemptDto>> attemptsMap = (deliveryAttemptRepository != null)
                ? deliveryAttemptRepository.findAttemptsByParcelTrackingNumbers(trackingNumbers).stream()
                        .map(DtoMapper::mapToDeliveryAttemptDto)
                        .filter(Objects::nonNull)
                        .collect(Collectors.groupingBy(DeliveryAttemptDto::getTrackingNumber))
                : Collections.emptyMap();

        for (ParcelResponseDto p : parcels) {
            if (p.getTrackingEvents() == null || p.getTrackingEvents().isEmpty()) {
                p.setTrackingEvents(eventsMap.getOrDefault(p.getTrackingNumber(), Collections.emptyList()));
            }
            if (p.getDeliveryAttempts() == null || p.getDeliveryAttempts().isEmpty()) {
                p.setDeliveryAttempts(attemptsMap.getOrDefault(p.getTrackingNumber(), Collections.emptyList()));
            }
        }
    }
}
