package com.urbanbasket.service;

import com.urbanbasket.dto.PurchaseItemRequest;
import com.urbanbasket.dto.PurchaseItemResponse;
import com.urbanbasket.dto.PurchaseRequest;
import com.urbanbasket.dto.PurchaseResponse;
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
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;

    @Transactional
    public PurchaseResponse createPurchase(PurchaseRequest request, String requesterEmail) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));
        if (supplier.getUser() == null || !supplier.getUser().isActive()) {
            throw new BadRequestException("Choose a supplier that has an active login.");
        }

        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requesterEmail));

        List<PurchaseItemRequest> requestedItems = request.getItems();
        List<Product> products = new ArrayList<>();
        for (PurchaseItemRequest itemReq : requestedItems) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));
            if (!product.isLowStock()) {
                throw new BadRequestException(product.getName() + " is not low on stock.");
            }
            products.add(product);
        }

        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String shortId = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String purchaseNumber = "PO-" + datePrefix + "-" + shortId;

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<PurchaseItem> purchaseItems = new ArrayList<>();

        Purchase purchase = Purchase.builder()
                .purchaseNumber(purchaseNumber)
                .supplier(supplier)
                .totalAmount(BigDecimal.ZERO)
                .notes(request.getNotes())
                .status(PurchaseStatus.REQUESTED)
                .requestedBy(requester)
                .build();

        purchase = purchaseRepository.save(purchase);

        for (int index = 0; index < requestedItems.size(); index++) {
            PurchaseItemRequest itemReq = requestedItems.get(index);
            Product product = products.get(index);
            BigDecimal subtotal = itemReq.getUnitCost().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            PurchaseItem item = PurchaseItem.builder()
                    .purchase(purchase)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitCost(itemReq.getUnitCost())
                    .subtotal(subtotal)
                    .build();

            purchaseItems.add(purchaseItemRepository.save(item));
        }

        purchase.setTotalAmount(totalAmount);
        purchase.setItems(purchaseItems);
        purchase = purchaseRepository.save(purchase);

        return mapToResponse(purchase);
    }

    @Transactional
    public PurchaseResponse deliver(Long id, String supplierEmail) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found with id: " + id));
        User supplierUser = purchase.getSupplier().getUser();
        if (supplierUser == null || !supplierUser.getEmail().equalsIgnoreCase(supplierEmail)) {
            throw new BadRequestException("You can only deliver requests sent to your company.");
        }
        if (purchase.getStatus() == PurchaseStatus.DELIVERED) {
            throw new BadRequestException("This request has already been delivered.");
        }

        for (PurchaseItem item : purchase.getItems()) {
            receiveStock(item.getProduct(), item.getQuantity(), item.getUnitCost(), purchase.getPurchaseNumber());
        }
        purchase.setStatus(PurchaseStatus.DELIVERED);
        purchase.setDeliveredAt(LocalDateTime.now());
        return mapToResponse(purchaseRepository.save(purchase));
    }

    @Transactional(readOnly = true)
    public List<PurchaseResponse> getMyRequests(String supplierEmail) {
        return purchaseRepository.findBySupplier_User_EmailOrderByPurchaseDateDesc(supplierEmail).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private void receiveStock(Product product, int quantity, BigDecimal unitCost, String reference) {
        int balanceAfter = product.getStockQuantity() + quantity;
        product.setStockQuantity(balanceAfter);
        product.setPurchasePrice(unitCost);
        productRepository.save(product);

        stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .movementType(StockMovement.MovementType.IN_PURCHASE)
                .quantity(quantity)
                .balanceAfter(balanceAfter)
                .reference(reference)
                .build());
    }

    @Transactional(readOnly = true)
    public Page<PurchaseResponse> getPurchases(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return purchaseRepository.findAllByOrderByPurchaseDateDesc(pageable)
                .map(this::mapToResponse);
    }

    public PurchaseResponse mapToResponse(Purchase purchase) {
        List<PurchaseItemResponse> itemResponses = purchase.getItems().stream()
                .map(item -> PurchaseItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .productSku(item.getProduct().getSku())
                        .quantity(item.getQuantity())
                        .unitCost(item.getUnitCost())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return PurchaseResponse.builder()
                .id(purchase.getId())
                .purchaseNumber(purchase.getPurchaseNumber())
                .supplierId(purchase.getSupplier().getId())
                .supplierName(purchase.getSupplier().getName())
                .purchaseDate(purchase.getPurchaseDate())
                .totalAmount(purchase.getTotalAmount())
                .notes(purchase.getNotes())
                .status(purchase.getStatus() == null ? PurchaseStatus.DELIVERED.name() : purchase.getStatus().name())
                .items(itemResponses)
                .build();
    }
}
