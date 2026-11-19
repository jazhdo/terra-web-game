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
        velocity: 0,
        acceleration: 9.8,
        onGround: true
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
    velocity: number,
    acceleration: number,
    onGround: boolean
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

    constructor(bottomRightCorner: Coordinate, content: string, color: Color, fontSize: number, fontFamily: string = "sans-serif", maxWidth?: number) {
        super(bottomRightCorner);
        this.content = content;
        this.color = color;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.maxWidth = maxWidth;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.font = this.fontSize.toString() + "px " + this.fontFamily;
        ctx.fillStyle = this.color.toString();
        ctx.fillText(this.content, this.loc.x, this.loc.y, this.maxWidth);
    }

    public contains(point: Coordinate) {
        // Until it is found out how to figure out the bounds of the box
        return equalCoordinates(this.loc, point);
    }
}

type Coordinate = {
    x: number,
    y: number
}

function equalCoordinates(first: Coordinate, second: Coordinate) {
    return first.x === second.x && first.y === second.y;
}

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
    PLAYER: {
        SPEED: 20,
        JUMP_HEIGHT: -70
    },
    INPUT_MAP: {
        "up": [
            "KeyW",
            "ArrowUp",
            "Space"
        ],
        "right": [
            "KeyD",
            "ArrowRight"
        ],
        "down": [
            "KeyS",
            "ArrowDown",
        ],
        "left": [
            "KeyA",
            "ArrowLeft"
        ]
    }
}

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const SCENES: Node[][] = [
    // Menu
    [
        // Background
        new Rect({x: 0, y: 0}, {x: CONFIG.WIDTH, y: CONFIG.HEIGHT}, Color.of("#a6a6a6")),
        new Text({x: 20, y: 150}, "A Web Game", Color.of("#000000"), 80),
        new Text({x: 24, y: 183}, "Made by Jazhdo", Color.of("#000"), 30),

    ],
    [
        // Front
        new Circle({x: 590, y: 310}, 50, Color.of("#0f9369")),
        new RoundRect({x: 0, y: 550}, {x: CONFIG.WIDTH, y: 70}, Color.of("#afbc4f"), 35)
    ]
];
type inputMapping = {
    up?: () => void,
    right?: () => void,
    down?: () => void,
    left?: () => void
}
const SCENE_INPUTS: inputMapping[] = [
    {
        up: () => {
            
        },
        down: () => {

        }
    },
    {
        up: () => {
            // Jump
            const player = tmp.scenes[1][1];
            if (player.physics.onGround) player.physics.velocity = CONFIG.PLAYER.JUMP_HEIGHT;
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
    document.onkeydown = (ev: KeyboardEvent) => {
        for (const [key, array] of Object.entries(CONFIG.INPUT_MAP)) if (array.includes(ev.code)) tmp.keysDown.add(key);
    };
    document.onkeyup = (ev: KeyboardEvent) => {
        for (const [key, array] of Object.entries(CONFIG.INPUT_MAP)) if (array.includes(ev.code)) tmp.keysDown.delete(key);
    };

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

    // Physics (ground is on y500)
    const player = tmp.scenes[1][1]
    player.physics.onGround = player.getY() >= 500;
    if (!player.physics.onGround) {
        player.physics.velocity += player.physics.acceleration;
    }
    player.setY(Math.min(500, player.getY() + player.physics.velocity));

    // Render
    ctx.restore();
    ctx.save();
    ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    tmp.scenes[tmp.currentScene].forEach((node: Node) => node.draw(ctx));

    // Next frame
    requestAnimationFrame(renderScreen);
}

function newScene(scene: number) {
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
                if (node.onhover !== undefined) node.onhover();
                if (currentlyHovered !== null && currentlyHovered.onunhover !== undefined) currentlyHovered.onunhover();
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
Make more sophiscticated physics engine, config class, PhysicsDetails or smth class etc.
Make GRAVITY!!!

*/

/* 
Notes
- Either ctx.stroke() or ctx.fill() is required to make stuff appear on the screen, otherwise only the calculations are made

*/