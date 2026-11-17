export {}

// Creation of the canvas
const canvas = document.createElement("canvas");
document.body.append(canvas);

let error = false;

abstract class Node {
    protected x: number;
    protected y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public getX() {
        return this.x;
    }

    public getY() {
        return this.y;
    }

    public abstract draw(ctx: CanvasRenderingContext2D): void;
}

type Size = {
    x: number,
    y: number
}

class Rect extends Node {
    protected bg: Color;
    protected size: Size;

    constructor(x: number, y: number, size: Size, bg: Color) {
        super(x, y);
        this.size = size;
        this.bg = bg;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.bg.toString();
        ctx.fillRect(this.x, this.y, this.size.x, this.size.y);
    }
}

class GradientRect extends Node {
    protected gradient: CanvasGradient;
    protected size: Size;

    constructor(x: number, y: number, size: Size, gradient: CanvasGradient) {
        super(x, y);
        this.size = size;
        this.gradient = gradient;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.gradient;
        ctx.fillRect(this.x, this.y, this.size.x, this.size.y);
    }
}

class Color {
    private value: string;

    constructor(value: string) {
        this.value = value;
    }

    public static ofHex(hex: string) {
        return new this(hex);
    }

    public static ofHSL(hue: number, saturation: number, lightness: number, alpha?: number) {
        return new this("hsl(" + hue.toString() + ", " + (saturation / 100).toString() + ", " + (lightness / 100).toString() + ", " + (alpha !== undefined ? alpha.toString() : "1") + ")");
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

    constructor(x: number, y: number, content: string, color: Color, fontSize: number, fontFamily: string, maxWidth?: number) {
        super(x, y);
        this.content = content;
        this.color = color;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.maxWidth = maxWidth;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.font = this.fontSize.toString() + "px " + this.fontFamily;
        ctx.fillStyle = this.color.toString();
        ctx.fillText(this.content, this.x, this.y, this.maxWidth);
    }
}

type Coordinate = {
    x: number,
    y: number
}

class Line extends Node {
    protected end: Coordinate;
    protected color: Color;
    protected lineWidth: number;

    constructor(start: Coordinate, end: Coordinate, color: Color = Color.ofHex("#000"), lineWidth: number = 1) {
        super(start.x, start.y);
        this.end = end;
        this.color = color;
        this.lineWidth = lineWidth;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.strokeStyle = this.color.toString();
        ctx.lineWidth = this.lineWidth;
        ctx.stroke();
    }
}

// Note: Border is on the edge of the circle, not outside of the circle
class Circle extends Node {
    protected radius: number;
    protected fill: Color;
    protected borderWidth: number;
    protected borderColor: Color;

    constructor(center: Coordinate, radius: number, fill: Color, borderWidth: number = 0, borderColor: Color = Color.ofHex("#000")) {
        super(center.x, center.y);
        this.radius = radius;
        this.fill = fill;
        this.borderWidth = borderWidth;
        this.borderColor = borderColor;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.fill.toString();
        ctx.fill();
        if (this.borderWidth > 0) {
            ctx.lineWidth = this.borderWidth;
            ctx.strokeStyle = this.borderColor.toString();
            ctx.stroke();
        }
    }
}

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const WIDTH = 1280, HEIGHT = 720;

const scenes: Node[][][] = [
    [
        [
            new Rect(0, 0, {x: WIDTH, y: HEIGHT}, Color.ofHex("#888"))
        ],
        [
            new Text(0, 360, "TEST", Color.ofHex("#000"), 360, "Arial")
        ],
        [
            new Circle({x: 640, y: 360}, 300, Color.ofHex("#00ff00"))
        ]
    ],
    [
        [

        ]
    ],
    [
        [

        ]
    ],
];
let currentLayer = 0;

function start(): void {
    canvas.height = HEIGHT;
    canvas.width = WIDTH;

    if (error === true) {
        console.error("An error occurred during startup, exiting...");
        return;
    }

    ctx.save();
    requestAnimationFrame(renderScreen);
}

function renderScreen(): void {
    ctx.restore();
    ctx.save();

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    scenes[currentLayer].forEach((layer: Node[]) => layer.forEach((node: Node) => {
        node.draw(ctx)
    }));

    requestAnimationFrame(renderScreen);
}

start();

/* 
Notes
- Either ctx.stroke() or ctx.fill() is required to make stuff appear on the screen, otherwise only the calculations are made

*/