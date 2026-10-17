package com.urbanbasket.repository;

import com.urbanbasket.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    @Query("SELECT oi.product.category, SUM(oi.subtotal) FROM OrderItem oi WHERE oi.order.status NOT IN (com.urbanbasket.entity.OrderStatus.CANCELLED, com.urbanbasket.entity.OrderStatus.RETURNED, com.urbanbasket.entity.OrderStatus.REFUNDED) GROUP BY oi.product.category")
    List<Object[]> sumSalesByCategory();

    @Query("SELECT oi.productName, SUM(oi.quantity), SUM(oi.subtotal) FROM OrderItem oi WHERE oi.order.status NOT IN (com.urbanbasket.entity.OrderStatus.CANCELLED, com.urbanbasket.entity.OrderStatus.RETURNED, com.urbanbasket.entity.OrderStatus.REFUNDED) GROUP BY oi.productName ORDER BY SUM(oi.subtotal) DESC")
    List<Object[]> findTopSellingProducts();
}
