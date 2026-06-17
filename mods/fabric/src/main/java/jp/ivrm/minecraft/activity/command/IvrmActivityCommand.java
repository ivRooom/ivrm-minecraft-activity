package jp.ivrm.minecraft.activity.command;

import com.mojang.brigadier.CommandDispatcher;
import jp.ivrm.minecraft.activity.IvrmMinecraftActivityMod;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.text.Text;

import static net.minecraft.server.command.CommandManager.literal;

public final class IvrmActivityCommand {
    private IvrmActivityCommand() {
    }

    public static void register(IvrmMinecraftActivityMod mod) {
        CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> register(dispatcher, mod));
    }

    private static void register(CommandDispatcher<ServerCommandSource> dispatcher, IvrmMinecraftActivityMod mod) {
        dispatcher.register(literal("ivrm")
                .then(literal("status")
                        .executes(context -> {
                            context.getSource().sendFeedback(() -> Text.literal(
                                    "IVRM Activity: enabled server_id=" + mod.config().server.id
                            ), false);
                            return 1;
                        }))
                .then(literal("admin")
                        .requires(source -> source.hasPermissionLevel(4))
                        .then(literal("reload")
                                .executes(context -> {
                                    mod.reloadConfig();
                                    context.getSource().sendFeedback(() -> Text.literal("IVRM Activity config reloaded."), true);
                                    return 1;
                                }))
                        .then(literal("flush")
                                .executes(context -> {
                                    mod.flushQueue();
                                    context.getSource().sendFeedback(() -> Text.literal("IVRM Activity queue flush requested."), true);
                                    return 1;
                                }))));
    }
}
