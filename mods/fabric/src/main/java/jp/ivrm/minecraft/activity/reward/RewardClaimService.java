package jp.ivrm.minecraft.activity.reward;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jp.ivrm.minecraft.activity.IvrmMinecraftActivityMod;
import jp.ivrm.minecraft.activity.api.ApiClient;
import jp.ivrm.minecraft.activity.config.ActivityConfig;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public final class RewardClaimService {
    private ActivityConfig config;
    private ApiClient apiClient;

    public RewardClaimService(ActivityConfig config, ApiClient apiClient) {
        this.config = config;
        this.apiClient = apiClient;
    }

    public void updateRuntime(ActivityConfig config, ApiClient apiClient) {
        this.config = config;
        this.apiClient = apiClient;
    }

    public void listPendingRewards(ServerPlayerEntity player) {
        if (!config.rewards.enabled) {
            player.sendMessage(Text.literal("IVRM rewards are disabled."), false);
            return;
        }

        fetchPendingRewards(player).thenAccept(result -> player.getServer().execute(() -> {
            if (!result.ok) {
                player.sendMessage(Text.literal("報酬一覧の取得に失敗しました。"), false);
                return;
            }

            if (result.rewards.isEmpty()) {
                player.sendMessage(Text.literal("受け取れるIVRM報酬はありません。"), false);
                return;
            }

            player.sendMessage(Text.literal("受け取れるIVRM報酬: " + result.rewards.size() + "件"), false);
            for (Reward reward : result.rewards) {
                player.sendMessage(Text.literal("- " + reward.rewardName), false);
            }
        }));
    }

    public void claimRewards(ServerPlayerEntity player, boolean claimAll) {
        if (!config.rewards.enabled || !config.rewards.claimCommandEnabled) {
            player.sendMessage(Text.literal("IVRM rewards are disabled."), false);
            return;
        }

        fetchPendingRewards(player).thenAccept(result -> player.getServer().execute(() -> {
            if (!result.ok) {
                player.sendMessage(Text.literal("報酬の取得に失敗しました。"), false);
                return;
            }

            if (result.rewards.isEmpty()) {
                player.sendMessage(Text.literal("受け取れるIVRM報酬はありません。"), false);
                return;
            }

            List<Reward> targets = claimAll ? result.rewards : result.rewards.subList(0, 1);
            int delivered = 0;

            for (Reward reward : targets) {
                if (reward.commands.isEmpty()) {
                    player.sendMessage(Text.literal("報酬コマンドが空のためスキップしました: " + reward.rewardName), false);
                    continue;
                }

                boolean executed = executeRewardCommands(player, reward);
                if (!executed) {
                    player.sendMessage(Text.literal("報酬の配布に失敗しました: " + reward.rewardName), false);
                    continue;
                }

                delivered++;
                ackDelivered(player, reward);
                player.sendMessage(Text.literal("IVRM報酬を受け取りました: " + reward.rewardName), false);
            }

            if (delivered > 0) {
                player.sendMessage(Text.literal("IVRM報酬の受け取り完了: " + delivered + "件"), false);
            }
        }));
    }

    private java.util.concurrent.CompletableFuture<PendingRewardsResult> fetchPendingRewards(ServerPlayerEntity player) {
        String path = "/v1/minecraft/rewards/pending?uuid=" + player.getUuidAsString();
        String eventId = eventId(player, "reward-pending");

        return apiClient.getSigned(path, eventId).thenApply(response -> {
            if (!response.isSuccess() || response.body().isBlank()) {
                return PendingRewardsResult.failed();
            }

            try {
                JsonObject root = JsonParser.parseString(response.body()).getAsJsonObject();
                if (!root.has("ok") || !root.get("ok").getAsBoolean()) {
                    return PendingRewardsResult.failed();
                }

                JsonArray rewardsJson = root.getAsJsonArray("rewards");
                List<Reward> rewards = new ArrayList<>();
                if (rewardsJson != null) {
                    for (JsonElement element : rewardsJson) {
                        Reward reward = parseReward(element.getAsJsonObject());
                        if (reward != null) {
                            rewards.add(reward);
                        }
                    }
                }

                return PendingRewardsResult.success(rewards);
            } catch (Exception e) {
                IvrmMinecraftActivityMod.LOGGER.warn("Failed to parse pending rewards response", e);
                return PendingRewardsResult.failed();
            }
        });
    }

    private Reward parseReward(JsonObject object) {
        if (!object.has("id") || !object.has("rewardName") || !object.has("commands")) {
            return null;
        }

        List<String> commands = new ArrayList<>();
        JsonArray commandsJson = object.getAsJsonArray("commands");
        for (JsonElement commandElement : commandsJson) {
            if (!commandElement.isJsonPrimitive()) {
                continue;
            }

            String command = commandElement.getAsString();
            if (command.startsWith("give {player} ")) {
                commands.add(command);
            }
        }

        return new Reward(
                object.get("id").getAsString(),
                object.get("rewardName").getAsString(),
                commands
        );
    }

    private boolean executeRewardCommands(ServerPlayerEntity player, Reward reward) {
        MinecraftServer server = player.getServer();
        String playerName = player.getGameProfile().getName();

        try {
            for (String commandTemplate : reward.commands) {
                String command = commandTemplate.replace("{player}", playerName);
                if (!command.startsWith("give " + playerName + " ")) {
                    IvrmMinecraftActivityMod.LOGGER.warn("Blocked reward command grantId={} command={}", reward.id, commandTemplate);
                    return false;
                }

                server.getCommandManager().executeWithPrefix(server.getCommandSource(), command);
            }
            return true;
        } catch (Exception e) {
            IvrmMinecraftActivityMod.LOGGER.warn("Failed to execute reward commands grantId={}", reward.id, e);
            return false;
        }
    }

    private void ackDelivered(ServerPlayerEntity player, Reward reward) {
        JsonObject body = new JsonObject();
        body.addProperty("serverId", config.server.id);
        body.addProperty("minecraftUuid", player.getUuidAsString());
        body.addProperty("rewardGrantId", reward.id);
        body.addProperty("deliveryStatus", "delivered");
        body.addProperty("deliveredAt", Instant.now().toString());

        apiClient.postSigned("/v1/minecraft/rewards/ack", eventId(player, "reward-ack-" + reward.id), body.toString())
                .thenAccept(response -> {
                    if (!response.isSuccess()) {
                        IvrmMinecraftActivityMod.LOGGER.warn("Failed to ack delivered reward grantId={} status={} body={}", reward.id, response.statusCode(), response.body());
                    }
                });
    }

    private String eventId(ServerPlayerEntity player, String type) {
        return config.server.id + ":" + player.getUuidAsString() + ":" + type + ":" + Instant.now().toEpochMilli();
    }

    private record PendingRewardsResult(boolean ok, List<Reward> rewards) {
        private static PendingRewardsResult success(List<Reward> rewards) {
            return new PendingRewardsResult(true, rewards);
        }

        private static PendingRewardsResult failed() {
            return new PendingRewardsResult(false, List.of());
        }
    }

    private record Reward(String id, String rewardName, List<String> commands) {
    }
}
