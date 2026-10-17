package com.urbanbasket.service;

import com.urbanbasket.dto.AddToCartRequest;
import com.urbanbasket.dto.CartDto;
import com.urbanbasket.dto.CartItemDto;
import com.urbanbasket.dto.UpdateCartItemRequest;
import com.urbanbasket.entity.Cart;
import com.urbanbasket.entity.CartItem;
import com.urbanbasket.entity.Product;
import com.urbanbasket.entity.User;
import com.urbanbasket.exception.BadRequestException;
import com.urbanbasket.exception.ResourceNotFoundException;
import com.urbanbasket.repository.CartItemRepository;
import com.urbanbasket.repository.CartRepository;
import com.urbanbasket.repository.ProductRepository;
import com.urbanbasket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public Cart getOrCreateCart(User user) {
        return cartRepository.findByUser(user)
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));
    }

    @Transactional(readOnly = true)
    public CartDto getCustomerCart(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));
        Cart cart = getOrCreateCart(user);
        return mapToDto(cart);
    }

    @Transactional
    public CartDto addItemToCart(String userEmail, AddToCartRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (!product.isActive()) {
            throw new BadRequestException("Product is currently unavailable: " + product.getName());
        }

        if (product.getStockQuantity() < request.getQuantity()) {
            throw new BadRequestException("Requested quantity (" + request.getQuantity() + ") exceeds available stock (" + product.getStockQuantity() + ")");
        }

        Cart cart = getOrCreateCart(user);

        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(product.getId()))
                .findFirst()
                .orElse(null);

        if (existingItem != null) {
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            if (newQuantity > product.getStockQuantity()) {
                throw new BadRequestException("Total requested in cart (" + newQuantity + ") exceeds available stock (" + product.getStockQuantity() + ")");
            }
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        return mapToDto(cart);
    }

    @Transactional
    public CartDto updateItemQuantity(String userEmail, Long itemId, UpdateCartItemRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));
        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("You do not own this cart item.");
        }

        if (request.getQuantity() > item.getProduct().getStockQuantity()) {
            throw new BadRequestException("Requested quantity exceeds available stock (" + item.getProduct().getStockQuantity() + ")");
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        return mapToDto(cart);
    }

    @Transactional
    public CartDto removeItem(String userEmail, Long itemId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));
        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("You do not own this cart item.");
        }

        cart.getItems().remove(item);
        cartItemRepository.delete(item);

        return mapToDto(cart);
    }

    @Transactional
    public void clearCart(Cart cart) {
        cart.getItems().clear();
        cartItemRepository.deleteByCart(cart);
    }

    public CartDto mapToDto(Cart cart) {
        List<CartItemDto> itemDtos = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        int totalItems = 0;

        for (CartItem item : cart.getItems()) {
            BigDecimal subtotal = item.getProduct().getSellingPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            totalAmount = totalAmount.add(subtotal);
            totalItems += item.getQuantity();

            itemDtos.add(CartItemDto.builder()
                    .id(item.getId())
                    .productId(item.getProduct().getId())
                    .productName(item.getProduct().getName())
                    .productSku(item.getProduct().getSku())
                    .productCategory(item.getProduct().getCategory())
                    .productImageUrl(item.getProduct().getImageUrl())
                    .unitPrice(item.getProduct().getSellingPrice())
                    .quantity(item.getQuantity())
                    .availableStock(item.getProduct().getStockQuantity())
                    .subtotal(subtotal)
                    .build());
        }

        return CartDto.builder()
                .id(cart.getId())
                .userId(cart.getUser().getId())
                .items(itemDtos)
                .totalItems(totalItems)
                .totalAmount(totalAmount)
                .build();
    }
}
