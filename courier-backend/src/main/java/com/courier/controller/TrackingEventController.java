package com.courier.controller;

import com.courier.model.TrackingEvent;
import com.courier.repository.TrackingEventRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tracking-events")
public class TrackingEventController {

    private final TrackingEventRepository trackingEventRepository;

    public TrackingEventController(TrackingEventRepository trackingEventRepository) {
        this.trackingEventRepository = trackingEventRepository;
    }

    @GetMapping
    public List<TrackingEvent> getAllTrackingEvents() {
        return trackingEventRepository.getAllTrackingEvents();
    }

    @GetMapping("/{id}")
    public TrackingEvent getTrackingEventById(@PathVariable int id) {
        return trackingEventRepository.getTrackingEventById(id);
    }

    @PostMapping
    public String addTrackingEvent(@RequestBody TrackingEvent event) {
        trackingEventRepository.addTrackingEvent(event);
        return "Tracking event added successfully";
    }

    @PutMapping("/{id}")
    public String updateTrackingEvent(@PathVariable int id, @RequestBody TrackingEvent event) {
        trackingEventRepository.updateTrackingEvent(id, event);
        return "Tracking event updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteTrackingEvent(@PathVariable int id) {
        trackingEventRepository.deleteTrackingEvent(id);
        return "Tracking event deleted successfully";
    }
    @GetMapping("/search")
    public List<TrackingEvent> searchTrackingEvents(@RequestParam String eventType) {
        return trackingEventRepository.searchTrackingEvents(eventType);
    }

    @GetMapping("/parcel/{parcelId}")
public List<TrackingEvent> getEventsByParcelId(@PathVariable int parcelId) {
    return trackingEventRepository.getEventsByParcelId(parcelId);
}
}