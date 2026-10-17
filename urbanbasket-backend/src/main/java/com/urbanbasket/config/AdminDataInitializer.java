package com.urbanbasket.config;

import com.urbanbasket.entity.*;
import com.urbanbasket.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final CartRepository cartRepository;
    private final AttendanceRepository attendanceRepository;
    private final ExpenseRepository expenseRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${urbanbasket.bootstrap.admin.email:admin@urbanbasket.com}")
    private String adminEmail;

    @Value("${urbanbasket.bootstrap.admin.password:Admin@123}")
    private String adminPassword;

    @Value("${urbanbasket.bootstrap.admin.fullName:System Administrator}")
    private String adminFullName;

    @Override
    public void run(String... args) {
        bootstrapAdminUser();
        bootstrapStaffAndAccountant();
        bootstrapSuppliers();
        bootstrapSupplierLogin();
        bootstrapProducts();
        bootstrapSampleExpenses();
        bootstrapSampleOrder();
    }

    private void bootstrapAdminUser() {
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .email(adminEmail.toLowerCase().trim())
                    .password(passwordEncoder.encode(adminPassword))
                    .fullName(adminFullName)
                    .phone("+1-800-URBAN-1")
                    .role(Role.ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info(">>> Initial Administrator created: {} (Role: ADMIN)", adminEmail);
        }
    }

    private void bootstrapStaffAndAccountant() {
        if (!userRepository.existsByEmail("staff@urbanbasket.com")) {
            User staff = User.builder()
                    .email("staff@urbanbasket.com")
                    .password(passwordEncoder.encode("Staff@123"))
                    .fullName("John Clark (Staff)")
                    .phone("+1-800-URBAN-2")
                    .role(Role.STAFF)
                    .active(true)
                    .build();
            staff = userRepository.save(staff);

            // Record sample attendance
            attendanceRepository.save(Attendance.builder()
                    .employee(staff)
                    .attendanceDate(LocalDate.now())
                    .checkIn(LocalTime.of(8, 30))
                    .checkOut(LocalTime.of(17, 30))
                    .status(AttendanceStatus.PRESENT)
                    .remarks("On time for morning shift")
                    .build());
        }

        if (!userRepository.existsByEmail("accountant@urbanbasket.com")) {
            User accountant = User.builder()
                    .email("accountant@urbanbasket.com")
                    .password(passwordEncoder.encode("Accountant@123"))
                    .fullName("Sarah Jenkins (CPA)")
                    .phone("+1-800-URBAN-3")
                    .role(Role.ACCOUNTANT)
                    .active(true)
                    .build();
            accountant = userRepository.save(accountant);

            // Record sample attendance
            attendanceRepository.save(Attendance.builder()
                    .employee(accountant)
                    .attendanceDate(LocalDate.now())
                    .checkIn(LocalTime.of(9, 0))
                    .checkOut(LocalTime.of(18, 0))
                    .status(AttendanceStatus.PRESENT)
                    .remarks("Standard shift")
                    .build());
        }

        if (!userRepository.existsByEmail("customer@urbanbasket.com")) {
            User customer = User.builder()
                    .email("customer@urbanbasket.com")
                    .password(passwordEncoder.encode("Customer@123"))
                    .fullName("Emma Watson")
                    .phone("+1-800-URBAN-4")
                    .role(Role.CUSTOMER)
                    .active(true)
                    .build();
            customer = userRepository.save(customer);

            cartRepository.save(Cart.builder()
                    .user(customer)
                    .build());
        }
    }

    private void bootstrapSuppliers() {
        if (supplierRepository.count() == 0) {
            Supplier s1 = Supplier.builder()
                    .name("GreenLeaf Farms Co.")
                    .contactPerson("Michael Green")
                    .email("supply@greenleaf.com")
                    .phone("+1-555-0192")
                    .address("12 Valley Road, Salinas, CA")
                    .active(true)
                    .build();

            Supplier s2 = Supplier.builder()
                    .name("PureDairy Organics")
                    .contactPerson("David Miller")
                    .email("orders@puredairy.com")
                    .phone("+1-555-0193")
                    .address("88 Pasture Way, Madison, WI")
                    .active(true)
                    .build();

            Supplier s3 = Supplier.builder()
                    .name("Sunrise Beverage Corp.")
                    .contactPerson("Linda Lopez")
                    .email("linda@sunrisebev.com")
                    .phone("+1-555-0194")
                    .address("300 Industrial Parkway, Atlanta, GA")
                    .active(true)
                    .build();

            supplierRepository.saveAll(List.of(s1, s2, s3));
        }
    }

    private void bootstrapSupplierLogin() {
        if (userRepository.existsByEmail("supplier@urbanbasket.com")) {
            return;
        }
        Supplier supplier = supplierRepository.findFirstByNameIgnoreCase("GreenLeaf Farms Co.").orElse(null);
        if (supplier == null || supplier.getUser() != null) {
            return;
        }
        User user = userRepository.save(User.builder()
                .email("supplier@urbanbasket.com")
                .password(passwordEncoder.encode("Supplier@123"))
                .fullName("Michael Green")
                .phone(supplier.getPhone())
                .role(Role.SUPPLIER)
                .active(true)
                .build());
        supplier.setUser(user);
        supplierRepository.save(supplier);
        log.info(">>> Supplier login created: supplier@urbanbasket.com");
    }

    private void bootstrapProducts() {
        if (productRepository.count() == 0) {
            List<Product> products = List.of(
                    // Category 1: Fruits & Vegetables
                    Product.builder()
                            .sku("FV-APL-001")
                            .name("Crisp Honeycrisp Apples")
                            .description("Freshly harvested organic Honeycrisp apples, sweet and juicy.")
                            .category("Fruits & Vegetables")
                            .purchasePrice(new BigDecimal("1.80"))
                            .sellingPrice(new BigDecimal("2.99"))
                            .stockQuantity(120)
                            .minimumStockLevel(20)
                            .imageUrl("https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .sku("FV-BAN-002")
                            .name("Organic Cavendish Bananas")
                            .description("Fair-trade ripe golden bananas rich in potassium.")
                            .category("Fruits & Vegetables")
                            .purchasePrice(new BigDecimal("0.70"))
                            .sellingPrice(new BigDecimal("1.29"))
                            .stockQuantity(150)
                            .minimumStockLevel(25)
                            .imageUrl("https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .sku("FV-SPN-003")
                            .name("Baby Spinach Leaves (Pack)")
                            .description("Tender and pre-washed organic baby spinach leaves.")
                            .category("Fruits & Vegetables")
                            .purchasePrice(new BigDecimal("1.50"))
                            .sellingPrice(new BigDecimal("2.49"))
                            .stockQuantity(8) // Low stock demo!
                            .minimumStockLevel(15)
                            .imageUrl("https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80")
                            .active(true)
                            .build(),

                    // Category 2: Dairy & Bakery
                    Product.builder()
                            .sku("DB-MLK-001")
                            .name("Whole Farm Fresh Milk (1 Gallon)")
                            .description("Pasteurized Grade A whole milk from pasture-raised cows.")
                            .category("Dairy & Bakery")
                            .purchasePrice(new BigDecimal("2.50"))
                            .sellingPrice(new BigDecimal("3.89"))
                            .stockQuantity(75)
                            .minimumStockLevel(15)
                            .imageUrl("https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .sku("DB-BRD-002")
                            .name("Artisan Sourdough Loaf")
                            .description("Slow-fermented artisan sourdough bread with crispy crust.")
                            .category("Dairy & Bakery")
                            .purchasePrice(new BigDecimal("2.20"))
                            .sellingPrice(new BigDecimal("4.49"))
                            .stockQuantity(40)
                            .minimumStockLevel(10)
                            .imageUrl("https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .sku("DB-CHK-003")
                            .name("Aged Cheddar Cheese Block (8oz)")
                            .description("Sharp cheddar aged 12 months for rich depth of flavor.")
                            .category("Dairy & Bakery")
                            .purchasePrice(new BigDecimal("3.10"))
                            .sellingPrice(new BigDecimal("5.29"))
                            .stockQuantity(6) // Low stock demo!
                            .minimumStockLevel(12)
                            .imageUrl("https://images.unsplash.com/photo-1618164436241-4473940d1f5c?auto=format&fit=crop&w=600&q=80")
                            .active(true)
                            .build(),

                    // Category 3: Beverages & Snacks
                    Product.builder()
                            .sku("BS-ORJ-001")
                            .name("Fresh Squeezed Orange Juice (52oz)")
                            .description("100% pure Florida orange juice with pulp.")
                            .category("Beverages & Snacks")
                            .purchasePrice(new BigDecimal("2.80"))
                            .sellingPrice(new BigDecimal("4.79"))
                            .stockQuantity(65)
                            .minimumStockLevel(15)
                            .imageUrl("https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .sku("BS-CHP-002")
                            .name("Sea Salt Kettle Cooked Potato Chips")
                            .description("Crispy thick-cut kettle chips with Mediterranean sea salt.")
                            .category("Beverages & Snacks")
                            .purchasePrice(new BigDecimal("1.40"))
                            .sellingPrice(new BigDecimal("2.99"))
                            .stockQuantity(90)
                            .minimumStockLevel(20)
                            .imageUrl("https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .sku("BS-GRN-003")
                            .name("Organic Japanese Green Tea (20 bags)")
                            .description("Premium Sencha green tea packed with antioxidants.")
                            .category("Beverages & Snacks")
                            .purchasePrice(new BigDecimal("2.90"))
                            .sellingPrice(new BigDecimal("4.99"))
                            .stockQuantity(55)
                            .minimumStockLevel(10)
                            .imageUrl("https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=600&q=80")
                            .active(true)
                            .build(),

                    // Category 4: Staples & Household
                    Product.builder()
                            .sku("SH-RIC-001")
                            .name("Royal Basmati Rice (10 lbs)")
                            .description("Aromatic extra long grain Himalayan basmati rice.")
                            .category("Staples & Household")
                            .purchasePrice(new BigDecimal("9.50"))
                            .sellingPrice(new BigDecimal("14.99"))
                            .stockQuantity(45)
                            .minimumStockLevel(10)
                            .imageUrl("https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .sku("SH-OIL-002")
                            .name("Extra Virgin Olive Oil (1 Liter)")
                            .description("Cold-pressed Greek extra virgin olive oil.")
                            .category("Staples & Household")
                            .purchasePrice(new BigDecimal("7.20"))
                            .sellingPrice(new BigDecimal("11.99"))
                            .stockQuantity(38)
                            .minimumStockLevel(8)
                            .imageUrl("https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80")
                            .active(true)
                            .build(),
                    Product.builder()
                            .sku("SH-DET-003")
                            .name("Eco-Friendly Laundry Detergent (64oz)")
                            .description("Plant-powered biodegradable concentrated liquid detergent.")
                            .category("Staples & Household")
                            .purchasePrice(new BigDecimal("6.00"))
                            .sellingPrice(new BigDecimal("9.99"))
                            .stockQuantity(50)
                            .minimumStockLevel(12)
                            .imageUrl("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80")
                            .active(true)
                            .build()
            );

            productRepository.saveAll(products);
            log.info(">>> Seeded {} products across 4 core supermarket categories.", products.size());
        }
    }

    private void bootstrapSampleExpenses() {
        if (expenseRepository.count() == 0) {
            User admin = userRepository.findByEmail(adminEmail).orElse(null);

            Expense e1 = Expense.builder()
                    .title("Supermarket Floor Electricity Bill")
                    .category("Utilities")
                    .amount(new BigDecimal("480.00"))
                    .expenseDate(LocalDate.now().minusDays(5))
                    .description("Commercial refrigeration and cooling energy bill")
                    .recordedBy(admin)
                    .build();

            Expense e2 = Expense.builder()
                    .title("Refrigeration Maintenance & Servicing")
                    .category("Maintenance")
                    .amount(new BigDecimal("250.00"))
                    .expenseDate(LocalDate.now().minusDays(10))
                    .description("Compressor filter maintenance for dairy chiller")
                    .recordedBy(admin)
                    .build();

            Expense e3 = Expense.builder()
                    .title("Store Facility Monthly Rent")
                    .category("Rent")
                    .amount(new BigDecimal("1800.00"))
                    .expenseDate(LocalDate.now().withDayOfMonth(1))
                    .description("Monthly commercial lease for retail store")
                    .recordedBy(admin)
                    .build();

            expenseRepository.saveAll(List.of(e1, e2, e3));
        }
    }

    private void bootstrapSampleOrder() {
        if (orderRepository.count() > 0) {
            return;
        }
        User customer = userRepository.findByEmail("customer@urbanbasket.com").orElse(null);
        Product apples = productRepository.findBySku("FV-APL-001").orElse(null);
        Product milk = productRepository.findBySku("DB-MLK-001").orElse(null);
        if (customer == null || apples == null || milk == null) {
            return;
        }

        BigDecimal appleSubtotal = apples.getSellingPrice().multiply(BigDecimal.valueOf(3));
        BigDecimal milkSubtotal = milk.getSellingPrice().multiply(BigDecimal.valueOf(2));

        Order order = Order.builder()
                .orderNumber("UB-DEMO-1001")
                .user(customer)
                .totalAmount(appleSubtotal.add(milkSubtotal))
                .paymentMethod("CASH_ON_DELIVERY")
                .status(OrderStatus.DELIVERED)
                .deliveryAddress("42 Market Street, Chennai")
                .contactPhone(customer.getPhone() != null ? customer.getPhone() : "9876543210")
                .notes("Welcome order")
                .build();
        order = orderRepository.save(order);

        OrderItem applesItem = OrderItem.builder()
                .order(order)
                .product(apples)
                .productName(apples.getName())
                .productSku(apples.getSku())
                .unitPrice(apples.getSellingPrice())
                .quantity(3)
                .subtotal(appleSubtotal)
                .build();
        OrderItem milkItem = OrderItem.builder()
                .order(order)
                .product(milk)
                .productName(milk.getName())
                .productSku(milk.getSku())
                .unitPrice(milk.getSellingPrice())
                .quantity(2)
                .subtotal(milkSubtotal)
                .build();
        order.getItems().add(applesItem);
        order.getItems().add(milkItem);
        orderRepository.save(order);

        apples.setStockQuantity(apples.getStockQuantity() - 3);
        milk.setStockQuantity(milk.getStockQuantity() - 2);
        productRepository.save(apples);
        productRepository.save(milk);
        log.info(">>> Seeded a delivered demo order for {}", customer.getEmail());
    }
}
