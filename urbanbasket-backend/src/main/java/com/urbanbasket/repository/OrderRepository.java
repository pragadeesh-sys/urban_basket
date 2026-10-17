package com.urbanbasket.repository;

import com.urbanbasket.entity.Order;
import com.urbanbasket.entity.OrderStatus;
import com.urbanbasket.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserOrderByOrderDateDesc(User user);

    boolean existsByUser(User user);

    Page<Order> findByUserOrderByOrderDateDesc(User user, Pageable pageable);

    Page<Order> findAllByOrderByOrderDateDesc(Pageable pageable);

    Optional<Order> findByOrderNumber(String orderNumber);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status NOT IN (com.urbanbasket.entity.OrderStatus.CANCELLED, com.urbanbasket.entity.OrderStatus.RETURNED, com.urbanbasket.entity.OrderStatus.REFUNDED) AND o.orderDate >= :startDate AND o.orderDate <= :endDate")
    BigDecimal sumTotalSalesBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status NOT IN (com.urbanbasket.entity.OrderStatus.CANCELLED, com.urbanbasket.entity.OrderStatus.RETURNED, com.urbanbasket.entity.OrderStatus.REFUNDED) AND o.orderDate >= :startDate AND o.orderDate <= :endDate")
    long countOrdersBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status")
    long countByStatus(@Param("status") OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.orderDate >= :startDate AND o.orderDate <= :endDate ORDER BY o.orderDate DESC")
    List<Order> findOrdersBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
