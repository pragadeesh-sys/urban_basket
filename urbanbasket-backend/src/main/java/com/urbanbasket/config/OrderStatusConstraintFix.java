package com.urbanbasket.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Hibernate ddl-auto=update does not widen an existing PostgreSQL check
 * constraint, so later statuses such as RETURNED and REFUNDED would be rejected.
 */
@Component
@Order(0)
@RequiredArgsConstructor
@Slf4j
public class OrderStatusConstraintFix implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
        jdbcTemplate.execute("""
                ALTER TABLE orders ADD CONSTRAINT orders_status_check
                CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'))
                """);
        jdbcTemplate.execute("ALTER TABLE order_returns DROP CONSTRAINT IF EXISTS order_returns_status_check");
        jdbcTemplate.execute("""
                ALTER TABLE order_returns ADD CONSTRAINT order_returns_status_check
                CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED'))
                """);
        jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
        jdbcTemplate.execute("""
                ALTER TABLE users ADD CONSTRAINT users_role_check
                CHECK (role IN ('CUSTOMER', 'ADMIN', 'STAFF', 'ACCOUNTANT', 'SUPPLIER'))
                """);
        jdbcTemplate.execute("UPDATE purchases SET status = 'DELIVERED' WHERE status IS NULL");
        jdbcTemplate.execute("ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_status_check");
        jdbcTemplate.execute("""
                ALTER TABLE purchases ADD CONSTRAINT purchases_status_check
                CHECK (status IS NULL OR status IN ('REQUESTED', 'DELIVERED'))
                """);
        log.info("Role and purchase status checks include SUPPLIER and DELIVERED");
    }
}
