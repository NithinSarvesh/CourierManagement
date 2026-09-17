package com.courier.controller;

import com.courier.model.BranchStaff;
import com.courier.repository.BranchStaffRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/branch-staff")
public class BranchStaffController {

    private final BranchStaffRepository branchStaffRepository;

    public BranchStaffController(BranchStaffRepository branchStaffRepository) {
        this.branchStaffRepository = branchStaffRepository;
    }

    @GetMapping
    public List<BranchStaff> getAllBranchStaff() {
        return branchStaffRepository.getAllBranchStaff();
    }

    @GetMapping("/{id}")
    public BranchStaff getBranchStaffById(@PathVariable int id) {
        return branchStaffRepository.getBranchStaffById(id);
    }

    @PostMapping
    public String addBranchStaff(@RequestBody BranchStaff staff) {
        branchStaffRepository.addBranchStaff(staff);
        return "Branch staff added successfully";
    }

    @PutMapping("/{id}")
    public String updateBranchStaff(@PathVariable int id, @RequestBody BranchStaff staff) {
        branchStaffRepository.updateBranchStaff(id, staff);
        return "Branch staff updated successfully";
    }
    @GetMapping("/search")
    public List<BranchStaff> searchBranchStaff(@RequestParam String department) {
        return branchStaffRepository.searchBranchStaff(department);
    }

    @DeleteMapping("/{id}")
    public String deleteBranchStaff(@PathVariable int id) {
        branchStaffRepository.deleteBranchStaff(id);
        return "Branch staff deleted successfully";
    }
}