package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.CarWashBooking;
import com.test.app.TestAppBackEnd.repositories.CarWashBookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CarWashBookingService {

    @Autowired
    private CarWashBookingRepository repository;


    // Create booking
    public CarWashBooking createBooking(CarWashBooking booking) {
        return repository.save(booking);
    }

    // Get all bookings
    public List<CarWashBooking> getAllBookings() {
        return repository.findAll();
    }

    // Get bookings by client username
    public List<CarWashBooking> getBookingsByClient(String clientUsername) {
        return repository.findByClientUsername(clientUsername);
    }

    // Get booking by ID
    public Optional<CarWashBooking> getBookingById(Long id) {
        return repository.findById(id);
    }

    // Update booking
    public CarWashBooking updateBooking(Long id, CarWashBooking updatedBooking) {
        return repository.findById(id).map(booking -> {
            booking.setCarPlate(updatedBooking.getCarPlate());
            booking.setCarType(updatedBooking.getCarType());
            booking.setCarDescription(updatedBooking.getCarDescription());
            booking.setServiceTypes(updatedBooking.getServiceTypes());
            booking.setServicePrice(updatedBooking.getServicePrice());
            booking.setDate(updatedBooking.getDate());
            booking.setLocation(updatedBooking.getLocation());
            booking.setStatus(updatedBooking.getStatus());
            booking.setCarWashId(updatedBooking.getCarWashId()); // assign carwash when accepted
            return repository.save(booking);
        }).orElseThrow(() -> new RuntimeException("Booking not found with id " + id));
    }

    // Delete booking
    public void deleteBooking(Long id) {
        repository.deleteById(id);
    }
}
