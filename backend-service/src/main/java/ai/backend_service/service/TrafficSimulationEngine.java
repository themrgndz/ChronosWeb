package ai.backend_service.service;

import ai.backend_service.model.ChronosResponse;
import ai.backend_service.model.DashboardPayload;
import ai.backend_service.config.websocket.DashboardWebSocketHandler;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

@Service
public class TrafficSimulationEngine {

    private final ChronosServiceClient aiClient;
    private final DashboardWebSocketHandler webSocketHandler;

    private final LinkedList<Double> slidingWindow = new LinkedList<>();
    private final List<String[]> csvRows = new ArrayList<>();
    private int currentRowIndex = 0;
    private volatile boolean isRunning = false;

    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public TrafficSimulationEngine(ChronosServiceClient aiClient, DashboardWebSocketHandler webSocketHandler) {
        this.aiClient = aiClient;
        this.webSocketHandler = webSocketHandler;
    }

    @PostConstruct
    public void init() {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                new ClassPathResource("traffic.csv").getInputStream()))) {

            br.readLine();
            String line;
            while ((line = br.readLine()) != null) {
                String[] tokens = line.split(",");
                if (tokens.length >= 3 && "1".equals(tokens[1].trim())) {
                    csvRows.add(tokens);
                }
            }
            System.out.println("[SIMÜLATÖR] Veri seti yüklendi. Toplam Junction 1 satırı: " + csvRows.size());
        } catch (Exception e) {
            System.err.println("[SIMÜLATÖR] CSV yükleme hatası!: " + e.getMessage());
        }
    }

    @Scheduled(fixedRate = 1000)
    public void runSimulationStep() {
        if (!isRunning) return;
        if (csvRows.isEmpty() || currentRowIndex >= csvRows.size()) return;

        String[] row = csvRows.get(currentRowIndex);
        String dateTimeStr = row[0].trim();
        double actualValue = Double.parseDouble(row[2].trim());

        long calculatedTimestamp;
        try {
            LocalDateTime localDateTime = LocalDateTime.parse(dateTimeStr, formatter);
            calculatedTimestamp = localDateTime.toInstant(ZoneOffset.UTC).toEpochMilli();
        } catch (Exception e) {
            calculatedTimestamp = System.currentTimeMillis();
        }

        final long finalTimestamp = calculatedTimestamp;

        slidingWindow.addLast(actualValue);
        if (slidingWindow.size() > 100) {
            slidingWindow.removeFirst();
        }

        currentRowIndex++;

        if (slidingWindow.size() < 20) {
            System.out.println("[SIMÜLATÖR] Veri biriktiriliyor... (" + slidingWindow.size() + "/20)");
            return;
        }

        List<Double> currentWindow = new ArrayList<>(slidingWindow);

        // 1. ADIM TAHMİNİ (t+1)
        aiClient.getNextStepPrediction(currentWindow)
                .flatMap(firstResponse -> {
                    double tPlus1Prediction = firstResponse.getMedian();

                    // İlk tahmini pencereye simüle edip ekliyoruz brom
                    List<Double> extendedWindow = new ArrayList<>(currentWindow);
                    extendedWindow.add(tPlus1Prediction);
                    if (extendedWindow.size() > 100) extendedWindow.remove(0);

                    // 2. ADIM TAHMİNİ (t+2)
                    return aiClient.getNextStepPrediction(extendedWindow)
                            .map(secondResponse -> {
                                List<Double> doublePredictions = List.of(tPlus1Prediction, secondResponse.getMedian());
                                return new PredictionTuple(firstResponse, doublePredictions);
                            });
                })
                .subscribe(tuple -> processAndBroadcast(finalTimestamp, dateTimeStr, actualValue, tuple.firstResponse, tuple.predictions));
    }

    private void processAndBroadcast(long timestamp, String dateTimeStr, double actualValue, ChronosResponse firstResponse, List<Double> predictions) {
        if (firstResponse == null) return;

        double upperBound = firstResponse.getUpper_bound();
        double lowerBound = firstResponse.getLower_bound();

        boolean isAnomaly = false;
        String anomalyType = "NORMAL";

        if (actualValue > upperBound) {
            isAnomaly = true;
            anomalyType = "AŞIRI YOĞUN";
        } else if (actualValue < lowerBound) {
            isAnomaly = true;
            anomalyType = "AŞIRI TENHA";
        }

        DashboardPayload payload = DashboardPayload.builder()
                .timestamp(timestamp)
                .dateTimeStr(dateTimeStr)
                .actualValue(actualValue)
                .predictions(predictions) // İki adımlı tahmin listesi gidiyor agam
                .upperBound(upperBound)
                .lowerBound(lowerBound)
                .isAnomaly(isAnomaly)
                .anomalyType(anomalyType)
                .build();

        webSocketHandler.broadcast(payload);

        System.out.printf("[%s] Trafik: %.0f | (t+1) Beklenen: %.0f | (t+2) Beklenen: %.0f | Durum: %s%n",
                dateTimeStr, actualValue, predictions.get(0), predictions.get(1), anomalyType);
    }

    public boolean isRunning() { return this.isRunning; }
    public void startSimulation() { this.isRunning = true; System.out.println("[SIMÜLATÖR] Canlı akış başlatıldı brom."); }
    public void stopSimulation() { this.isRunning = false; System.out.println("[SIMÜLATÖR] Canlı akış durduruldu agam."); }

    // Reaktif akışta verileri sarmalamak için yardımcı iç sınıf brom
    private static class PredictionTuple {
        final ChronosResponse firstResponse;
        final List<Double> predictions;

        PredictionTuple(ChronosResponse firstResponse, List<Double> predictions) {
            this.firstResponse = firstResponse;
            this.predictions = predictions;
        }
    }
}