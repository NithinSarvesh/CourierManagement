package com.courier.controller;

import com.courier.service.DatabaseDemoService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sql")
public class SqlConsoleController {

    private final DatabaseDemoService databaseDemoService;

    public SqlConsoleController(DatabaseDemoService databaseDemoService) {
        this.databaseDemoService = databaseDemoService;
    }

    @PostMapping
    public Map<String, Object> executeSql(@RequestBody(required = false) Map<String, String> payload) {
        String sql = (payload != null && payload.containsKey("sql")) ? payload.get("sql") : "";
        return databaseDemoService.executeCustomSql(sql);
    }
}
