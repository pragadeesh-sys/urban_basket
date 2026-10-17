package com.urbanbasket.repository;

import com.urbanbasket.entity.Attendance;
import com.urbanbasket.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByEmployeeAndAttendanceDate(User employee, LocalDate attendanceDate);

    boolean existsByEmployeeAndAttendanceDate(User employee, LocalDate attendanceDate);

    boolean existsByEmployeeAndAttendanceDateAndIdNot(User employee, LocalDate attendanceDate, Long id);

    List<Attendance> findByEmployeeOrderByAttendanceDateDesc(User employee);

    void deleteByEmployee(User employee);

    Page<Attendance> findAllByOrderByAttendanceDateDesc(Pageable pageable);

    Page<Attendance> findByEmployeeOrderByAttendanceDateDesc(User employee, Pageable pageable);

    List<Attendance> findByAttendanceDateBetweenOrderByAttendanceDateDesc(LocalDate startDate, LocalDate endDate);
}
