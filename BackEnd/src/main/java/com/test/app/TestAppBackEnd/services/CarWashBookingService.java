package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.CarWashBooking;
import com.test.app.TestAppBackEnd.repositories.CarWashBookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

import java.util.List;
import java.util.Optional;

@Service
public class CarWashBookingService {

    @Autowired
    private CarWashBookingRepository repository;

    @Autowired
    private EmailService emailService;

    // ================= CREATE =================
    public CarWashBooking createBooking(CarWashBooking booking) {
        return repository.save(booking);
    }

    // ================= READ =================
    public List<CarWashBooking> getAllBookings() {
        return repository.findAll();
    }

    public List<CarWashBooking> getBookingsByClient(String clientUsername) {
        return repository.findByClientUsername(clientUsername);
    }

    public Optional<CarWashBooking> getBookingById(Long id) {
        return repository.findById(id);
    }

    // ================= UPDATE =================
    public CarWashBooking updateBooking(Long id, CarWashBooking updatedBooking) {
        return repository.findById(id).map(booking -> {
            // Check if status is changing
            boolean statusChanged = !booking.getStatus().equals(updatedBooking.getStatus());

            // Update all booking fields
            booking.setCarPlate(updatedBooking.getCarPlate());
            booking.setCarType(updatedBooking.getCarType());
            booking.setCarDescription(updatedBooking.getCarDescription());
            booking.setServiceTypes(updatedBooking.getServiceTypes());
            booking.setServicePrice(updatedBooking.getServicePrice());
            booking.setDate(updatedBooking.getDate());
            booking.setLocation(updatedBooking.getLocation());
            booking.setStatus(updatedBooking.getStatus());
            booking.setCarWashId(updatedBooking.getCarWashId());

            CarWashBooking savedBooking = repository.save(booking);

            // Send email only if status changed and actor is not the client
            if (statusChanged ) {
                String subject = "Booking Status Updated";
                String body = "Hi " + booking.getClientUsername() + ",\n\n" +
                        "Your booking (ID: " + booking.getId() + ") status has been changed to: " +
                        booking.getStatus() +   ".\n\n" +
                        "Thank you!";

               emailService. sendEmailNotification(booking.getClientUsername(), subject, body);
            }

            return savedBooking;
        }).orElseThrow(() -> new RuntimeException("Booking not found with id " + id));
    }

    // ================= DELETE =================
    public void deleteBooking(Long id) {
        repository.deleteById(id);
    }

    // ================= EMAIL HELPER =================

}
