export {}

// Creation of the canvas
const main = document.getElementsByTagName("main")[0];
const canvas = document.createElement("canvas");
main.append(canvas);

let error = false;

abstract class Node {
    protected loc: Coordinate;
    public onclick?: () => void;
    public onhover?: () => void;
    public onunhover?: () => void;
    public collide = false;
    public physics: PhysicsProperties = {
        y: {
            velocity: 0,
            acceleration: CONFIG.GRAVITY
        }
    }

    constructor(loc: Coordinate) {
        this.loc = loc;
    }

    public getLoc() {
        return this.loc;
    }

    public getX() {
        return this.loc.x;
    }
    
    public getY() {
        return this.loc.y;
    }

    public setLoc(newLoc: Coordinate) {
        this.loc = newLoc;
    }

    public setX(newX: number) {
        this.loc.x = newX;
    }

    public setY(newY: number) {
        this.loc.y = newY;
    }

    // Collisions
    public setCollide(newCollide: boolean) {
        this.collide = newCollide;
    }
    public checkCollide() {
        const currentScene = tmp.scenes[tmp.currentScene];
        for (const node of currentScene) {
            // TODO: Add collision checking
        }
    }

    public setonclick(lambda: (node: this) => void) {
        this.onclick = () => lambda(this);
        return this;
    }
    public setonhover(lambda: (node: this) => void) {
        this.onhover = () => lambda(this);
        return this;
    }
    public setonunhover(lambda: (node: this) => void) {
        this.onunhover = () => lambda(this);
        return this;
    }

    public abstract draw(ctx: CanvasRenderingContext2D): void;
    public abstract contains(point: Coordinate): boolean;
}

type Size = {
    x: number,
    y: number
}

type PhysicsProperties = {
    y: {
        velocity: number,
        acceleration: number
    }
}

class Rect extends Node {
    protected backgroundColor: Color;
    protected size: Size;
    protected borderWidth: number;
    protected borderColor: Color;

    constructor(topRightCorner: Coordinate, size: Size, backgroundColor: Color, borderWidth: number = 0, borderColor: Color = Color.of("#000")) {
        super(topRightCorner);
        this.size = size;
        this.backgroundColor = backgroundColor;
        this.borderWidth = borderWidth;
        this.borderColor = borderColor;
    }

    public setTopRightCorner(newCorner: Coordinate) {
        this.loc = newCorner;
    }

    public setSize(newSize: Size) {
        this.size = newSize;
    }

    public setBackgroundColor(newBackgroundColor: Color) {
        this.backgroundColor = newBackgroundColor;
    }

    public setBorderWidth(newBorderWidth: number) {
        this.borderWidth = newBorderWidth;
    }

    public setBorderColor(newBorderColor: Color) {
        this.borderColor = newBorderColor;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.backgroundColor.toString();
        if (this.borderWidth > 0) {
            ctx.strokeStyle = this.borderColor.toString();
            ctx.lineWidth = this.borderWidth;
        }
        ctx.fillRect(this.loc.x, this.loc.y, this.size.x, this.size.y);
    }

    public contains(point: Coordinate) {
        return pointWithinRect(point, {x: this.loc.x - (this.borderWidth / 2), y: this.loc.y - (this.borderWidth / 2)}, {x: this.loc.x + this.size.x + (this.borderWidth / 2), y: this.loc.y + this.size.y + (this.borderWidth / 2)});
    }
}

function pointWithinRect(point: Coordinate, rectStart: Coordinate, rectEnd: Coordinate) {
    const startX = Math.min(rectStart.x, rectEnd.x), startY = Math.min(rectStart.y, rectEnd.y);
    const endX = Math.max(rectStart.x, rectEnd.x), endY = Math.max(rectStart.y, rectEnd.y);
    return point.x >= startX && point.x <= endX && point.y >= startY && point.y <= endY;
}

class GradientRect extends Rect {
    protected gradient: CanvasGradient;

    constructor(topRightCorner: Coordinate, size: Size, gradient: CanvasGradient) {
        super(topRightCorner, size, Color.of(""));
        this.gradient = gradient;
    }

