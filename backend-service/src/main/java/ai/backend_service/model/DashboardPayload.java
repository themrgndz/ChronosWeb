package ai.backend_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardPayload {
    private long timestamp;
    private String dateTimeStr;
    private double actualValue;

    private List<Double> predictions;

    private double upperBound;
    private double lowerBound;
    private boolean isAnomaly;
    private String anomalyType;
}