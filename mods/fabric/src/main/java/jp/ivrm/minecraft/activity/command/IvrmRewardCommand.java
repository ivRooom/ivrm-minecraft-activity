package jp.ivrm.minecraft.activity.command;

import com.mojang.brigadier.CommandDispatcher;
import jp.ivrm.minecraft.activity.IvrmMinecraftActivityMod;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

import static net.minecraft.server.command.CommandManager.literal;

public final class IvrmRewardCommand {
    private IvrmRewardCommand() {
    }

    public static void register(IvrmMinecraftActivityMod mod) {
        CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> register(dispatcher, mod));
    }

    private static void register(CommandDispatcher<ServerCommandSource> dispatcher, IvrmMinecraftActivityMod mod) {
        dispatcher.register(literal("ivrm")
                .then(literal("rewards")
                        .executes(context -> {
                            ServerPlayerEntity player = context.getSource().getPlayer();
                            mod.listRewards(player);
                            return 1;
                        })
                        .then(literal("claim")
                                .executes(context -> {
                                    ServerPlayerEntity player = context.getSource().getPlayer();
                                    mod.claimRewards(player, false);
                                    return 1;
                                })
                                .then(literal("all")
                                        .executes(context -> {
                                            ServerPlayerEntity player = context.getSource().getPlayer();
                                            mod.claimRewards(player, true);
                                            return 1;
                                        })))))
                .then(literal("reward-help")
                        .executes(context -> {
                            context.getSource().sendFeedback(() -> Text.literal("/ivrm rewards, /ivrm rewards claim, /ivrm rewards claim all"), false);
                            return 1;
                        })));
    }
}
