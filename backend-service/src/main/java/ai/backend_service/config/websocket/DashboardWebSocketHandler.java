package ai.backend_service.config.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import ai.backend_service.model.DashboardPayload;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class DashboardWebSocketHandler extends TextWebSocketHandler {

    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        System.out.println("[WebSocket] Yeni tarayıcı sekmesi bağlandı: " + session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        System.out.println("[WebSocket] Tarayıcı sekmesi ayrıldı: " + session.getId());
    }

    /**
     * Simülatör motorumuz (TrafficSimulationEngine) her yeni tahminde bu metodu çağıracak
     * ve veriyi bağlı olan tüm React arayüzlerine anlık olarak "push" edecek agam.
     */
    public void broadcast(DashboardPayload payload) {
        String jsonPayload;
        try {
            // DashboardPayload nesnesini React'in anlayacağı JSON stringine çeviriyoruz
            jsonPayload = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            System.err.println("[WebSocket] JSON dönüştürme hatası: " + e.getMessage());
            return;
        }

        TextMessage message = new TextMessage(jsonPayload);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(message);
                } catch (IOException e) {
                    System.err.println("[WebSocket] Mesaj gönderim hatası (Sekme ID: " + session.getId() + "): " + e.getMessage());
                }
            }
        }
    }
}