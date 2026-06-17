package jp.ivrm.minecraft.activity.queue;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jp.ivrm.minecraft.activity.IvrmMinecraftActivityMod;
import jp.ivrm.minecraft.activity.api.ApiClient;
import jp.ivrm.minecraft.activity.config.ActivityConfig;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public final class LocalEventQueue {
    private static final Gson GSON = new Gson();

    private final ActivityConfig config;
    private final Path queuePath;

    public LocalEventQueue(ActivityConfig config) {
        this.config = config;
        this.queuePath = config.queuePath();
    }

    public void enqueue(String path, String eventId, String body) {
        if (!config.queue.enabled) {
            return;
        }

        try {
            Files.createDirectories(queuePath.getParent());
            JsonObject queued = new JsonObject();
            queued.addProperty("path", path);
            queued.addProperty("eventId", eventId);
            queued.addProperty("body", body);
            queued.addProperty("queuedAt", Instant.now().toString());
            Files.writeString(queuePath, GSON.toJson(queued) + System.lineSeparator(), StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (IOException e) {
            IvrmMinecraftActivityMod.LOGGER.error("Failed to enqueue event path={} eventId={}", path, eventId, e);
        }
    }

    public void flush(ApiClient apiClient) {
        if (!Files.exists(queuePath)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(queuePath);
            List<String> failed = new ArrayList<>();

            for (String line : lines) {
                if (line.isBlank()) {
                    continue;
                }

                JsonObject queued = GSON.fromJson(line, JsonObject.class);
                String path = queued.get("path").getAsString();
                String eventId = queued.get("eventId").getAsString();
                String body = queued.get("body").getAsString();

                boolean ok = apiClient.postEvent(path, eventId, body).join();
                if (!ok) {
                    failed.add(line);
                }
            }

            if (failed.isEmpty()) {
                Files.deleteIfExists(queuePath);
            } else {
                Files.write(queuePath, failed, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.CREATE);
            }

            IvrmMinecraftActivityMod.LOGGER.info("Flushed activity queue. total={} failed={}", lines.size(), failed.size());
        } catch (Exception e) {
            IvrmMinecraftActivityMod.LOGGER.error("Failed to flush activity queue", e);
        }
    }
}
