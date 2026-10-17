package com.urbanbasket.repository;

import com.urbanbasket.entity.Expense;
import com.urbanbasket.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    Page<Expense> findAllByOrderByExpenseDateDesc(Pageable pageable);

    @Modifying
    @Query("UPDATE Expense e SET e.recordedBy = null WHERE e.recordedBy = :user")
    void clearRecordedBy(@Param("user") User user);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.expenseDate >= :startDate AND e.expenseDate <= :endDate")
    BigDecimal sumExpensesBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT e.category, SUM(e.amount) FROM Expense e WHERE e.expenseDate >= :startDate AND e.expenseDate <= :endDate GROUP BY e.category")
    List<Object[]> sumExpensesByCategoryBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT e FROM Expense e WHERE e.expenseDate >= :startDate AND e.expenseDate <= :endDate ORDER BY e.expenseDate DESC")
    List<Expense> findExpensesBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
