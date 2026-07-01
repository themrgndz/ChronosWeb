package ai.backend_service.model;

import lombok.Data;

@Data
public class ChronosResponse {
    private double median;
    private double upper_bound;
    private double lower_bound;
}