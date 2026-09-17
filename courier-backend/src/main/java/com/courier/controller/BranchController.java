package com.courier.controller;

import com.courier.model.Branch;
import com.courier.repository.BranchRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    private final BranchRepository branchRepository;

    public BranchController(BranchRepository branchRepository) {
        this.branchRepository = branchRepository;
    }

    @GetMapping
    public List<Branch> getAllBranches() {
        return branchRepository.getAllBranches();
    }

    @GetMapping("/{id}")
    public Branch getBranchById(@PathVariable int id) {
        return branchRepository.getBranchById(id);
    }

    @PostMapping
    public String addBranch(@RequestBody Branch branch) {
        branchRepository.addBranch(branch);
        return "Branch added successfully";
    }

    @PutMapping("/{id}")
    public String updateBranch(@PathVariable int id, @RequestBody Branch branch) {
        branchRepository.updateBranch(id, branch);
        return "Branch updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteBranch(@PathVariable int id) {
        branchRepository.deleteBranch(id);
        return "Branch deleted successfully";
    }
}