    /**
     * Disabled.
     */
    public override setBackgroundColor(newBackgroundColor: Color): void {}

    public setGradient(newGradient: CanvasGradient) {
        this.gradient = newGradient;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.gradient;
        ctx.fillRect(this.loc.x, this.loc.y, this.size.x, this.size.y);
    }
}

class RoundRect extends Rect {
    protected borderRadius: number;

    constructor(topRightCorner: Coordinate, size: Size, backgroundColor: Color, borderRadius: number, borderWidth?: number, borderColor?: Color) {
        super(topRightCorner, size, backgroundColor, borderWidth, borderColor);
        this.borderRadius = borderRadius;
    }

    public setBorderRadius(newBorderRadius: number) {
        this.borderRadius = newBorderRadius;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.fillStyle = this.backgroundColor.toString();
        if (this.borderWidth > 0) {
            ctx.strokeStyle = this.borderColor.toString();
            ctx.lineWidth = this.borderWidth;
        }
        ctx.roundRect(this.loc.x, this.loc.y, this.size.x, this.size.y, this.borderRadius);
        ctx.fill();
    }

    public contains(point: Coordinate) {
        const circleRadius2Check = this.borderRadius + (this.borderWidth / 2);
        return (
            pointWithinCircle(point, {x: this.loc.x + this.borderRadius, y: this.loc.y + this.borderRadius}, circleRadius2Check) ||
            pointWithinCircle(point, {x: this.loc.x + this.size.x - this.borderRadius, y: this.loc.y + this.borderRadius}, circleRadius2Check) ||
            pointWithinCircle(point, {x: this.loc.x + this.size.x - this.borderRadius, y: this.loc.y + this.size.y - this.borderRadius}, circleRadius2Check) ||
            pointWithinCircle(point, {x: this.loc.x + this.borderRadius, y: this.loc.y + this.size.y - this.borderRadius}, circleRadius2Check) ||

            pointWithinRect(point, {x: this.loc.x + this.borderRadius, y: this.loc.y - (this.borderWidth / 2)}, {x: this.loc.x + this.size.x - this.borderRadius, y: this.loc.y + this.borderRadius}) ||
            pointWithinRect(point, {x: this.loc.x + this.borderRadius, y: this.loc.y + this.size.y - this.borderRadius}, {x: this.loc.x + this.size.x - this.borderRadius, y: this.loc.y + this.size.y + (this.borderWidth / 2)}) ||

            pointWithinRect(point, {x: this.loc.x - (this.borderWidth / 2), y: this.loc.y + this.borderRadius}, {x: this.loc.x + this.size.x + (this.borderWidth / 2), y: this.loc.y + this.size.y - this.borderRadius})
        )
    }
}

class Color {
    private value: string;

    constructor(value: string) {
        this.value = value;
    }

    public static of(hex: string) {
        return new this(hex);
    }

    public static ofHSLA(hue: number, saturation: number, lightness: number, alpha?: number) {
        return new this("hsla(" + hue.toString() + ", " + (saturation / 100).toString() + ", " + (lightness / 100).toString() + ", " + (alpha !== undefined ? alpha.toString() : "1") + ")");
    }

    public toString() {
        return this.value;
    }
}

class Text extends Node {
    protected content: string;
    protected maxWidth?: number;
    protected color: Color;
    protected fontSize: number;
    protected fontFamily: string;

    constructor(bottomLeftCorner: Coordinate, content: string, color: Color, fontSize: number, fontFamily: string = "sans-serif", maxWidth?: number) {
        super(bottomLeftCorner);
        this.content = content;
        this.color = color;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.maxWidth = maxWidth;
    }

    public getContent() {
        return this.content;
    }
    public getColor() {
        return this.color;
    }
    public getFontSize() {
        return this.fontSize;
    }
    public getFontFamily() {
        return this.fontFamily;
    }
    public getMaxWidth() {
        return this.maxWidth;
    }

