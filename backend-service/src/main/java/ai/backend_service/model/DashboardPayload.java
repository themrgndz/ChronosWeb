package ai.backend_service.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardPayload {
    private long timestamp;
    private String dateTimeStr;
    private double actualValue;
    private double predictedMedian;
    private double upperBound;
    private double lowerBound;
    private boolean isAnomaly;
    private String anomalyType;
}