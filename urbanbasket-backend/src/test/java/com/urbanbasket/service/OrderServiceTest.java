package com.urbanbasket.service;

import com.urbanbasket.dto.UpdateOrderStatusRequest;
import com.urbanbasket.entity.Order;
import com.urbanbasket.entity.OrderItem;
import com.urbanbasket.entity.OrderStatus;
import com.urbanbasket.entity.Product;
import com.urbanbasket.entity.StockMovement;
import com.urbanbasket.entity.User;
import com.urbanbasket.exception.BadRequestException;
import com.urbanbasket.repository.CartRepository;
import com.urbanbasket.repository.OrderItemRepository;
import com.urbanbasket.repository.OrderRepository;
import com.urbanbasket.repository.ProductRepository;
import com.urbanbasket.repository.StockMovementRepository;
import com.urbanbasket.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private CartRepository cartRepository;
    @Mock private ProductRepository productRepository;
    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private UserRepository userRepository;
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
                orderRepository,
                orderItemRepository,
                cartRepository,
                productRepository,
                stockMovementRepository,
                userRepository,
                null // these cases do not touch the cart
        );
    }

    @Test
    void customerCannotCancelAfterTheOrderShips() {
        Order order = order(OrderStatus.SHIPPED, 5, 1);
        when(orderRepository.findById(4L)).thenReturn(Optional.of(order));

        BadRequestException error = assertThrows(
                BadRequestException.class,
                () -> orderService.cancelCustomerOrder(4L, "customer@urbanbasket.com")
        );

        assertEquals("Orders can only be cancelled before they are shipped.", error.getMessage());
        assertEquals(5, order.getItems().get(0).getProduct().getStockQuantity());
        verify(orderRepository, never()).save(any());
        verify(stockMovementRepository, never()).save(any());
    }

    @Test
    void cancellingAPendingOrderRestoresStockOnce() {
        Order order = order(OrderStatus.PENDING, 5, 2);
        when(orderRepository.findById(4L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = orderService.cancelCustomerOrder(4L, "customer@urbanbasket.com");

        assertEquals(OrderStatus.CANCELLED, response.getStatus());
        assertEquals(7, order.getItems().get(0).getProduct().getStockQuantity());
        ArgumentCaptor<StockMovement> movement = ArgumentCaptor.forClass(StockMovement.class);
        verify(stockMovementRepository).save(movement.capture());
        assertEquals(StockMovement.MovementType.RETURN, movement.getValue().getMovementType());
        assertEquals(2, movement.getValue().getQuantity());
        assertEquals(7, movement.getValue().getBalanceAfter());
    }

    @Test
    void staffCannotSkipFromPendingToDelivered() {
        Order order = order(OrderStatus.PENDING, 5, 1);
        when(orderRepository.findById(4L)).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setStatus(OrderStatus.DELIVERED);
        assertThrows(BadRequestException.class, () -> orderService.updateOrderStatus(4L, request));
        verify(orderRepository, never()).save(any());
    }

    private Order order(OrderStatus status, int stock, int quantity) {
        Product product = Product.builder()
                .id(6L)
                .name("Aged Cheddar")
                .sku("DB-CHK-003")
                .stockQuantity(stock)
                .minimumStockLevel(12)
                .build();
        OrderItem item = OrderItem.builder()
                .id(1L)
                .product(product)
                .productName(product.getName())
                .productSku(product.getSku())
                .quantity(quantity)
                .unitPrice(new BigDecimal("5.29"))
                .subtotal(new BigDecimal("5.29"))
                .build();
        User customer = User.builder()
                .id(4L)
                .email("customer@urbanbasket.com")
                .fullName("Emma Watson")
                .password("hashed")
                .build();
        return Order.builder()
                .id(4L)
                .orderNumber("UB-TEST-0001")
                .user(customer)
                .status(status)
                .totalAmount(new BigDecimal("5.29"))
                .deliveryAddress("12 Market Street")
                .contactPhone("+1-800-URBAN-4")
                .items(List.of(item))
                .build();
    }
}
