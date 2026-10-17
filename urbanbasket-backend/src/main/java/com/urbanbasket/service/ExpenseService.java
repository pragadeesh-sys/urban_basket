package com.urbanbasket.service;

import com.urbanbasket.dto.ExpenseRequest;
import com.urbanbasket.dto.ExpenseResponse;
import com.urbanbasket.entity.Expense;
import com.urbanbasket.entity.User;
import com.urbanbasket.exception.ResourceNotFoundException;
import com.urbanbasket.repository.ExpenseRepository;
import com.urbanbasket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<ExpenseResponse> getExpenses(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return expenseRepository.findAllByOrderByExpenseDateDesc(pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public ExpenseResponse recordExpense(String recordedByEmail, ExpenseRequest request) {
        User recordedBy = userRepository.findByEmail(recordedByEmail)
                .orElse(null);

        Expense expense = Expense.builder()
                .title(request.getTitle().trim())
                .category(request.getCategory().trim())
                .amount(request.getAmount())
                .expenseDate(request.getExpenseDate())
                .description(request.getDescription())
                .recordedBy(recordedBy)
                .build();

        expense = expenseRepository.save(expense);
        return mapToResponse(expense);
    }

    @Transactional
    public ExpenseResponse updateExpense(Long id, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
        expense.setTitle(request.getTitle().trim());
        expense.setCategory(request.getCategory().trim());
        expense.setAmount(request.getAmount());
        expense.setExpenseDate(request.getExpenseDate());
        expense.setDescription(request.getDescription());
        return mapToResponse(expenseRepository.save(expense));
    }

    @Transactional
    public void deleteExpense(Long id) {
        if (!expenseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Expense not found with id: " + id);
        }
        expenseRepository.deleteById(id);
    }

    public ExpenseResponse mapToResponse(Expense expense) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .title(expense.getTitle())
                .category(expense.getCategory())
                .amount(expense.getAmount())
                .expenseDate(expense.getExpenseDate())
                .description(expense.getDescription())
                .recordedByName(expense.getRecordedBy() != null ? expense.getRecordedBy().getFullName() : "System")
                .createdAt(expense.getCreatedAt())
                .build();
    }
}
