package mc.jazhdo;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.caoccao.javet.swc4j.Swc4j;
import com.caoccao.javet.swc4j.enums.Swc4jMediaType;
import com.caoccao.javet.swc4j.exceptions.Swc4jCoreException;
import com.caoccao.javet.swc4j.options.Swc4jTranspileOptions;
import com.caoccao.javet.swc4j.outputs.Swc4jTranspileOutput;

import io.javalin.Javalin;
import io.javalin.http.Header;

public class Main {
    private static final ClassLoader classLoader = Main.class.getClassLoader();
    private static final Logger log = LoggerFactory.getLogger(Main.class);

    @SuppressWarnings("CallToPrintStackTrace")
    public static void main(String[] args) {
        log.info("Preloading important pages...");

        // Preload index page
        byte[] indexPage;
        try {
            indexPage = classLoader.getResourceAsStream("index.html").readAllBytes();
        } catch (IOException ex) {
            ex.printStackTrace();
            log.error("An IOException occurred while preloading the index page. Error: {}", ex.getMessage());
            System.exit(500);
            return;
        }

        // Convert typescript scripts to runnable javascript
        byte[] scriptFile;
        try {
            Swc4jTranspileOutput output = (new Swc4j().transpile(new String(classLoader.getResourceAsStream("script.ts").readAllBytes(), StandardCharsets.UTF_8), new Swc4jTranspileOptions().setMediaType(Swc4jMediaType.TypeScript).setInlineSources(false)));
            scriptFile = output.getCode().getBytes();
        } catch (Swc4jCoreException | IOException ex) {
            ex.printStackTrace();
            log.error("An Swc4jCoreException or IOException occurred while converting typescript scripts to javascript. Error: {}", ex.getMessage());
            System.exit(500);
            return;
        }

        log.info("Preload done. Startin Javalin web server...");

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

        log.info("Javalin web server started.");
    }
}