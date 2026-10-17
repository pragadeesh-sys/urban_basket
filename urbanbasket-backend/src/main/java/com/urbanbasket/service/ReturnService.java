package com.urbanbasket.service;

import com.urbanbasket.dto.CreateReturnRequest;
import com.urbanbasket.dto.ReturnResponse;
import com.urbanbasket.entity.Order;
import com.urbanbasket.entity.OrderReturn;
import com.urbanbasket.entity.OrderStatus;
import com.urbanbasket.entity.ReturnStatus;
import com.urbanbasket.entity.User;
import com.urbanbasket.exception.BadRequestException;
import com.urbanbasket.exception.ResourceNotFoundException;
import com.urbanbasket.repository.OrderRepository;
import com.urbanbasket.repository.OrderReturnRepository;
import com.urbanbasket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReturnService {

    private final OrderReturnRepository orderReturnRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;

    @Transactional
    public ReturnResponse requestReturn(String userEmail, CreateReturnRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You can only return your own orders.");
        }
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException("Only delivered orders can be returned.");
        }
        if (orderReturnRepository.existsByOrderAndStatusIn(order, List.of(ReturnStatus.REQUESTED, ReturnStatus.APPROVED, ReturnStatus.REFUNDED))) {
            throw new BadRequestException("A return is already open for this order.");
        }

        OrderReturn orderReturn = OrderReturn.builder()
                .order(order)
                .reason(request.getReason().trim())
                .status(ReturnStatus.REQUESTED)
                .build();
        return map(orderReturnRepository.save(orderReturn));
    }

    @Transactional(readOnly = true)
    public List<ReturnResponse> getMyReturns(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));
        return orderReturnRepository.findByOrder_UserOrderByRequestedAtDesc(user).stream()
                .map(this::map)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReturnResponse> getAllReturns() {
        return orderReturnRepository.findAllByOrderByRequestedAtDesc().stream()
                .map(this::map)
                .toList();
    }

    @Transactional
    public ReturnResponse approve(Long id) {
        OrderReturn orderReturn = findOpen(id);
        orderService.markReturned(orderReturn.getOrder());
        orderReturn.setStatus(ReturnStatus.APPROVED);
        orderReturn.setResolvedAt(LocalDateTime.now());
        return map(orderReturnRepository.save(orderReturn));
    }

    @Transactional
    public ReturnResponse refund(Long id) {
        OrderReturn orderReturn = orderReturnRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Return not found with id: " + id));
        if (orderReturn.getStatus() != ReturnStatus.APPROVED) {
            throw new BadRequestException("Refund the customer only after the return is approved.");
        }
        orderService.markRefunded(orderReturn.getOrder());
        orderReturn.setStatus(ReturnStatus.REFUNDED);
        orderReturn.setRefundedAt(LocalDateTime.now());
        return map(orderReturnRepository.save(orderReturn));
    }

    @Transactional
    public ReturnResponse reject(Long id) {
        OrderReturn orderReturn = findOpen(id);
        orderReturn.setStatus(ReturnStatus.REJECTED);
        orderReturn.setResolvedAt(LocalDateTime.now());
        return map(orderReturnRepository.save(orderReturn));
    }

    private OrderReturn findOpen(Long id) {
        OrderReturn orderReturn = orderReturnRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Return not found with id: " + id));
        if (orderReturn.getStatus() != ReturnStatus.REQUESTED) {
            throw new BadRequestException("This return has already been resolved.");
        }
        return orderReturn;
    }

    private ReturnResponse map(OrderReturn orderReturn) {
        Order order = orderReturn.getOrder();
        return ReturnResponse.builder()
                .id(orderReturn.getId())
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerName(order.getUser().getFullName())
                .customerEmail(order.getUser().getEmail())
                .totalAmount(order.getTotalAmount())
                .reason(orderReturn.getReason())
                .status(orderReturn.getStatus())
                .requestedAt(orderReturn.getRequestedAt())
                .resolvedAt(orderReturn.getResolvedAt())
                .refundedAt(orderReturn.getRefundedAt())
                .build();
    }
}
