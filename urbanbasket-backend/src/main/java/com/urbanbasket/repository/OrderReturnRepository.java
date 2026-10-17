package com.urbanbasket.repository;

import com.urbanbasket.entity.Order;
import com.urbanbasket.entity.OrderReturn;
import com.urbanbasket.entity.ReturnStatus;
import com.urbanbasket.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderReturnRepository extends JpaRepository<OrderReturn, Long> {

    List<OrderReturn> findByOrder_UserOrderByRequestedAtDesc(User user);

    List<OrderReturn> findAllByOrderByRequestedAtDesc();

    boolean existsByOrderAndStatusIn(Order order, List<ReturnStatus> statuses);
}
