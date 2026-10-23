# ==============================================================================
# SwiftShip Courier Management System - Backend Production Dockerfile
# Optimized for Koyeb / Container Platforms (Java 21, Spring Boot 3.3.5)
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

# Port configuration:
# Koyeb exposes port 8080 and passes $PORT dynamically to the container.
# Local runs outside container default to 8082 via application.properties.
ENV PORT=8080
ENV SERVER_PORT=8082
EXPOSE 8080

# Container Healthcheck targeting Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT:-8080}/actuator/health || exit 1

# Tuned JVM flags for memory-constrained instances (512 MB RAM on Koyeb Free / Eco):
# 1. Serial GC saves ~40-60 MB native memory overhead compared to G1GC.
# 2. MaxRAMPercentage=55.0 caps max heap at ~280 MB, leaving plenty of off-heap room.
# 3. MaxMetaspaceSize=128m prevents unbounded metaspace growth.
# 4. ExitOnOutOfMemoryError ensures immediate failover and clean restart.
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=55.0 -XX:InitialRAMPercentage=25.0 -XX:+UseSerialGC -XX:MaxMetaspaceSize=128m -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
