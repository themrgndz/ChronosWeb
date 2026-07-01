package ai.backend_service.service;

import ai.backend_service.model.ChronosRequest;
import ai.backend_service.model.ChronosResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class ChronosServiceClient {

    private final WebClient webClient;

    public ChronosServiceClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("http://localhost:8000").build();
    }

    public Mono<ChronosResponse> getNextStepPrediction(List<Double> contextWindow) {
        return this.webClient.post()
                .uri("/predict")
                .bodyValue(new ChronosRequest(contextWindow))
                .retrieve()
                .bodyToMono(ChronosResponse.class)
                .onErrorResume(e -> {
                    System.err.println("[AI-CLIENT] FastAPI bağlantı hatası: " + e.getMessage());
                    return Mono.empty();
                });
    }
}