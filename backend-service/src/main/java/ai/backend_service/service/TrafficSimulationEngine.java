package ai.backend_service.service;

import ai.backend_service.model.ChronosResponse;
import ai.backend_service.model.DashboardPayload;
import ai.backend_service.config.websocket.DashboardWebSocketHandler;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

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

    // Simülasyon durumunu kontrol eden thread-safe bayrak
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
            System.err.println("[SIMÜLATÖR] CSV yükleme hatası! traffic.csv dosyasını kontrol edin: " + e.getMessage());
        }
    }

    @Scheduled(fixedRate = 1000)
    public void runSimulationStep() {
        // Eğer akış başlatılmadıysa veya durdurulduysa işlem yapma brom
        if (!isRunning) {
            return;
        }

        if (csvRows.isEmpty() || currentRowIndex >= csvRows.size()) {
            return;
        }

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

        aiClient.getNextStepPrediction(new ArrayList<>(slidingWindow))
                .subscribe(aiResponse -> processAndBroadcast(finalTimestamp, dateTimeStr, actualValue, aiResponse));
    }

    private void processAndBroadcast(long timestamp, String dateTimeStr, double actualValue, ChronosResponse aiResponse) {
        if (aiResponse == null) return;

        double predictedMedian = aiResponse.getMedian();
        double upperBound = aiResponse.getUpper_bound();
        double lowerBound = aiResponse.getLower_bound();

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
                .predictedMedian(predictedMedian)
                .upperBound(upperBound)
                .lowerBound(lowerBound)
                .isAnomaly(isAnomaly)
                .anomalyType(anomalyType)
                .build();

        webSocketHandler.broadcast(payload);

        System.out.printf("[%s] Trafik: %.0f | Beklenen: %.0f | Durum: %s%n",
                dateTimeStr, actualValue, predictedMedian, anomalyType);
    }

    // Durum kontrolü ve başlatma/durdurma metotları agam
    public boolean isRunning() {
        return this.isRunning;
    }

    public void startSimulation() {
        this.isRunning = true;
        System.out.println("[SIMÜLATÖR] Canlı akış başlatıldı brom.");
    }

    public void stopSimulation() {
        this.isRunning = false;
        System.out.println("[SIMÜLATÖR] Canlı akış durduruldu agam.");
    }
}