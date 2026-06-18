package jp.ivrm.minecraft.activity;

import jp.ivrm.minecraft.activity.api.ApiClient;
import jp.ivrm.minecraft.activity.command.IvrmActivityCommand;
import jp.ivrm.minecraft.activity.command.IvrmRewardCommand;
import jp.ivrm.minecraft.activity.config.ActivityConfig;
import jp.ivrm.minecraft.activity.player.PlayerActivityTracker;
import jp.ivrm.minecraft.activity.queue.LocalEventQueue;
import jp.ivrm.minecraft.activity.reward.RewardClaimService;
import net.fabricmc.api.ModInitializer;
import net.minecraft.server.network.ServerPlayerEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class IvrmMinecraftActivityMod implements ModInitializer {
    public static final String MOD_ID = "ivrm_minecraft_activity";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    private ActivityConfig config;
    private LocalEventQueue queue;
    private ApiClient apiClient;
    private PlayerActivityTracker tracker;
    private RewardClaimService rewardClaimService;

    @Override
    public void onInitialize() {
        this.config = ActivityConfig.load();
        this.queue = new LocalEventQueue(config);
        this.apiClient = new ApiClient(config);
        this.tracker = new PlayerActivityTracker(config, apiClient, queue);
        this.rewardClaimService = new RewardClaimService(config, apiClient);

        tracker.register();
        IvrmActivityCommand.register(this);
        IvrmRewardCommand.register(this);

        LOGGER.info("IVRM Minecraft Activity initialized for server_id={}", config.server.id);
    }

    public ActivityConfig config() {
        return config;
    }

    public void reloadConfig() {
        this.config = ActivityConfig.load();
        this.queue = new LocalEventQueue(config);
        this.apiClient = new ApiClient(config);
        this.tracker.updateRuntime(config, apiClient, queue);
        this.rewardClaimService.updateRuntime(config, apiClient);
        LOGGER.info("IVRM Minecraft Activity config reloaded for server_id={}", config.server.id);
    }

    public void flushQueue() {
        queue.flush(apiClient);
    }

    public void listRewards(ServerPlayerEntity player) {
        rewardClaimService.listPendingRewards(player);
    }

    public void claimRewards(ServerPlayerEntity player, boolean claimAll) {
        rewardClaimService.claimRewards(player, claimAll);
    }
}
