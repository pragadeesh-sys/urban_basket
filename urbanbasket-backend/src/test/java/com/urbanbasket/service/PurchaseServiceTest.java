package com.urbanbasket.service;

import com.urbanbasket.dto.PurchaseItemRequest;
import com.urbanbasket.dto.PurchaseRequest;
import com.urbanbasket.entity.Product;
import com.urbanbasket.entity.Purchase;
import com.urbanbasket.entity.PurchaseItem;
import com.urbanbasket.entity.PurchaseStatus;
import com.urbanbasket.entity.StockMovement;
import com.urbanbasket.entity.Supplier;
import com.urbanbasket.entity.User;
import com.urbanbasket.exception.BadRequestException;
import com.urbanbasket.repository.ProductRepository;
import com.urbanbasket.repository.PurchaseItemRepository;
import com.urbanbasket.repository.PurchaseRepository;
import com.urbanbasket.repository.StockMovementRepository;
import com.urbanbasket.repository.SupplierRepository;
import com.urbanbasket.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PurchaseServiceTest {

    @Mock private PurchaseRepository purchaseRepository;
    @Mock private PurchaseItemRepository purchaseItemRepository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private ProductRepository productRepository;
    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private PurchaseService purchaseService;

    @Test
    void requestDoesNotChangeStockAndRejectsAProductThatIsNotLow() {
        Product cheddar = product(6L, "Aged Cheddar", 40, 12);
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplier("supplier@urbanbasket.com")));
        when(userRepository.findByEmail("staff@urbanbasket.com")).thenReturn(Optional.of(staff()));
        when(productRepository.findById(6L)).thenReturn(Optional.of(cheddar));

        assertThrows(BadRequestException.class, () -> purchaseService.createPurchase(request(), "staff@urbanbasket.com"));

        assertEquals(40, cheddar.getStockQuantity());
        verify(productRepository, never()).save(any());
        verify(purchaseRepository, never()).save(any());
        verify(stockMovementRepository, never()).save(any());
    }

    @Test
    void deliveryAddsStockOnceAndASecondDeliveryIsRejected() {
        Product cheddar = product(6L, "Aged Cheddar", 5, 12);
        Purchase purchase = Purchase.builder()
                .id(9L)
                .purchaseNumber("PO-TEST-0001")
                .supplier(supplier("supplier@urbanbasket.com"))
                .totalAmount(new BigDecimal("3.10"))
                .status(PurchaseStatus.REQUESTED)
                .items(new ArrayList<>(List.of(PurchaseItem.builder()
                        .product(cheddar)
                        .quantity(1)
                        .unitCost(new BigDecimal("3.10"))
                        .subtotal(new BigDecimal("3.10"))
                        .build())))
                .build();
        when(purchaseRepository.findById(9L)).thenReturn(Optional.of(purchase));
        when(purchaseRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var delivered = purchaseService.deliver(9L, "supplier@urbanbasket.com");

        assertEquals(PurchaseStatus.DELIVERED.name(), delivered.getStatus());
        assertEquals(6, cheddar.getStockQuantity());
        ArgumentCaptor<StockMovement> movement = ArgumentCaptor.forClass(StockMovement.class);
        verify(stockMovementRepository).save(movement.capture());
        assertEquals(StockMovement.MovementType.IN_PURCHASE, movement.getValue().getMovementType());

        assertThrows(BadRequestException.class, () -> purchaseService.deliver(9L, "supplier@urbanbasket.com"));
        assertEquals(6, cheddar.getStockQuantity());
    }

    private PurchaseRequest request() {
        PurchaseItemRequest item = new PurchaseItemRequest();
        item.setProductId(6L);
        item.setQuantity(1);
        item.setUnitCost(new BigDecimal("3.10"));
        PurchaseRequest request = new PurchaseRequest();
        request.setSupplierId(1L);
        request.setItems(List.of(item));
        return request;
    }

    private Product product(Long id, String name, int stock, int minimum) {
        return Product.builder()
                .id(id)
                .name(name)
                .sku("SKU-" + id)
                .stockQuantity(stock)
                .minimumStockLevel(minimum)
                .build();
    }

    private User staff() {
        return User.builder().id(2L).email("staff@urbanbasket.com").fullName("John Clark").password("hashed").build();
    }

    private Supplier supplier(String email) {
        User login = User.builder().id(8L).email(email).fullName("Michael Green").password("hashed").active(true).build();
        return Supplier.builder().id(1L).name("GreenLeaf Farms Co.").user(login).build();
    }
}
