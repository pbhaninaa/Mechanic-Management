package com.test.app.TestAppBackEnd.services;

import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.PaymentIntent;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.PaymentIntentCreateParams;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class StripeService {

    @Value("${stripe.secret-key}")
    private String secretKey;

    private final UserProfileRepository userProfileRepository;

    public StripeService(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    /**
     * Create a Stripe PaymentIntent for card payment with customer attached.
     * Amount is in the smallest currency unit (cents for ZAR).
     */
    public Map<String, String> createPaymentIntent(Long amountCents, String currency, String clientUsername,
                                                    String jobId, String mechanicId, String carWashId) throws StripeException {
        com.stripe.Stripe.apiKey = secretKey;

        String email = "customer@" + (clientUsername != null ? clientUsername : "unknown") + ".local";
        String firstName = "";
        String lastName = "";
        String fullName = clientUsername != null ? clientUsername : "Customer";

        var profileOpt = userProfileRepository.findByUsername(clientUsername != null ? clientUsername : "");
        if (profileOpt.isPresent()) {
            var profile = profileOpt.get();
            if (profile.getEmail() != null && !profile.getEmail().isBlank()) {
                email = profile.getEmail();
            }
            firstName = profile.getFirstName() != null ? profile.getFirstName() : "";
            lastName = profile.getLastName() != null ? profile.getLastName() : "";
            fullName = (firstName + " " + lastName).trim();
            if (fullName.isBlank()) fullName = profile.getUsername();
        }

        CustomerCreateParams customerParams = CustomerCreateParams.builder()
                .setEmail(email)
                .setName(fullName)
                .putMetadata("firstName", firstName)
                .putMetadata("lastName", lastName)
                .putMetadata("username", clientUsername != null ? clientUsername : "")
                .build();
        Customer customer = Customer.create(customerParams);
        String customerId = customer.getId();

        // Description visible in Stripe Transactions (Name, Email/Username)
        String description = fullName + " (" + email + ")";
        if (clientUsername != null && !clientUsername.isBlank()) {
            description += " [@" + clientUsername + "]";
        }

        PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
                .setAmount(amountCents)
                .setCurrency(currency != null && !currency.isBlank() ? currency.toLowerCase() : "zar")
                .setDescription(description)
                .putMetadata("firstName", firstName)
                .putMetadata("lastName", lastName)
                .putMetadata("clientUsername", clientUsername != null ? clientUsername : "")
                .putMetadata("clientEmail", email)
                .putMetadata("jobId", jobId != null ? jobId : "")
                .putMetadata("mechanicId", mechanicId != null ? mechanicId : "")
                .putMetadata("carWashId", carWashId != null ? carWashId : "");

        if (customerId != null) {
            paramsBuilder.setCustomer(customerId);
        }

        PaymentIntent intent = PaymentIntent.create(paramsBuilder.build());

        Map<String, String> result = new HashMap<>();
        result.put("clientSecret", intent.getClientSecret());
        result.put("paymentIntentId", intent.getId());
        return result;
    }

    /**
     * Verify that a PaymentIntent has succeeded (for confirming payment before saving to DB).
     */
    public boolean verifyPaymentSucceeded(String paymentIntentId) {
        if (paymentIntentId == null || paymentIntentId.isBlank()) return false;
        try {
            com.stripe.Stripe.apiKey = secretKey;
            PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
            return "succeeded".equals(intent.getStatus());
        } catch (StripeException e) {
            return false;
        }
    }
}
