package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.entities.ProviderServiceOffering;
import com.test.app.TestAppBackEnd.models.ApiResponse;
import com.test.app.TestAppBackEnd.services.ProviderServiceOfferingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/provider-services")
public class ProviderServiceOfferingController {

    private final ProviderServiceOfferingService service;

    public ProviderServiceOfferingController(ProviderServiceOfferingService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProviderServiceOffering>>> getMyOfferings(
            @RequestParam String providerType,
            Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        if (username == null || username.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Unauthorized", HttpStatus.UNAUTHORIZED.value(), null));
        }
        List<ProviderServiceOffering> list = service.getMyOfferings(username, providerType);
        return ResponseEntity.ok(new ApiResponse<>("OK", HttpStatus.OK.value(), list));
    }

    /** Catalog for clients: all services and prices by provider type (no auth filter) */
    @GetMapping("/catalog")
    public ResponseEntity<ApiResponse<List<ProviderServiceOffering>>> getCatalog(@RequestParam String providerType) {
        List<ProviderServiceOffering> list = service.getCatalog(providerType);
        return ResponseEntity.ok(new ApiResponse<>("OK", HttpStatus.OK.value(), list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProviderServiceOffering>> create(
            @RequestParam String providerType,
            @RequestBody ProviderServiceOffering offering,
            Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        if (username == null || username.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Unauthorized", HttpStatus.UNAUTHORIZED.value(), null));
        }
        ProviderServiceOffering saved = service.create(username, providerType, offering);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Service offering created", HttpStatus.CREATED.value(), saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProviderServiceOffering>> update(
            @PathVariable String id,
            @RequestBody ProviderServiceOffering offering,
            Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        if (username == null || username.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Unauthorized", HttpStatus.UNAUTHORIZED.value(), null));
        }
        return service.update(id, username, offering)
                .map(r -> ResponseEntity.ok(new ApiResponse<>("Updated", HttpStatus.OK.value(), r)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse<>("Not found or not allowed", HttpStatus.NOT_FOUND.value(), null)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id, Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        if (username == null || username.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Unauthorized", HttpStatus.UNAUTHORIZED.value(), null));
        }
        if (service.delete(id, username)) {
            return ResponseEntity.ok(new ApiResponse<>("Deleted", HttpStatus.OK.value(), null));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>("Not found or not allowed", HttpStatus.NOT_FOUND.value(), null));
    }
}
