package com.courier.controller;

import com.courier.model.Staff;
import com.courier.repository.StaffRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final StaffRepository staffRepository;

    public StaffController(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }
    @GetMapping("/search")
    public List<Staff> searchStaff(@RequestParam String role) {
        return staffRepository.searchStaff(role);
    }

    @GetMapping
    public List<Staff> getAllStaff() {
        return staffRepository.getAllStaff();
    }

    @GetMapping("/{id}")
    public Staff getStaffById(@PathVariable int id) {
        return staffRepository.getStaffById(id);
    }

    @PostMapping
    public String addStaff(@RequestBody Staff staff) {
        staffRepository.addStaff(staff);
        return "Staff added successfully";
    }

    @PutMapping("/{id}")
    public String updateStaff(@PathVariable int id, @RequestBody Staff staff) {
        staffRepository.updateStaff(id, staff);
        return "Staff updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteStaff(@PathVariable int id) {
        staffRepository.deleteStaff(id);
        return "Staff deleted successfully";
    }

    @GetMapping("/branch/{branchId}")
public List<Staff> getStaffByBranchId(@PathVariable int branchId) {
    return staffRepository.getStaffByBranchId(branchId);
}
}