package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.models.ApiResponse;
import com.test.app.TestAppBackEnd.entities.CarWashBooking;
import com.test.app.TestAppBackEnd.services.CarWashBookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carwash-bookings")
public class CarWashBookingController {

    @Autowired
    private CarWashBookingService bookingService;

    // Create booking
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<CarWashBooking>> createBooking(@RequestBody CarWashBooking booking) {
        CarWashBooking saved = bookingService.createBooking(booking);
        return ResponseEntity.ok(new ApiResponse<>("Booking created successfully", HttpStatus.OK.value(), saved, false));
    }

    // Get all bookings
    @GetMapping
    public ResponseEntity<ApiResponse<List<CarWashBooking>>> getAllBookings() {
        List<CarWashBooking> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(new ApiResponse<>("Fetched all bookings", HttpStatus.OK.value(), bookings, false));
    }

    // Get bookings by client
    @GetMapping("/client/{username}")
    public ResponseEntity<ApiResponse<List<CarWashBooking>>> getBookingsByClient(@PathVariable String username) {
        List<CarWashBooking> bookings = bookingService.getBookingsByClient(username);
        return ResponseEntity.ok(new ApiResponse<>("Fetched bookings for client: " + username, HttpStatus.OK.value(), bookings, false));
    }

    // Get booking by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CarWashBooking>> getBookingById(@PathVariable Long id) {
        CarWashBooking booking = bookingService.getBookingById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id " + id));
        return ResponseEntity.ok(new ApiResponse<>("Booking fetched successfully", HttpStatus.OK.value(), booking, false));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse<CarWashBooking>> updateBooking(
            @PathVariable Long id,
            @RequestBody CarWashBooking booking) {
        CarWashBooking updated = bookingService.updateBooking(id, booking);
        return ResponseEntity.ok(new ApiResponse<>("Booking updated successfully", HttpStatus.OK.value(), updated, false));
    }


    // Delete booking
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.ok(new ApiResponse<>("Booking deleted successfully", HttpStatus.OK.value(), null, false));
    }
}
