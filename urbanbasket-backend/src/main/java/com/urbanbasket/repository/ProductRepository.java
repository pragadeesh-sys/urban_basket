package com.urbanbasket.repository;

import com.urbanbasket.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, Long id);

    List<Product> findByCategoryAndActiveTrue(String category);

    @Query("SELECT p FROM Product p WHERE " +
           "(:category = '' OR LOWER(p.category) = LOWER(:category)) AND " +
           "(:search = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:activeOnly = false OR p.active = true)")
    Page<Product> searchProducts(@Param("category") String category,
                                 @Param("search") String search,
                                 @Param("activeOnly") boolean activeOnly,
                                 Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.stockQuantity <= p.minimumStockLevel AND p.active = true")
    List<Product> findLowStockProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.stockQuantity <= p.minimumStockLevel AND p.active = true")
    long countLowStockProducts();

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.active = true")
    List<String> findDistinctCategories();
}
