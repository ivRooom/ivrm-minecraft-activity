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
        return postSigned(path, eventId, body)
                .thenApply(response -> {
                    boolean ok = response.isSuccess();
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

    public CompletableFuture<ApiResponse> getSigned(String pathWithQuery, String eventId) {
        return sendSigned("GET", pathWithQuery, eventId, "");
    }

    public CompletableFuture<ApiResponse> postSigned(String path, String eventId, String body) {
        return sendSigned("POST", path, eventId, body);
    }

    private CompletableFuture<ApiResponse> sendSigned(String method, String pathWithQuery, String eventId, String body) {
        String timestamp = Instant.now().toString();
        String signaturePath = pathWithQuery.split("\\?", 2)[0];
        String signature = SignatureUtil.sign(config.api.serverSecret, method, signaturePath, timestamp, eventId, body);
        URI uri = URI.create(config.api.baseUrl + pathWithQuery);

        HttpRequest.Builder builder = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(config.api.timeoutSeconds))
                .header("Content-Type", "application/json")
                .header("X-IVRM-Server-Id", config.server.id)
                .header("X-IVRM-Timestamp", timestamp)
                .header("X-IVRM-Event-Id", eventId)
                .header("X-IVRM-Signature", signature);

        if ("GET".equals(method)) {
            builder.GET();
        } else {
            builder.method(method, HttpRequest.BodyPublishers.ofString(body));
        }

        return client.sendAsync(builder.build(), HttpResponse.BodyHandlers.ofString())
                .thenApply(response -> new ApiResponse(response.statusCode(), response.body()))
                .exceptionally(error -> {
                    IvrmMinecraftActivityMod.LOGGER.warn("Activity API request failed method={} path={} eventId={}", method, pathWithQuery, eventId, error);
                    return new ApiResponse(599, "");
                });
    }

    public record ApiResponse(int statusCode, String body) {
        public boolean isSuccess() {
            return statusCode >= 200 && statusCode < 300;
        }
    }
}
