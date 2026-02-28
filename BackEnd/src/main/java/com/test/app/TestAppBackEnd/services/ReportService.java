package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.CarWashBooking;
import com.test.app.TestAppBackEnd.entities.MechanicRequest;
import com.test.app.TestAppBackEnd.entities.Payment;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final CarWashBookingService carWashBookingService;
    private final MechanicRequestService mechanicRequestService;
    private final PaymentService paymentService;
    private final EmailService emailService;
    private final UserProfileRepository userProfileRepository;

    public ReportService(CarWashBookingService carWashBookingService,
                         MechanicRequestService mechanicRequestService,
                         PaymentService paymentService,
                         EmailService emailService,
                         UserProfileRepository userProfileRepository) {
        this.carWashBookingService = carWashBookingService;
        this.mechanicRequestService = mechanicRequestService;
        this.paymentService = paymentService;
        this.emailService = emailService;
        this.userProfileRepository = userProfileRepository;
    }

    private String getEmailForUsername(String username) {
        if (username == null || username.isBlank()) return null;
        return userProfileRepository.findByUsername(username)
                .map(p -> p.getEmail())
                .filter(e -> e != null && !e.isBlank())
                .orElse(null);
    }

    // ---------- Car Wash Report ----------

    public byte[] getCarWashReportCsv(String username, String startDate, String endDate) {
        List<CarWashBooking> bookings = carWashBookingService.getBookingsByClientAndDateRange(username, startDate, endDate);
        return buildCarWashCsv(bookings);
    }

    private byte[] buildCarWashCsv(List<CarWashBooking> bookings) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter w = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8));
        w.println("Car Plate,Services,Date,Price,Status,Location");
        for (CarWashBooking b : bookings) {
            String services = b.getServiceTypes() != null ? String.join("; ", b.getServiceTypes()) : "";
            String price = b.getServicePrice() != null ? b.getServicePrice().toString() : "";
            String loc = escapeCsv(b.getLocation());
            w.println(escapeCsv(b.getCarPlate()) + "," + escapeCsv(services) + "," + escapeCsv(String.valueOf(b.getDate())) + "," + price + "," + escapeCsv(b.getStatus()) + "," + loc);
        }
        w.flush();
        return baos.toByteArray();
    }

    public void sendCarWashReportToEmail(String username, String startDate, String endDate, String toEmail) {
        String email = (toEmail != null && !toEmail.isBlank()) ? toEmail : getEmailForUsername(username);
        if (email == null || email.isBlank()) {
            log.warn("Cannot send car wash report: no email for user {}", username);
            return;
        }
        byte[] csv = getCarWashReportCsv(username, startDate, endDate);
        String fileName = "car-wash-history-" + startDate + "-to-" + endDate + ".csv";
        String subject = "Car Wash History Report (" + startDate + " to " + endDate + ")";
        String body = "Please find your car wash history report for the selected date range attached.";
        emailService.sendReportEmail(email, subject, body, csv, fileName);
    }

    // ---------- Mechanic Requests Report ----------

    public byte[] getMechanicRequestsReportCsvByUser(String username, String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate, DATE_FMT);
        LocalDate end = LocalDate.parse(endDate, DATE_FMT);
        List<MechanicRequest> requests = mechanicRequestService.getByUsernameAndDateRange(username, start, end);
        return buildMechanicRequestsCsv(requests);
    }

    public byte[] getMechanicRequestsReportCsvByMechanic(String mechanicId, String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate, DATE_FMT);
        LocalDate end = LocalDate.parse(endDate, DATE_FMT);
        List<MechanicRequest> requests = mechanicRequestService.getByMechanicIdAndDateRange(mechanicId, start, end);
        return buildMechanicRequestsCsv(requests);
    }

    private byte[] buildMechanicRequestsCsv(List<MechanicRequest> requests) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter w = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8));
        w.println("Description,Date,Location,Status,Price");
        for (MechanicRequest r : requests) {
            String date = r.getDate() != null ? r.getDate().format(DATE_FMT) : "";
            String price = r.getServicePrice() != null ? r.getServicePrice().toString() : "";
            w.println(escapeCsv(r.getDescription()) + "," + date + "," + escapeCsv(r.getLocation()) + "," + escapeCsv(r.getStatus()) + "," + price);
        }
        w.flush();
        return baos.toByteArray();
    }

    public void sendMechanicRequestsReportToEmail(String username, String mechanicId, String startDate, String endDate, String toEmail) {
        String email = (toEmail != null && !toEmail.isBlank()) ? toEmail : (username != null ? getEmailForUsername(username) : null);
        if (email == null || email.isBlank()) {
            log.warn("Cannot send mechanic requests report: no email provided");
            return;
        }
        byte[] csv = mechanicId != null && !mechanicId.isBlank()
                ? getMechanicRequestsReportCsvByMechanic(mechanicId, startDate, endDate)
                : getMechanicRequestsReportCsvByUser(username, startDate, endDate);
        String fileName = "mechanic-requests-history-" + startDate + "-to-" + endDate + ".csv";
        String subject = "Mechanic Requests History Report (" + startDate + " to " + endDate + ")";
        String body = "Please find your mechanic requests history report for the selected date range attached.";
        emailService.sendReportEmail(email, subject, body, csv, fileName);
    }

    // ---------- Earnings Report (service provider: mechanic or car wash) ----------

    /** CSV of earnings (payments) for the given provider in date range. */
    public byte[] getEarningsReportCsv(String mechanicId, String carWashId, String startDate, String endDate) {
        List<Payment> payments;
        if (mechanicId != null && !mechanicId.isBlank()) {
            payments = paymentService.getPaymentsByMechanicAndDateRange(mechanicId, startDate, endDate);
        } else if (carWashId != null && !carWashId.isBlank()) {
            payments = paymentService.getPaymentsByCarWashAndDateRange(carWashId, startDate, endDate);
        } else {
            return new byte[0];
        }
        return buildEarningsCsv(payments);
    }

    private byte[] buildEarningsCsv(List<Payment> payments) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter w = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8));
        w.println("Job Description,Paid At,Amount,Platform Fee,Status");
        for (Payment p : payments) {
            String paidAt = p.getPaidAt() != null ? p.getPaidAt().format(DATE_TIME_FMT) : "";
            String amount = p.getAmount() != null ? p.getAmount().toString() : "";
            String fee = p.getPlatformFee() != null ? p.getPlatformFee().toString() : "";
            w.println(escapeCsv(p.getJobDescription()) + "," + paidAt + "," + amount + "," + fee + "," + escapeCsv(p.getStatus()));
        }
        w.flush();
        return baos.toByteArray();
    }

    public void sendEarningsReportToEmail(String mechanicId, String carWashId, String startDate, String endDate, String toEmail) {
        if (toEmail == null || toEmail.isBlank()) {
            String providerId = mechanicId != null && !mechanicId.isBlank() ? mechanicId : carWashId;
            toEmail = providerId != null ? userProfileRepository.findById(providerId).map(p -> p.getEmail()).filter(e -> e != null && !e.isBlank()).orElse(null) : null;
        }
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Cannot send earnings report: no email provided");
            return;
        }
        byte[] csv = getEarningsReportCsv(mechanicId, carWashId, startDate, endDate);
        String fileName = "earnings-" + startDate + "-to-" + endDate + ".csv";
        String subject = "Earnings Report (" + startDate + " to " + endDate + ")";
        String body = "Please find your earnings report for the selected date range attached.";
        emailService.sendReportEmail(toEmail, subject, body, csv, fileName);
    }

    // ---------- Completed Jobs Report (service provider) ----------

    /** CSV of completed jobs (mechanic requests or car wash bookings) for the provider in date range. */
    public byte[] getCompletedJobsReportCsv(String mechanicId, String carWashId, String startDate, String endDate) {
        if (mechanicId != null && !mechanicId.isBlank()) {
            LocalDate start = LocalDate.parse(startDate, DATE_FMT);
            LocalDate end = LocalDate.parse(endDate, DATE_FMT);
            List<MechanicRequest> jobs = mechanicRequestService.getCompletedJobsByMechanicIdAndDateRange(mechanicId, start, end);
            return buildCompletedMechanicJobsCsv(jobs);
        }
        if (carWashId != null && !carWashId.isBlank()) {
            List<CarWashBooking> jobs = carWashBookingService.getCompletedBookingsByCarWashIdAndDateRange(carWashId, startDate, endDate);
            return buildCompletedCarWashJobsCsv(jobs);
        }
        return new byte[0];
    }

    private byte[] buildCompletedMechanicJobsCsv(List<MechanicRequest> jobs) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter w = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8));
        w.println("Description,Date,Location,Status,Price,Client Username");
        for (MechanicRequest r : jobs) {
            String date = r.getDate() != null ? r.getDate().format(DATE_FMT) : "";
            String price = r.getServicePrice() != null ? r.getServicePrice().toString() : "";
            w.println(escapeCsv(r.getDescription()) + "," + date + "," + escapeCsv(r.getLocation()) + "," + escapeCsv(r.getStatus()) + "," + price + "," + escapeCsv(r.getUsername()));
        }
        w.flush();
        return baos.toByteArray();
    }

    private byte[] buildCompletedCarWashJobsCsv(List<CarWashBooking> jobs) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter w = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8));
        w.println("Car Plate,Services,Date,Price,Status,Location,Client Username");
        for (CarWashBooking b : jobs) {
            String services = b.getServiceTypes() != null ? String.join("; ", b.getServiceTypes()) : "";
            String price = b.getServicePrice() != null ? b.getServicePrice().toString() : "";
            w.println(escapeCsv(b.getCarPlate()) + "," + escapeCsv(services) + "," + escapeCsv(String.valueOf(b.getDate())) + "," + price + "," + escapeCsv(b.getStatus()) + "," + escapeCsv(b.getLocation()) + "," + escapeCsv(b.getClientUsername()));
        }
        w.flush();
        return baos.toByteArray();
    }

    public void sendCompletedJobsReportToEmail(String mechanicId, String carWashId, String startDate, String endDate, String toEmail) {
        if (toEmail == null || toEmail.isBlank()) {
            String providerId = mechanicId != null && !mechanicId.isBlank() ? mechanicId : carWashId;
            toEmail = providerId != null ? userProfileRepository.findById(providerId).map(p -> p.getEmail()).filter(e -> e != null && !e.isBlank()).orElse(null) : null;
        }
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Cannot send completed jobs report: no email provided");
            return;
        }
        byte[] csv = getCompletedJobsReportCsv(mechanicId, carWashId, startDate, endDate);
        String fileName = "completed-jobs-" + startDate + "-to-" + endDate + ".csv";
        String subject = "Completed Jobs Report (" + startDate + " to " + endDate + ")";
        String body = "Please find your completed jobs report for the selected date range attached.";
        emailService.sendReportEmail(toEmail, subject, body, csv, fileName);
    }

    private static String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
