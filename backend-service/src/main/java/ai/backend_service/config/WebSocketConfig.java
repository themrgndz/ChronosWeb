package ai.backend_service.config;

import ai.backend_service.config.websocket.DashboardWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final DashboardWebSocketHandler webSocketHandler;

    // Spring, iç paketteki handler bileşenini bulup buraya inject edecek hacı
    public WebSocketConfig(DashboardWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // React frontend'in bağlanacağı canlı veri akış kanalı
        registry.addHandler(webSocketHandler, "/stream")
                .setAllowedOrigins("*"); // CORS blokajını aşmak için
    }
}