    public setContent(newContent: string) {
        this.content = newContent;
    }
    public setColor(newColor: Color) {
        this.color = newColor;
    }
    public setFontSize(newFontSize: number) {
        this.fontSize = newFontSize;
    }
    public setFontFamily(newFontFamily: string) {
        this.fontFamily = newFontFamily;
    }
    public setMaxWidth(newMaxWidth: number) {
        this.maxWidth = newMaxWidth;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.font = this.fontSize.toString() + "px " + this.fontFamily;
        ctx.fillStyle = this.color.toString();
        ctx.fillText(this.content, this.loc.x, this.loc.y, this.maxWidth);
    }

    public contains(point: Coordinate) {
        // Until it is found out how to figure out the bounds of the box
        // return equalCoordinates(this.loc, point);
        return false;
    }
}

class Image extends Node {
    protected image: HTMLImageElement;

    constructor(topLeftCorner: Coordinate, imageSrc: string) {
        super(topLeftCorner);
        this.image = document.createElement("img");
        this.image.src = imageSrc;
    }

    public getImage() {
        return this.image;
    }

    public setImage(newImage: HTMLImageElement) {
        this.image = newImage
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.drawImage(this.image, this.loc.x, this.loc.y);
    }

    public contains(point: Coordinate): boolean {
        return pointWithinRect(point, this.loc, {x: this.loc.x + this.image.width, y: this.loc.y + this.image.height});
    }
}

type Coordinate = {
    x: number,
    y: number
}

// function equalCoordinates(first: Coordinate, second: Coordinate) {
//     return first.x === second.x && first.y === second.y;
// }

class Line extends Node {
    protected end: Coordinate;
    protected color: Color;
    protected lineCap: CanvasLineCap;
    protected lineWidth: number;

    constructor(start: Coordinate, end: Coordinate, color: Color = Color.of("#000"), lineCap: CanvasLineCap = "butt", lineWidth: number = 1) {
        super(start);
        this.end = end;
        this.color = color;
        this.lineCap = lineCap;
        this.lineWidth = lineWidth;
    }

    public setEnd(newEnd: Coordinate) {
        this.end = newEnd;
    }
    public setColor(newColor: Color) {
        this.color = newColor;
    }
    public setLineCap(newLineCap: CanvasLineCap) {
        this.lineCap = newLineCap;
    }
    public setLineWidth(newLineWidth: number) {
        this.lineWidth = newLineWidth;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.moveTo(this.loc.x, this.loc.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.strokeStyle = this.color.toString();
        ctx.lineWidth = this.lineWidth;
        ctx.lineCap = this.lineCap;
        ctx.stroke();
    }

    public contains(point: Coordinate) {
        const path = new Path2D();
        path.moveTo(this.loc.x, this.loc.y);
        path.lineTo(this.end.x, this.end.y);
        ctx.save();
        ctx.lineWidth = this.lineWidth;
        ctx.lineCap = this.lineCap;
        const toReturn = ctx.isPointInStroke(path, point.x, point.y);
        ctx.restore();
        return toReturn;
    }
}

// Note: Border is on the edge of the circle, not outside of the circle
class Circle extends Node {
    protected radius: number;
    protected fill: Color;
    protected borderWidth: number;
    protected borderColor: Color;

    constructor(center: Coordinate, radius: number, fill: Color, borderWidth: number = 0, borderColor: Color = Color.of("#000")) {
        super(center);
        this.radius = radius;
        this.fill = fill;
        this.borderWidth = borderWidth;
        this.borderColor = borderColor;
    }

    public getRadius() {
        return this.radius;
    }
    public getFill() {
        return this.fill;
    }
    public getBorderWidth() {
        return this.borderWidth;
    }
    public getBorderColor() {
        return this.borderColor;
    }

    public setRadius(newRadius: number) {
        this.radius = newRadius;
    }
    public setFill(newFill: Color) {
        this.fill = newFill;
    }
    public setBorderWidth(newBorderWidth: number) {
        this.borderWidth = newBorderWidth;
    }
    public setBorderColor(newBorderColor: Color) {
        this.borderColor = newBorderColor;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.loc.x, this.loc.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.fill.toString();
        ctx.fill();
        if (this.borderWidth > 0) {
            ctx.lineWidth = this.borderWidth;
            ctx.strokeStyle = this.borderColor.toString();
            ctx.stroke();
        }
    }

