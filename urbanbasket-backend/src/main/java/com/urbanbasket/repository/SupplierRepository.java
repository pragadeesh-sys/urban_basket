package com.urbanbasket.repository;

import com.urbanbasket.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.urbanbasket.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    List<Supplier> findByActiveTrueOrderByNameAsc();

    Optional<Supplier> findByUser(User user);

    Optional<Supplier> findFirstByNameIgnoreCase(String name);
}
