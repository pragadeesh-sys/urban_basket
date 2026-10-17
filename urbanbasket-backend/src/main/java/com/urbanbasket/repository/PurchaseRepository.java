package com.urbanbasket.repository;

import com.urbanbasket.entity.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    Page<Purchase> findAllByOrderByPurchaseDateDesc(Pageable pageable);

    List<Purchase> findBySupplier_User_EmailOrderByPurchaseDateDesc(String email);

    long countBySupplierId(Long supplierId);

    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Purchase p WHERE (p.status IS NULL OR p.status = com.urbanbasket.entity.PurchaseStatus.DELIVERED) AND p.purchaseDate >= :startDate AND p.purchaseDate <= :endDate")
    BigDecimal sumTotalPurchasesBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT p FROM Purchase p WHERE p.purchaseDate >= :startDate AND p.purchaseDate <= :endDate ORDER BY p.purchaseDate DESC")
    List<Purchase> findPurchasesBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
