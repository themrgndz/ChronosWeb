package ai.backend_service.model;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardPayload {
    private long timestamp;       // Grafikte tam eşleşme için milisaniye bazlı zaman damgası
    private String dateTimeStr;   // Okunabilir zaman (Örn: 2015-11-01 01:00:00)
    private double actualValue;   // O anki gerçek trafik hacmi
    private double predictedMedian; // Chronos'un o an için ürettiği tahmin
    private double upperBound;    // %95 güven sınırı
    private double lowerBound;    // %5 güven sınırı
    private boolean isAnomaly;    // Anomali mi?
    private String anomalyType;   // "NORMAL", "AŞIRI YOĞUN", "AŞIRI TENHA"
}