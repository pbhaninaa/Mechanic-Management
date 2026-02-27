package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.models.ApiResponse;
import com.test.app.TestAppBackEnd.entities.CarWashBooking;
import com.test.app.TestAppBackEnd.services.CarWashBookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carwash-bookings")
public class CarWashController {

    @Autowired
    private CarWashBookingService bookingService;

    // Create booking
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<CarWashBooking>> createBooking(@RequestBody CarWashBooking booking) {
        CarWashBooking saved = bookingService.createBooking(booking);
        return ResponseEntity.ok(new ApiResponse<>("Booking created successfully", HttpStatus.OK.value(), saved));
    }

    // Get all bookings
    @GetMapping
    public ResponseEntity<ApiResponse<List<CarWashBooking>>> getAllBookings(@RequestParam(required = false) String search) {
        List<CarWashBooking> bookings = bookingService.getAllBookings(search);
        return ResponseEntity.ok(new ApiResponse<>("Fetched all bookings", HttpStatus.OK.value(), bookings));
    }

    // Get bookings by client
    @GetMapping("/client/{username}")
    public ResponseEntity<ApiResponse<List<CarWashBooking>>> getBookingsByClient(
            @PathVariable String username,
            @RequestParam(required = false) String search) {
        List<CarWashBooking> bookings = bookingService.getBookingsByClient(username, search);
        return ResponseEntity.ok(new ApiResponse<>("Fetched bookings for client: " + username, HttpStatus.OK.value(), bookings));
    }

    // Get bookings by car wash provider (for Manage Washes)
    @GetMapping("/carwash/{carWashId}")
    public ResponseEntity<ApiResponse<List<CarWashBooking>>> getBookingsByCarWashId(
            @PathVariable String carWashId,
            @RequestParam(required = false) String search) {
        List<CarWashBooking> bookings = bookingService.getBookingsByCarWashId(carWashId, search);
        return ResponseEntity.ok(new ApiResponse<>("Fetched bookings for car wash: " + carWashId, HttpStatus.OK.value(), bookings));
    }

    // Get booking by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CarWashBooking>> getBookingById(@PathVariable String id) {
        CarWashBooking booking = bookingService.getBookingById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id " + id));
        return ResponseEntity.ok(new ApiResponse<>("Booking fetched successfully", HttpStatus.OK.value(), booking));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse<CarWashBooking>> updateBooking(
            @PathVariable String id,
            @RequestBody CarWashBooking booking,
            Authentication auth) {
        String loggedInUsername = auth != null ? auth.getName() : null;
        CarWashBooking updated = bookingService.updateBooking(id, booking, loggedInUsername);
        return ResponseEntity.ok(new ApiResponse<>("Booking updated successfully", HttpStatus.OK.value(), updated));
    }


    // Delete booking
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBooking(@PathVariable String id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.ok(new ApiResponse<>("Booking deleted successfully", HttpStatus.OK.value(), null));
    }
}
