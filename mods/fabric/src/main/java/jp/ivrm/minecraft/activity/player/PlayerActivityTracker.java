package jp.ivrm.minecraft.activity.player;

import com.google.gson.JsonObject;
import jp.ivrm.minecraft.activity.IvrmMinecraftActivityMod;
import jp.ivrm.minecraft.activity.api.ApiClient;
import jp.ivrm.minecraft.activity.config.ActivityConfig;
import jp.ivrm.minecraft.activity.queue.LocalEventQueue;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.util.math.Vec3d;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public final class PlayerActivityTracker {
    private ActivityConfig config;
    private ApiClient apiClient;
    private LocalEventQueue queue;
    private int tickCounter = 0;
    private final Map<UUID, PlayerRuntime> runtimes = new HashMap<>();

    public PlayerActivityTracker(ActivityConfig config, ApiClient apiClient, LocalEventQueue queue) {
        this.config = config;
        this.apiClient = apiClient;
        this.queue = queue;
    }

    public void updateRuntime(ActivityConfig config, ApiClient apiClient, LocalEventQueue queue) {
        this.config = config;
        this.apiClient = apiClient;
        this.queue = queue;
    }

    public void register() {
        ServerPlayConnectionEvents.JOIN.register((handler, sender, server) -> onJoin(handler.getPlayer()));
        ServerPlayConnectionEvents.DISCONNECT.register((handler, server) -> onDisconnect(handler.getPlayer()));
        ServerTickEvents.END_SERVER_TICK.register(this::onServerTick);
    }

    private void onJoin(ServerPlayerEntity player) {
        if (!config.events.login) {
            return;
        }

        PlayerRuntime runtime = PlayerRuntime.from(player);
        runtimes.put(player.getUuid(), runtime);

        JsonObject body = basePlayerBody(player);
        body.addProperty("joinedAt", Instant.now().toString());
        postOrQueue("/v1/minecraft/events/login", eventId(player, "login"), body);
    }

    private void onDisconnect(ServerPlayerEntity player) {
        if (!config.events.logout) {
            return;
        }

        JsonObject body = basePlayerBody(player);
        body.addProperty("leftAt", Instant.now().toString());
        postOrQueue("/v1/minecraft/events/logout", eventId(player, "logout"), body);
        runtimes.remove(player.getUuid());
    }

    private void onServerTick(MinecraftServer server) {
        if (!config.heartbeat.enabled) {
            return;
        }

        tickCounter++;
        int intervalTicks = Math.max(20, config.heartbeat.intervalSeconds * 20);
        if (tickCounter < intervalTicks) {
            return;
        }
        tickCounter = 0;

        for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
            sendHeartbeat(player);
        }
    }

    private void sendHeartbeat(ServerPlayerEntity player) {
        PlayerRuntime runtime = runtimes.computeIfAbsent(player.getUuid(), uuid -> PlayerRuntime.from(player));
        runtime.updateActivity(player, config.afk.thresholdSeconds);

        JsonObject body = basePlayerBody(player);
        body.addProperty("sentAt", Instant.now().toString());
        body.addProperty("dimension", player.getWorld().getRegistryKey().getValue().toString());
        body.addProperty("afk", runtime.afk);
        body.addProperty("lastActiveAt", runtime.lastActiveAt.toString());

        postOrQueue("/v1/minecraft/events/heartbeat", eventId(player, "heartbeat"), body);
    }

    private JsonObject basePlayerBody(ServerPlayerEntity player) {
        JsonObject body = new JsonObject();
        body.addProperty("serverId", config.server.id);
        body.addProperty("minecraftUuid", player.getUuidAsString());
        body.addProperty("minecraftName", player.getGameProfile().getName());
        return body;
    }

    private String eventId(ServerPlayerEntity player, String eventType) {
        return config.server.id + ":" + player.getUuidAsString() + ":" + eventType + ":" + Instant.now().toEpochMilli();
    }

    private void postOrQueue(String path, String eventId, JsonObject body) {
        String json = body.toString();
        apiClient.postEvent(path, eventId, json).thenAccept(ok -> {
            if (!ok && config.api.retryEnabled) {
                queue.enqueue(path, eventId, json);
            }
        });
    }

    private static final class PlayerRuntime {
        private Vec3d lastPosition;
        private float lastYaw;
        private float lastPitch;
        private Instant lastActiveAt;
        private boolean afk;

        private static PlayerRuntime from(ServerPlayerEntity player) {
            PlayerRuntime runtime = new PlayerRuntime();
            runtime.lastPosition = player.getPos();
            runtime.lastYaw = player.getYaw();
            runtime.lastPitch = player.getPitch();
            runtime.lastActiveAt = Instant.now();
            runtime.afk = false;
            return runtime;
        }

        private void updateActivity(ServerPlayerEntity player, int afkThresholdSeconds) {
            boolean moved = lastPosition.squaredDistanceTo(player.getPos()) > 0.0001D;
            boolean looked = Math.abs(lastYaw - player.getYaw()) > 0.01F || Math.abs(lastPitch - player.getPitch()) > 0.01F;

            if (moved || looked) {
                lastPosition = player.getPos();
                lastYaw = player.getYaw();
                lastPitch = player.getPitch();
                lastActiveAt = Instant.now();
                afk = false;
                return;
            }

            afk = Instant.now().minusSeconds(afkThresholdSeconds).isAfter(lastActiveAt);
        }
    }
}
