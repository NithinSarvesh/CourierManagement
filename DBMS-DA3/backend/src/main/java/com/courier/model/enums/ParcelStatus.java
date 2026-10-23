package com.courier.model.enums;

import java.util.EnumSet;
import java.util.Set;

public enum ParcelStatus {
    BOOKED,
    PICKED_UP,
    IN_TRANSIT,
    OUT_FOR_DELIVERY,
    DELIVERED,
    DELIVERY_FAILED,
    CANCELLED;

    public boolean canTransitionTo(ParcelStatus target) {
        if (this == target) {
            return true;
        }
        return switch (this) {
            case BOOKED -> target == PICKED_UP || target == CANCELLED;
            case PICKED_UP -> target == IN_TRANSIT || target == CANCELLED;
            case IN_TRANSIT -> target == OUT_FOR_DELIVERY || target == DELIVERY_FAILED || target == CANCELLED;
            case OUT_FOR_DELIVERY -> target == DELIVERED || target == DELIVERY_FAILED || target == IN_TRANSIT;
            case DELIVERY_FAILED -> target == OUT_FOR_DELIVERY || target == IN_TRANSIT || target == CANCELLED;
            case DELIVERED -> false; // Terminal state - delivered parcels cannot revert
            case CANCELLED -> false; // Terminal state
        };
    }
}
