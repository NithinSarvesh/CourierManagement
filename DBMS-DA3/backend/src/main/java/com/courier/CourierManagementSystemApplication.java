package com.courier;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.neo4j.repository.config.EnableNeo4jRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableNeo4jRepositories(basePackages = "com.courier.repository")
@EnableTransactionManagement
public class CourierManagementSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(CourierManagementSystemApplication.class, args);
    }
}
