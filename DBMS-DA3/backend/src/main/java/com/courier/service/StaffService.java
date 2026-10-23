package com.courier.service;

import com.courier.dto.StaffDto;
import com.courier.exception.DuplicateResourceException;
import com.courier.exception.ResourceNotFoundException;
import com.courier.model.Staff;
import com.courier.model.Branch;
import com.courier.repository.BranchRepository;
import com.courier.repository.StaffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StaffService {

    private final StaffRepository staffRepository;
    private final BranchRepository branchRepository;

    public StaffService(StaffRepository staffRepository, BranchRepository branchRepository) {
        this.staffRepository = staffRepository;
        this.branchRepository = branchRepository;
    }

    @Transactional
    public StaffDto createStaff(StaffDto request) {
        String staffId = request.getStaffId();
        if (staffId == null || staffId.isBlank()) {
            staffId = "ST" + String.format("%03d", staffRepository.count() + 1);
            while (staffRepository.findByStaffId(staffId).isPresent()) {
                staffId = "ST" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            }
        } else {
            if (staffRepository.findByStaffId(staffId).isPresent()) {
                throw new DuplicateResourceException("Staff with ID '" + staffId + "' already exists");
            }
        }

        Staff saved = staffRepository.saveOrUpdateStaff(
                staffId,
                request.getName(),
                request.getRole(),
                request.getEmail(),
                request.getBranchId(),
                request.getActive() != null ? request.getActive() : true
        );

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<StaffDto> getAllStaff() {
        return staffRepository.findAllStaff().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StaffDto getStaffById(String staffId) {
        Staff staff = staffRepository.findByStaffId(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff member not found with ID: " + staffId));
        return mapToDto(staff);
    }

    @Transactional
    public StaffDto updateStaff(String staffId, StaffDto request) {
        Staff existing = staffRepository.findByStaffId(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff member not found with ID: " + staffId));

        Staff updated = staffRepository.saveOrUpdateStaff(
                staffId,
                request.getName() != null ? request.getName() : existing.getName(),
                request.getRole() != null ? request.getRole() : existing.getRole(),
                request.getEmail() != null ? request.getEmail() : existing.getEmail(),
                request.getBranchId() != null ? request.getBranchId() : existing.getBranchId(),
                request.getActive() != null ? request.getActive() : existing.getActive()
        );

        return mapToDto(updated);
    }

    @Transactional
    public void deleteStaff(String staffId) {
        staffRepository.findByStaffId(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff member not found with ID: " + staffId));

        staffRepository.deleteStaffById(staffId);
    }

    @Transactional(readOnly = true)
    public List<StaffDto> getStaffByRole(String role) {
        return staffRepository.findByRole(role).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private StaffDto mapToDto(Staff staff) {
        String branchName = null;
        if (staff.getBranchId() != null && !staff.getBranchId().isBlank() && branchRepository != null) {
            branchName = branchRepository.findByBranchId(staff.getBranchId())
                    .map(Branch::getName)
                    .orElse(null);
        }
        return new StaffDto(
                staff.getStaffId(),
                staff.getName(),
                staff.getRole(),
                staff.getEmail(),
                staff.getBranchId(),
                branchName,
                staff.getActive()
        );
    }
}
