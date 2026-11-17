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
    protected bg: CanvasPattern;
    protected size: Size;

    constructor(x: number, y: number, size: Size, bg: CanvasPattern) {
        super(x, y);
        this.size = size;
        this.bg = bg;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.bg;
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

class Text extends Node {
    protected content: string;
    protected maxWidth?: number;

    constructor(x: number, y: number, content: string, maxWidth?: number) {
        super(x, y);
        this.content = content;
        this.maxWidth = maxWidth;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.fillText(this.content, this.x, this.y, this.maxWidth);
    }
}

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const WIDTH = 640, HEIGHT = 360;

const scenes: Node[][][] = [
    [
        [
            new Text(320, 180, "TEST")
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

    requestAnimationFrame(renderScreen);
}

function renderScreen(): void {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    scenes[currentLayer].forEach((layer: Node[]) => layer.forEach((node: Node) => node.draw(ctx)));

    requestAnimationFrame(renderScreen);
}

start();