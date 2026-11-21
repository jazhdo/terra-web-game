package mc.jazhdo;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.caoccao.javet.swc4j.Swc4j;
import com.caoccao.javet.swc4j.enums.Swc4jMediaType;
import com.caoccao.javet.swc4j.exceptions.Swc4jCoreException;
import com.caoccao.javet.swc4j.options.Swc4jTranspileOptions;

import io.javalin.Javalin;
import io.javalin.http.Header;

public class Main {
    private static final ClassLoader classLoader = Main.class.getClassLoader();
    private static final Path root = Path.of("");
    private static final Path resourcePath = root.resolve("src/main/resources");
    private static final Logger log = LoggerFactory.getLogger(Main.class);
    private static final boolean DEBUG = System.getenv("DEBUG").equals("TRUE");

    private static byte[] getLivePage(String page) {
        try {
            return switch (page) {
                case "index.html" -> Files.readAllBytes(resourcePath.resolve("index.html"));
                case "script.ts" -> ts2js(Files.readAllBytes(resourcePath.resolve("script.ts")));
                default -> new byte[0];
            };
        } catch (IOException ex) {
            log.error("Error loading page {}. Error: {}", page, ex.getMessage());
            return new byte[0];
        }
    }

    private static byte[] ts2js(byte[] typescript) throws IOException {
        try {
            return (new Swc4j().transpile(new String(typescript, StandardCharsets.UTF_8), new Swc4jTranspileOptions().setMediaType(Swc4jMediaType.TypeScript).setInlineSources(false))).getCode().getBytes();
        } catch (Swc4jCoreException ex) {
            throw new IOException(ex.getMessage(), ex.getCause());
        }
    }

    @SuppressWarnings("CallToPrintStackTrace")
    public static void main(String[] args) {
        HashMap<String, byte[]> preloadedPages = new HashMap<>();
        if (DEBUG) log.info("Debug mode on. Pages are loaded on demand from the src/ folder.");
        else {
            log.info("Preloading important pages...");

            // Preload index page
            try {
                preloadedPages.put("index.html", classLoader.getResourceAsStream("index.html").readAllBytes());
            } catch (IOException ex) {
                ex.printStackTrace();
                log.error("An IOException occurred while preloading the index page. Error: {}", ex.getMessage());
                System.exit(500);
                return;
            }

            // Convert typescript scripts to runnable javascript
            try {
                preloadedPages.put("script.ts", ts2js(classLoader.getResourceAsStream("script.ts").readAllBytes()));
            } catch (IOException ex) {
                ex.printStackTrace();
                log.error("An Swc4jCoreException or IOException occurred while converting typescript scripts to javascript. Error: {}", ex.getMessage());
                System.exit(500);
                return;
            }

            log.info("Preload done.");
        }
        log.info("Startin Javalin web server...");

        Javalin webServer = Javalin.create(config -> {
            config.routes.before(ctx -> log.info("Recieved request to " + ctx.path()));
            config.routes.get("/", ctx -> {
                byte[] page = DEBUG ? getLivePage("index.html") : preloadedPages.get("index.html");
                ctx.contentType("text/html");
                ctx.header(Header.CONTENT_LENGTH, Integer.toString(page.length));
                ctx.result(page);
            });
            config.routes.get("/script.ts", ctx -> {
                byte[] page = DEBUG ? getLivePage("script.ts") : preloadedPages.get("script.ts");
                ctx.contentType("text/javascript");
                ctx.header(Header.CONTENT_LENGTH, Integer.toString(page.length));
                ctx.result(page);
            });
        });

        String definedPort = System.getenv("PORT");
        if (definedPort != null) webServer.start(Integer.parseInt(definedPort));
        else webServer.start();

        log.info("Javalin web server started.");
    }
}