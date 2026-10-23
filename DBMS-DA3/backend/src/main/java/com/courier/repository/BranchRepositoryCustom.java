package com.courier.repository;

import java.util.List;
import java.util.Map;

public interface BranchRepositoryCustom {

    List<Map<String, Object>> findConnectedDestinations(String branchId);
}
