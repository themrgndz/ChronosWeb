package ai.backend_service.service;

import ai.backend_service.model.ChronosRequest;
import ai.backend_service.model.ChronosResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class ChronosServiceClient {

    private final WebClient webClient;

    // properties dosyasından Docker URL'ini dinamik alıyoruz brom
    public ChronosServiceClient(WebClient.Builder webClientBuilder, @Value("${ai.service.url}") String aiServiceUrl) {
        this.webClient = webClientBuilder.baseUrl(aiServiceUrl).build();
        System.out.println("[AI-CLIENT] Baglanti adresi kuruldu: " + aiServiceUrl);
    }

    public Mono<ChronosResponse> getNextStepPrediction(List<Double> contextWindow) {
        return this.webClient.post()
                .uri("/predict")
                .bodyValue(new ChronosRequest(contextWindow))
                .retrieve()
                .bodyToMono(ChronosResponse.class)
                .onErrorResume(e -> {
                    System.err.println("[AI-CLIENT] FastAPI baglanti hatasi: " + e.getMessage());
                    return Mono.empty();
                });
    }
}