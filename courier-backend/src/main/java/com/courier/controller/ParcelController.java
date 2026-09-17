package com.courier.controller;

import com.courier.model.Parcel;
import com.courier.repository.ParcelRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parcels")
public class ParcelController {

    private final ParcelRepository parcelRepository;

    public ParcelController(ParcelRepository parcelRepository) {
        this.parcelRepository = parcelRepository;
    }

    @GetMapping
    public List<Parcel> getAllParcels() {
        return parcelRepository.getAllParcels();
    }
    @GetMapping("/search")
    public List<Parcel> searchParcelsByCourier(@RequestParam int courierId) {
        return parcelRepository.searchParcelsByCourier(courierId);
    }

    @GetMapping("/{id}")
    public Parcel getParcelById(@PathVariable int id) {
        return parcelRepository.getParcelById(id);
    }

    @PostMapping
    public String addParcel(@RequestBody Parcel parcel) {
        parcelRepository.addParcel(parcel);
        return "Parcel added successfully";
    }

    @PutMapping("/{id}")
    public String updateParcel(@PathVariable int id, @RequestBody Parcel parcel) {
        parcelRepository.updateParcel(id, parcel);
        return "Parcel updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteParcel(@PathVariable int id) {
        parcelRepository.deleteParcel(id);
        return "Parcel deleted successfully";
    }

    @GetMapping("/order/{orderId}")
public List<Parcel> getParcelsByOrderId(@PathVariable int orderId) {
    return parcelRepository.getParcelsByOrderId(orderId);
}

    @GetMapping("/courier/{courierId}")
public List<Parcel> getParcelsByCourierId(@PathVariable int courierId) {
    return parcelRepository.getParcelsByCourierId(courierId);
}
}