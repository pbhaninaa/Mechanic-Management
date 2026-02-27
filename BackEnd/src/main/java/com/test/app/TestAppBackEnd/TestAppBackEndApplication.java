package com.test.app.TestAppBackEnd;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TestAppBackEndApplication {
	public static void main(String[] args) {
		SpringApplication.run(TestAppBackEndApplication.class, args);
	}
}
