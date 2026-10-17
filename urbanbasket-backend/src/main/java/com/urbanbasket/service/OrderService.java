package com.urbanbasket.service;

import com.urbanbasket.dto.*;
import com.urbanbasket.entity.*;
import com.urbanbasket.exception.BadRequestException;
import com.urbanbasket.exception.ResourceNotFoundException;
import com.urbanbasket.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;
    private final CartService cartService;

    @Transactional
    public OrderResponse createOrder(String userEmail, CreateOrderRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Cart cart = cartService.getOrCreateCart(user);

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cannot checkout with an empty cart.");
        }

        // Validate stock for all items
        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            if (!product.isActive()) {
                throw new BadRequestException("Product '" + product.getName() + "' is no longer active.");
            }
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new BadRequestException("Insufficient stock for '" + product.getName() +
                        "'. Requested: " + item.getQuantity() + ", Available: " + product.getStockQuantity());
            }
        }

        // Generate human-friendly unique order number: UB-YYYYMMDD-UUID4
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String shortId = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String orderNumber = "UB-" + datePrefix + "-" + shortId;

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
                .totalAmount(BigDecimal.ZERO)
                .paymentMethod("CASH_ON_DELIVERY")
                .status(OrderStatus.PENDING)
                .deliveryAddress(request.getDeliveryAddress().trim())
                .contactPhone(request.getContactPhone().trim())
                .notes(request.getNotes())
                .build();

        order = orderRepository.save(order);

        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            BigDecimal subtotal = product.getSellingPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            // Deduct stock
            int balanceAfter = product.getStockQuantity() - item.getQuantity();
            product.setStockQuantity(balanceAfter);
            productRepository.save(product);

            // Record stock movement
            StockMovement movement = StockMovement.builder()
                    .product(product)
                    .movementType(StockMovement.MovementType.OUT_SALE)
                    .quantity(item.getQuantity())
                    .balanceAfter(balanceAfter)
                    .reference(orderNumber)
                    .build();
            stockMovementRepository.save(movement);

            // Create Order Item
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productName(product.getName())
                    .productSku(product.getSku())
                    .unitPrice(product.getSellingPrice())
                    .quantity(item.getQuantity())
                    .subtotal(subtotal)
                    .build();

            orderItems.add(orderItemRepository.save(orderItem));
        }

        order.setTotalAmount(totalAmount);
        order.setItems(orderItems);
        order = orderRepository.save(order);

        // Empty customer cart
        cartService.clearCart(cart);

        return mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getCustomerOrders(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));
        return orderRepository.findByUserOrderByOrderDateDesc(user).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return orderRepository.findAllByOrderByOrderDateDesc(pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id, String currentUserEmail, boolean isAdminOrStaff) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        if (!isAdminOrStaff && !order.getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new BadRequestException("You do not have permission to view this order.");
        }

        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        OrderStatus currentStatus = order.getStatus();
        OrderStatus newStatus = request.getStatus();

        if (currentStatus == OrderStatus.CANCELLED || currentStatus == OrderStatus.RETURNED || currentStatus == OrderStatus.REFUNDED) {
            throw new BadRequestException("This order can no longer be changed.");
        }

        if (!isAllowedTransition(currentStatus, newStatus)) {
            throw new BadRequestException("Cannot move an order from " + currentStatus + " to " + newStatus + ".");
        }

        if (newStatus == OrderStatus.CANCELLED) {
            restoreStockForOrder(order, "CANCEL-");
        }

        order.setStatus(newStatus);
        order = orderRepository.save(order);
        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse cancelCustomerOrder(Long id, String userEmail) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        if (!order.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("You do not have permission to cancel this order.");
        }

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BadRequestException("Orders can only be cancelled before they are shipped.");
        }

        restoreStockForOrder(order, "CANCEL-");
        order.setStatus(OrderStatus.CANCELLED);
        order = orderRepository.save(order);
        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse markReturned(Order order) {
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException("Only delivered orders can be returned.");
        }
        restoreStockForOrder(order, "RETURN-");
        order.setStatus(OrderStatus.RETURNED);
        return mapToResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse markRefunded(Order order) {
        if (order.getStatus() != OrderStatus.RETURNED) {
            throw new BadRequestException("Refund the customer only after the return is approved.");
        }
        order.setStatus(OrderStatus.REFUNDED);
        return mapToResponse(orderRepository.save(order));
    }

    private boolean isAllowedTransition(OrderStatus current, OrderStatus next) {
        if (current == next) {
            return true;
        }
        return switch (current) {
            case PENDING -> next == OrderStatus.CONFIRMED || next == OrderStatus.CANCELLED;
            case CONFIRMED -> next == OrderStatus.SHIPPED || next == OrderStatus.CANCELLED;
            case SHIPPED -> next == OrderStatus.DELIVERED;
            default -> false;
        };
    }

    private void restoreStockForOrder(Order order, String referencePrefix) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product == null) {
                continue;
            }
            int balanceAfter = product.getStockQuantity() + item.getQuantity();
            product.setStockQuantity(balanceAfter);
            productRepository.save(product);

            StockMovement movement = StockMovement.builder()
                    .product(product)
                    .movementType(StockMovement.MovementType.RETURN)
                    .quantity(item.getQuantity())
                    .balanceAfter(balanceAfter)
                    .reference(referencePrefix + order.getOrderNumber())
                    .build();
            stockMovementRepository.save(movement);
        }
    }

    public OrderResponse mapToResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .productSku(item.getProductSku())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerId(order.getUser().getId())
                .customerName(order.getUser().getFullName())
                .customerEmail(order.getUser().getEmail())
                .orderDate(order.getOrderDate())
                .totalAmount(order.getTotalAmount())
                .paymentMethod(order.getPaymentMethod())
                .status(order.getStatus())
                .deliveryAddress(order.getDeliveryAddress())
                .contactPhone(order.getContactPhone())
                .notes(order.getNotes())
                .items(itemResponses)
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
