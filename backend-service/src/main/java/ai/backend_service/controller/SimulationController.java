package ai.backend_service.controller;

import ai.backend_service.service.TrafficSimulationEngine;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/simulation")
@CrossOrigin(origins = "http://localhost:5173") // Frontend portuna göre CORS ayarı
public class SimulationController {

    private final TrafficSimulationEngine simulationEngine;

    public SimulationController(TrafficSimulationEngine simulationEngine) {
        this.simulationEngine = simulationEngine;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> getStatus() {
        return ResponseEntity.ok(Map.of("isRunning", simulationEngine.isRunning()));
    }

    @PostMapping("/start")
    public ResponseEntity<Map<String, String>> start() {
        simulationEngine.startSimulation();
        return ResponseEntity.ok(Map.of("message", "Simülasyon başladı brom."));
    }

    @PostMapping("/stop")
    public ResponseEntity<Map<String, String>> stop() {
        simulationEngine.stopSimulation();
        return ResponseEntity.ok(Map.of("message", "Simülasyon durduruldu agam."));
    }
}