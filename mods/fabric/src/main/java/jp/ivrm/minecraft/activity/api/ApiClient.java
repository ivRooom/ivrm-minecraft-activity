package jp.ivrm.minecraft.activity.api;

import jp.ivrm.minecraft.activity.IvrmMinecraftActivityMod;
import jp.ivrm.minecraft.activity.config.ActivityConfig;
import jp.ivrm.minecraft.activity.security.SignatureUtil;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;

public final class ApiClient {
    private final ActivityConfig config;
    private final HttpClient client;

    public ApiClient(ActivityConfig config) {
        this.config = config;
        this.client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(config.api.timeoutSeconds))
                .build();
    }

    public CompletableFuture<Boolean> postEvent(String path, String eventId, String body) {
        String timestamp = Instant.now().toString();
        String signature = SignatureUtil.sign(config.api.serverSecret, "POST", path, timestamp, eventId, body);
        URI uri = URI.create(config.api.baseUrl + path);

        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(config.api.timeoutSeconds))
                .header("Content-Type", "application/json")
                .header("X-IVRM-Server-Id", config.server.id)
                .header("X-IVRM-Timestamp", timestamp)
                .header("X-IVRM-Event-Id", eventId)
                .header("X-IVRM-Signature", signature)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        return client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(response -> {
                    boolean ok = response.statusCode() >= 200 && response.statusCode() < 300;
                    if (!ok) {
                        IvrmMinecraftActivityMod.LOGGER.warn("Activity API returned status={} path={} body={}", response.statusCode(), path, response.body());
                    }
                    return ok;
                })
                .exceptionally(error -> {
                    IvrmMinecraftActivityMod.LOGGER.warn("Activity API request failed path={} eventId={}", path, eventId, error);
                    return false;
                });
    }
}
