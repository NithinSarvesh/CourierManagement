package com.courier.service;

import com.courier.dto.BranchDto;
import com.courier.dto.ConnectedBranchDto;
import com.courier.dto.ParcelResponseDto;
import com.courier.exception.DuplicateResourceException;
import com.courier.exception.InvalidOperationException;
import com.courier.exception.ResourceNotFoundException;
import com.courier.model.Branch;
import com.courier.repository.BranchRepository;
import com.courier.repository.DeliveryAttemptRepository;
import com.courier.repository.ParcelRepository;
import com.courier.repository.TrackingEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BranchService {

    private final BranchRepository branchRepository;
    private final ParcelRepository parcelRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final DeliveryAttemptRepository deliveryAttemptRepository;

    public BranchService(BranchRepository branchRepository,
                         ParcelRepository parcelRepository,
                         TrackingEventRepository trackingEventRepository,
                         DeliveryAttemptRepository deliveryAttemptRepository) {
        this.branchRepository = branchRepository;
        this.parcelRepository = parcelRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.deliveryAttemptRepository = deliveryAttemptRepository;
    }

    @Transactional
    public BranchDto createBranch(BranchDto request) {
        String branchId = request.getBranchId();
        if (branchId == null || branchId.isBlank()) {
            branchId = "B" + String.format("%03d", branchRepository.count() + 1);
            while (branchRepository.findByBranchId(branchId).isPresent()) {
                branchId = "B" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            }
        } else {
            if (branchRepository.findByBranchId(branchId).isPresent()) {
                throw new DuplicateResourceException("Branch with ID '" + branchId + "' already exists");
            }
        }

        Branch saved = branchRepository.saveOrUpdateBranch(branchId, request.getName(), request.getCity());
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<BranchDto> getAllBranches() {
        return branchRepository.findAllBranches().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BranchDto getBranchById(String branchId) {
        Branch branch = branchRepository.findByBranchId(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + branchId));
        return mapToDto(branch);
    }

    @Transactional
    public BranchDto updateBranch(String branchId, BranchDto request) {
        Branch branch = branchRepository.findByBranchId(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + branchId));

        Branch updated = branchRepository.saveOrUpdateBranch(
                branchId,
                request.getName() != null ? request.getName() : branch.getName(),
                request.getCity() != null ? request.getCity() : branch.getCity()
        );
        return mapToDto(updated);
    }

    @Transactional
    public void deleteBranch(String branchId) {
        branchRepository.findByBranchId(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + branchId));

        long originating = branchRepository.countOriginatingParcels(branchId);
        if (originating > 0) {
            throw new InvalidOperationException("Cannot delete branch '" + branchId + "' because " + originating + " parcel(s) originate from here");
        }

        long destined = branchRepository.countDestinedParcels(branchId);
        if (destined > 0) {
            throw new InvalidOperationException("Cannot delete branch '" + branchId + "' because " + destined + " parcel(s) are destined for here");
        }

        branchRepository.deleteBranchById(branchId);
    }

    @Transactional(readOnly = true)
    public List<BranchDto> searchBranches(String query) {
        if (query == null || query.isBlank()) {
            return getAllBranches();
        }
        return branchRepository.searchBranches(query.trim()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ParcelResponseDto> getParcelsByBranch(String branchId, String type) {
        branchRepository.findByBranchId(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + branchId));

        String filterType = (type != null && !type.isBlank()) ? type.toLowerCase() : "all";
        List<ParcelResponseDto> parcels = parcelRepository.findParcelsByBranch(branchId, filterType).stream()
                .map(DtoMapper::mapToParcelResponse)
                .collect(Collectors.toList());
        DtoMapper.enrichParcels(parcels, trackingEventRepository, deliveryAttemptRepository);
        return parcels;
    }

    @Transactional(readOnly = true)
    public List<ConnectedBranchDto> getConnectedBranches(String branchId) {
        branchRepository.findByBranchId(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + branchId));

        List<Map<String, Object>> rows = branchRepository.findConnectedDestinations(branchId);
        return rows.stream().map(row -> new ConnectedBranchDto(
                (String) row.get("branchId"),
                (String) row.get("name"),
                (String) row.get("city"),
                ((Number) row.get("parcelCount")).longValue()
        )).collect(Collectors.toList());
    }

    private BranchDto mapToDto(Branch branch) {
        long originating = branchRepository.countOriginatingParcels(branch.getBranchId());
        long destined = branchRepository.countDestinedParcels(branch.getBranchId());
        return new BranchDto(branch.getBranchId(), branch.getName(), branch.getCity(), originating, destined);
    }
}
