package jp.ivrm.minecraft.activity.config;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jp.ivrm.minecraft.activity.IvrmMinecraftActivityMod;
import net.fabricmc.loader.api.FabricLoader;

import java.io.IOException;
import java.io.Reader;
import java.io.Writer;
import java.nio.file.Files;
import java.nio.file.Path;

public final class ActivityConfig {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Path CONFIG_PATH = FabricLoader.getInstance()
            .getConfigDir()
            .resolve("ivrm-minecraft-activity/config.json");

    public Server server = new Server();
    public Api api = new Api();
    public Heartbeat heartbeat = new Heartbeat();
    public Afk afk = new Afk();
    public Events events = new Events();
    public Rewards rewards = new Rewards();
    public Queue queue = new Queue();
    public Debug debug = new Debug();

    public static ActivityConfig load() {
        try {
            Files.createDirectories(CONFIG_PATH.getParent());
            if (!Files.exists(CONFIG_PATH)) {
                ActivityConfig initial = new ActivityConfig();
                initial.save();
                return initial;
            }

            try (Reader reader = Files.newBufferedReader(CONFIG_PATH)) {
                ActivityConfig loaded = GSON.fromJson(reader, ActivityConfig.class);
                return loaded == null ? new ActivityConfig() : loaded;
            }
        } catch (IOException e) {
            IvrmMinecraftActivityMod.LOGGER.error("Failed to load config. Using defaults.", e);
            return new ActivityConfig();
        }
    }

    public void save() throws IOException {
        Files.createDirectories(CONFIG_PATH.getParent());
        try (Writer writer = Files.newBufferedWriter(CONFIG_PATH)) {
            GSON.toJson(this, writer);
        }
    }

    public Path queuePath() {
        return CONFIG_PATH.getParent().resolve("queue/events.jsonl");
    }

    public static final class Server {
        public String id = "ivrm-craft";
        public String name = "いゔる。ーむ くらふと";
        public String environment = "production";
    }

    public static final class Api {
        public String baseUrl = "https://api.ivrm.jp";
        public String serverSecret = "CHANGE_ME";
        public int timeoutSeconds = 5;
        public boolean retryEnabled = true;
    }

    public static final class Heartbeat {
        public boolean enabled = true;
        public int intervalSeconds = 300;
    }

    public static final class Afk {
        public boolean enabled = true;
        public int thresholdSeconds = 900;
        public boolean excludeFromRanking = true;
    }

    public static final class Events {
        public boolean login = true;
        public boolean logout = true;
        public boolean death = true;
        public boolean advancement = true;
        public boolean chatCount = true;
        public boolean blockPlace = true;
        public boolean blockBreak = true;
        public boolean dimensionTime = true;
    }

    public static final class Rewards {
        public boolean enabled = true;
        public boolean claimCommandEnabled = true;
        public boolean executeCommands = true;
    }

    public static final class Queue {
        public boolean enabled = true;
        public int maxEvents = 10000;
        public int flushIntervalSeconds = 60;
    }

    public static final class Debug {
        public boolean enabled = false;
    }
}
