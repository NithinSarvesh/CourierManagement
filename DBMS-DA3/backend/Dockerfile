# ==============================================================================
# SwiftShip Courier Management System - Backend Production Dockerfile
# Multi-stage build with Eclipse Temurin JDK 21 (builder) and JRE 21 (runtime)
# ==============================================================================

# Stage 1: Build application JAR using Maven Wrapper
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /workspace

# Copy Maven Wrapper and POM first to leverage Docker layer caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Normalize line endings from Windows CRLF to Linux LF and set executable permission
RUN sed -i 's/\r$//' ./mvnw && chmod +x ./mvnw

# Pre-fetch project dependencies offline
RUN ./mvnw dependency:go-offline -B || true

# Copy source code and build production JAR
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# ==============================================================================
# Stage 2: Minimal Production Runtime
# ==============================================================================
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Install curl for container health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Run as dedicated unprivileged user for security
RUN groupadd -r courier && useradd -r -g courier -m -d /home/courier courier

# Copy packaged JAR from builder stage
COPY --from=builder /workspace/target/courier-management-system-1.0.0.jar app.jar
RUN chown -R courier:courier /app

USER courier

# Default port configuration (Render overrides with dynamic $PORT, local runs default to 8082)
ENV PORT=8082
ENV SERVER_PORT=8082
EXPOSE 8082

# Container Healthcheck targeting Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT:-8082}/actuator/health || exit 1

# Start Spring Boot application with container-aware memory allocation
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
