package mc.jazhdo;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.logging.Level;
import java.util.logging.Logger;

import io.javalin.Javalin;
import io.javalin.http.Header;
import io.mvnpm.esbuild.Bundler;
import io.mvnpm.esbuild.model.BundleOptions;

public class Main {
    private static final ClassLoader classLoader = Main.class.getClassLoader();
    private static final Logger log = Logger.getLogger("WebGame");
    private static final Path currentDir = Path.of("");

    @SuppressWarnings("CallToPrintStackTrace")
    public static void main(String[] args) {
        log.info("Preloading important pages...");

        // Preload index page
        byte[] indexPage;
        try {
            indexPage = classLoader.getResourceAsStream("index.html").readAllBytes();
        } catch (IOException ex) {
            ex.printStackTrace();
            log.log(Level.WARNING, "An IOException occurred while preloading the index page. Error: {0}", ex.getMessage());
            System.exit(500);
            return;
        }

        // Convert typescript scripts to runnable javascript
        byte[] scriptFile;
        try {
            Path tempScriptPath = currentDir.resolve("temp_script.ts");
            Files.copy(classLoader.getResourceAsStream("script.ts"), tempScriptPath, StandardCopyOption.REPLACE_EXISTING);
            Bundler.bundle(BundleOptions.builder().addEntryPoint(tempScriptPath).build(), false);
            scriptFile = Files.readAllBytes(currentDir.resolve("temp_script.js"));
        } catch (IOException ex) {
            ex.printStackTrace();
            log.log(Level.WARNING, "An IOException occurred while converting typescript scripts to javascript. Error: {0}", ex.getMessage());
            System.exit(500);
            return;
        }

        Javalin webServer = Javalin.create(config -> {
            config.routes.get("/", ctx -> {
                ctx.contentType("text/html");
                ctx.header(Header.CONTENT_LENGTH, Integer.toString(indexPage.length));
                ctx.result(indexPage);
            });
            config.routes.get("/script.ts", ctx -> {
                ctx.contentType("text/javascript");
                ctx.header(Header.CONTENT_LENGTH, Integer.toString(scriptFile.length));
                ctx.result(scriptFile);
            });
        });

        String definedPort = System.getenv("PORT");
        if (definedPort != null) webServer.start(Integer.parseInt(definedPort));
        else webServer.start();
    }
}