    public contains(point: Coordinate) {
        return pointWithinCircle(point, this.loc, this.radius + (this.borderWidth / 2));
    }
}

function pointWithinCircle(point: Coordinate, center: Coordinate, radius: number) {
    return Math.sqrt(((point.x - center.x) ** 2) + ((point.y - center.y) ** 2)) <= radius;
}

// THE ONE AND ONLY CONFIG VARIABLE
const CONFIG = {
    WIDTH: 1280,
    HEIGHT: 720,
    CLICK_RATELIMIT_MS_LENGTH: 150,
    PLAYER: {
        SPEED: 20,
        JUMP_HEIGHT: -60
    },
    GRAVITY: 5,
    INPUT_MAP: {
        "up": ["KeyW", "ArrowUp", "Space"],
        "right": ["KeyD", "ArrowRight"],
        "down": ["KeyS", "ArrowDown"],
        "left": ["KeyA", "ArrowLeft"],
        "enter": ["Enter", "Space"]
    }
}

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const SCENES: Node[][] = [
    // Menu
    [
        // Titles
        new Text({x: 24, y: 150}, "A Web Game", Color.of("#000000"), 80),
        new Text({x: 24, y: 183}, "Made by Jazhdo", Color.of("#000"), 30),

        // Options' Hovers
        new Rect({x: 0, y: 317}, {x: 276, y: 90}, Color.of("#00000000")).setonhover(() => scene0refreshOptions(() => 0)),
        new Rect({x: 0, y: 407}, {x: 276, y: 40}, Color.of("#00000000")).setonhover(() => scene0refreshOptions(() => 1)),
        new Rect({x: 0, y: 447}, {x: 276, y: 40}, Color.of("#00000000")).setonhover(() => scene0refreshOptions(() => 2)),
        new Rect({x: 0, y: 487}, {x: 276, y: 90}, Color.of("#00000000")).setonhover(() => scene0refreshOptions(() => 3)),

        // Highlight
        new RoundRect({x: 26, y: 367}, {x: 200, y: 42}, Color.of("#f3dc48b1"), 10).setonclick(scene0clickOption),

        // Options
        new Text({x: 30, y: 400}, "> Play", Color.of("#000"), 32, "monospace"),
        new Text({x: 30, y: 440}, "  Settings", Color.of("#000"), 32, "monospace"),
        new Text({x: 30, y: 480}, "  About", Color.of("#000"), 32, "monospace"),
        new Text({x: 30, y: 520}, "  Credits", Color.of("#000"), 32, "monospace"),
    ],
    [
        // Platform
        new RoundRect({x: 0, y: 550}, {x: CONFIG.WIDTH, y: 70}, Color.of("#afbc4f"), 35),

        // Player
        new Circle({x: 590, y: 310}, 50, Color.of("#0f9369")),
    ]
];
type inputMapping = {
    up?: () => void,
    right?: () => void,
    down?: () => void,
    left?: () => void,
    enter?: () => void
}
function clickRatelimited(): boolean {
    const lastPressed = (tmp.sceneMemory.get("last") || 0) as number, currentTime = Date.now();
    if (currentTime - lastPressed <= CONFIG.CLICK_RATELIMIT_MS_LENGTH) return true;
    tmp.sceneMemory.set("last", currentTime);
    return false
}
function scene0refreshOptions(newOption: (oldOption: number) => number) {
    const oldOption = tmp.sceneMemory.get("currentOption"), currentOption = newOption(oldOption);
    tmp.sceneMemory.set("currentOption", currentOption);
    const oldText = tmp.scenes[tmp.currentScene][7 + oldOption] as Text;
    oldText.setContent(" " + oldText.getContent().substring(1));
    const newText = tmp.scenes[tmp.currentScene][7 + currentOption] as Text;
    newText.setContent(">" + newText.getContent().substring(1));
    tmp.scenes[tmp.currentScene][6].setY((currentOption * 40) + 367);
}
function scene0clickOption() {
    const currentOption = tmp.sceneMemory.get("currentOption");
    if (currentOption === 0) changeScene(1);
    else if (currentOption === 1) scene0menuPopup(0);
}
function scene0menuPopup(menu: number) {
    const popupElements = [
        [
            // Title
            new Text({x: 64, y: 100}, "Settings", Color.of("#000"), 40),

            // Exit button
            new Circle({x: CONFIG.WIDTH - 85, y: 85}, 25, Color.of("#f00")).setonhover((node) => {
                document.body.style.cursor = "pointer";
                node.setFill(Color.of("#f44"))
            }).setonunhover((node) => {
                document.body.style.cursor = "";
                node.setFill(Color.of("#f00"))
            }).setonclick(() => tmp.scenes[0] = tmp.scenes[0].slice(0, -7)),
            new Text({x: CONFIG.WIDTH - 93, y: 96}, "X", Color.of("#000"), 28, "monospace"),

            // Cheats toggle
            new Text({x: 64, y: 140}, "Cheats:", Color.of("#000"), 24, "sans-serif"),
            new Circle({x: 171, y: 131}, 11, localStorage.getItem("setting.cheats") === "true" ? Color.of("#0f0") : Color.of("#f00"), 1, Color.of("#444")).setonclick((node) => {
                const cheats = localStorage.getItem("setting.cheats") === "true";
                localStorage.setItem("setting.cheats", cheats ? "false" : "true");
                node.setFill(Color.of(cheats ? "#f00" : "#0f0"));
            }).setonhover(() => document.body.style.cursor = "pointer").setonunhover(() => document.body.style.cursor = "")
        ]
    ], popupBackground = new Rect({x: 0, y: 0}, {x: CONFIG.WIDTH, y: CONFIG.HEIGHT}, Color.of("#00000088")),
    popup = new RoundRect({x: 40, y: 40}, {x: CONFIG.WIDTH - 80, y: CONFIG.HEIGHT - 80}, Color.of("#dcdcdc"), 40);

    tmp.scenes[0].push(popupBackground, popup, ...popupElements[menu]);
}
const SCENE_INPUTS: inputMapping[] = [
    {
        up: () => {
            if (!clickRatelimited()) scene0refreshOptions((oldOption) => oldOption === 0 ? 3 : oldOption - 1);
        },
        down: () => {
            if (!clickRatelimited()) scene0refreshOptions((oldOption) => oldOption === 3 ? 0 : oldOption + 1);
        },
        enter: () => {
            if (!clickRatelimited()) scene0clickOption();
        }
    },
    {
        up: () => {
            // Jump
            const player = tmp.scenes[1][1];
            if (player.getY() >= 500) {
                console.log("Before Jumping: Player velo: " + player.physics.y.velocity + ", jump height: " + CONFIG.PLAYER.JUMP_HEIGHT);
                player.physics.y.velocity = CONFIG.PLAYER.JUMP_HEIGHT;
                console.log("Jumping: Player velo: " + player.physics.y.velocity + ", jump height: " + CONFIG.PLAYER.JUMP_HEIGHT);
                console.log("Jump player Position: (x: " + player.getX().toString() + ", y: " + player.getY().toString() + ")");
            }
        },
        left: () => {
            const player = tmp.scenes[1][1];
            player.setX(Math.max(50, player.getX() - CONFIG.PLAYER.SPEED));
        },
        right: () => {
            const player = tmp.scenes[1][1];
            player.setX(Math.min(CONFIG.WIDTH - 50, player.getX() + CONFIG.PLAYER.SPEED));
        }
    }
];
const SCENE_INIT: (() => void)[] = [
    () => {
        tmp.sceneMemory.set("currentOption", 0);
        tmp.sceneMemory.set("last", 0);
    }
];
let tmp = {
    scenes: SCENES,
    sceneMemory: new Map<string, any>(),
    currentScene: 0,
    keysDown: new Set<string>()
};

function start(): void {
    canvas.height = CONFIG.HEIGHT;
    canvas.width = CONFIG.WIDTH;
    canvas.onclick = onclick;
    document.onmousemove = onmousemove;
    document.onkeydown = (ev: KeyboardEvent) => Object.entries(CONFIG.INPUT_MAP).forEach((value: [string, string[]]) => value[1].includes(ev.code) && tmp.keysDown.add(value[0]));
    document.onkeyup = (ev: KeyboardEvent) => Object.entries(CONFIG.INPUT_MAP).forEach((value: [string, string[]]) => value[1].includes(ev.code) && tmp.keysDown.delete(value[0]));

    if (error === true) {
        console.error("An error occurred during startup, exiting...");
        return;
    }

    SCENE_INIT[tmp.currentScene]();

    ctx.save();
    requestAnimationFrame(renderScreen);
}

function renderScreen(): void {
    // Inputs
    const currentSceneInputs = SCENE_INPUTS[tmp.currentScene];
    for (const key of tmp.keysDown as Set<keyof inputMapping>) {
        if (key in currentSceneInputs) {
            const keyFunction = currentSceneInputs[key];
            if (keyFunction) keyFunction();
        }
    }

    // Gravity physics (ground is on y500)
    const player = tmp.scenes[1][1];
    if (player.getY() < 500) {
        player.physics.y.velocity += player.physics.y.acceleration;
    } else if (player.getY() > 500) player.setY(500);
    player.setY(Math.min(500, player.getY() + player.physics.y.velocity));
    console.log("Player Position: (x: " + player.getX().toString() + ", y: " + player.getY().toString() + ")");

    // Render
    ctx.restore();
    ctx.save();
    ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    tmp.scenes[tmp.currentScene].forEach((node: Node) => node.draw(ctx));

    // Next frame
    requestAnimationFrame(renderScreen);
}

function changeScene(scene: number) {
    tmp.keysDown = new Set<string>();
    tmp.sceneMemory = new Map<string, any>();
    tmp.currentScene = scene;
}

// Mouse position helpers
function getMousePosition(event: MouseEvent): Coordinate {
    const offsets = canvas.getBoundingClientRect();
    // Calculate mouse position on the canvas's coordinate system and adjust for canvas scale
    return {
        x: Math.floor((event.clientX - offsets.left) * (canvas.width / offsets.width)),
        y: Math.floor((event.clientY - offsets.top) * (canvas.height / offsets.height))
    };
}
// function mousePositionInCanvas(pos: Coordinate): boolean {
//     // Notes: The screen goes from (0 -> WIDTH - 1) on the x and (0 -> HEIGHT - 1) on the y
//     return pos.x >= 0 && pos.y >= 0 && pos.x <= WIDTH - 1 && pos.y <= HEIGHT - 1;
// }

// Listeners
function onclick(this: GlobalEventHandlers, ev: PointerEvent): void {
    const mousePosition = getMousePosition(ev);

    for (const node of tmp.scenes[tmp.currentScene].toReversed()) {
        if (node.contains(mousePosition)) {
            if (node.onclick !== undefined) node.onclick();
            return;
        }
    }
}
let currentlyHovered: Node | null = null;
function onmousemove(this: GlobalEventHandlers, ev: MouseEvent): void {
    const mousePosition = getMousePosition(ev);

    for (const node of tmp.scenes[tmp.currentScene].toReversed()) {
        if (node.contains(mousePosition)) {
            if (currentlyHovered !== node) {
                if (currentlyHovered !== null && currentlyHovered.onunhover !== undefined) currentlyHovered.onunhover();
                if (node.onhover !== undefined) node.onhover();
                currentlyHovered = node;
            }
            return;
        }
    }

    // If mouse is not on any element
    if (currentlyHovered !== null) {
        if (currentlyHovered.onunhover !== undefined) currentlyHovered.onunhover();
        currentlyHovered = null;
    }
}

start();

/*
TODO: 

*/

/* 
Notes
- Either ctx.stroke() or ctx.fill() is required to make stuff appear on the screen, otherwise only the calculations are made

*/