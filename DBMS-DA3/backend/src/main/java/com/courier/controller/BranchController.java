package com.courier.controller;

import com.courier.dto.BranchDto;
import com.courier.dto.ConnectedBranchDto;
import com.courier.dto.ParcelResponseDto;
import com.courier.service.BranchService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    private final BranchService branchService;

    public BranchController(BranchService branchService) {
        this.branchService = branchService;
    }

    @PostMapping
    public ResponseEntity<BranchDto> createBranch(@Valid @RequestBody BranchDto request) {
        BranchDto created = branchService.createBranch(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<BranchDto>> listBranches() {
        return ResponseEntity.ok(branchService.getAllBranches());
    }

    @GetMapping("/search")
    public ResponseEntity<List<BranchDto>> searchBranches(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(branchService.searchBranches(query));
    }

    @GetMapping("/{branchId}")
    public ResponseEntity<BranchDto> getBranchById(@PathVariable String branchId) {
        return ResponseEntity.ok(branchService.getBranchById(branchId));
    }

    @PutMapping("/{branchId}")
    public ResponseEntity<BranchDto> updateBranch(
            @PathVariable String branchId,
            @Valid @RequestBody BranchDto request) {
        return ResponseEntity.ok(branchService.updateBranch(branchId, request));
    }

    @DeleteMapping("/{branchId}")
    public ResponseEntity<Void> deleteBranch(@PathVariable String branchId) {
        branchService.deleteBranch(branchId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{branchId}/parcels")
    public ResponseEntity<List<ParcelResponseDto>> getParcelsByBranch(
            @PathVariable String branchId,
            @RequestParam(required = false, defaultValue = "all") String type) {
        return ResponseEntity.ok(branchService.getParcelsByBranch(branchId, type));
    }

    @GetMapping("/{branchId}/connected")
    public ResponseEntity<List<ConnectedBranchDto>> getConnectedBranches(@PathVariable String branchId) {
        return ResponseEntity.ok(branchService.getConnectedBranches(branchId));
    }
}
