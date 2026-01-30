
package com.hogicar.service;

import com.hogicar.dto.BookingRequest;
import com.hogicar.model.Booking;
import com.hogicar.repository.BookingRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;
import java.util.Random;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;

    public BookingService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    public Booking createBooking(BookingRequest request) {
        Booking booking = new Booking();
        // Map request to entity
        booking.setSupplierId(request.getSupplierId());
        booking.setSupplierName(request.getSupplierName());
        booking.setPickupCode(request.getPickupCode());
        booking.setDropoffCode(request.getDropoffCode());
        booking.setPickupDate(request.getPickupDate());
        booking.setDropoffDate(request.getDropoffDate());
        booking.setCurrency(request.getCurrency());
        booking.setNetPrice(request.getNetPrice());
        booking.setCommissionPercent(request.getCommissionPercent());
        booking.setFirstName(request.getFirstName());
        booking.setLastName(request.getLastName());
        booking.setEmail(request.getEmail());
        booking.setPhone(request.getPhone());
        booking.setStatus("confirmed"); // Default status

        // Generate booking reference
        String bookingRef = "H" + (100000 + new Random().nextInt(900000));
        booking.setBookingRef(bookingRef);

        // Calculate financial fields
        BigDecimal netPrice = request.getNetPrice() != null ? request.getNetPrice() : BigDecimal.ZERO;
        double commissionPercent = request.getCommissionPercent() != null ? request.getCommissionPercent() : 0.0;

        BigDecimal commissionMultiplier = BigDecimal.valueOf(1 + (commissionPercent / 100));
        BigDecimal finalPrice = netPrice.multiply(commissionMultiplier).setScale(2, RoundingMode.HALF_UP);
        BigDecimal payNow = finalPrice.subtract(netPrice); // This is the commission
        BigDecimal payAtDesk = netPrice;

        booking.setFinalPrice(finalPrice);
        booking.setPayNow(payNow);
        booking.setPayAtDesk(payAtDesk);

        return bookingRepository.save(booking);
    }

    public Optional<Booking> getBookingById(Long id) {
        return bookingRepository.findById(id);
    }

    public Optional<Booking> getBookingByRef(String bookingRef) {
        return bookingRepository.findByBookingRef(bookingRef);
    }
}
