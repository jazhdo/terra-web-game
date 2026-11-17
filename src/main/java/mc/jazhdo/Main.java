package mc.jazhdo;

import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

import io.javalin.Javalin;
import io.javalin.http.Header;

public class Main {
    private static final ClassLoader classLoader = Main.class.getClassLoader();
    private static final Logger log = Logger.getLogger("WebGame");

    @SuppressWarnings("CallToPrintStackTrace")
    public static void main(String[] args) {
        log.info("Preloading important pages...");
        byte[] indexPage;
        try {
            indexPage = classLoader.getResourceAsStream("index.html").readAllBytes();
        } catch (IOException ex) {
            ex.printStackTrace();
            log.log(Level.WARNING, "An IOException occurred while preloading the index page. Error: {0}", ex.getMessage());
            System.exit(500);
            return;
        }

        Javalin webServer = Javalin.create(config -> {
            config.routes.get("/", ctx -> {
                ctx.contentType("text/html");
                ctx.header(Header.CONTENT_LENGTH, Integer.toString(indexPage.length));
                ctx.result(indexPage);
            });
        });

        String definedPort = System.getenv("PORT");
        if (definedPort != null) webServer.start(Integer.parseInt(definedPort));
        else webServer.start();
    }
}