export {}

// Creation of the canvas
const canvas = document.createElement("canvas");
document.body.append(canvas);

let error = false;

abstract class Node {
    protected loc: Coordinate;
    private onclickFunction?: (node: Node) => void;
    private onhoverFunction?: (node: Node) => void;
    private onunhoverFunction?: (node: Node) => void;

    constructor(loc: Coordinate) {
        this.loc = loc;
    }

    public getX() {
        return this.loc.x;
    }

    public getY() {
        return this.loc.y;
    }

    public onclick(lambdaFunction: (node: Node) => void) {
        this.onclickFunction = lambdaFunction;
    }
    public onhover(lambdaFunction: (node: Node) => void) {
        this.onhoverFunction = lambdaFunction;
    }
    public onunhover(lambdaFunction: (node: Node) => void) {
        this.onunhoverFunction = lambdaFunction;
    }

    public abstract draw(ctx: CanvasRenderingContext2D): void;
    public abstract contains(point: Coordinate): boolean;
}

type Size = {
    x: number,
    y: number
}

class Rect extends Node {
    protected bg: Color;
    protected size: Size;

    constructor(topRightCorner: Coordinate, size: Size, bg: Color) {
        super(topRightCorner);
        this.size = size;
        this.bg = bg;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.bg.toString();
        ctx.fillRect(this.loc.x, this.loc.y, this.size.x, this.size.y);
    }

    public contains(point: Coordinate) {
        return pointWithinRect(point, this.loc, {x: this.loc.x + this.size.x, y: this.loc.y + this.size.y});
    }
}

function pointWithinRect(point: Coordinate, rectStart: Coordinate, rectEnd: Coordinate) {
    const startX = Math.min(rectStart.x, rectEnd.x), startY = Math.min(rectStart.y, rectEnd.y);
    const endX = Math.max(rectStart.x, rectEnd.x), endY = Math.max(rectStart.y, rectEnd.y);
    return point.x >= startX && point.x <= endX && point.y >= startY && point.y <= endY;
}

class GradientRect extends Node {
    protected gradient: CanvasGradient;
    protected size: Size;

    constructor(topRightCorner: Coordinate, size: Size, gradient: CanvasGradient) {
        super(topRightCorner);
        this.size = size;
        this.gradient = gradient;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.gradient;
        ctx.fillRect(this.loc.x, this.loc.y, this.size.x, this.size.y);
    }

    public contains(point: Coordinate) {
        return pointWithinRect(point, this.loc, {x: this.loc.x + this.size.x, y: this.loc.y + this.size.y});
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

    constructor(bottomRightCorner: Coordinate, content: string, color: Color, fontSize: number, fontFamily: string, maxWidth?: number) {
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

    constructor(start: Coordinate, end: Coordinate, color: Color = Color.ofHex("#000"), lineCap: CanvasLineCap = "butt", lineWidth: number = 1) {
        super(start);
        this.end = end;
        this.color = color;
        this.lineCap = lineCap;
        this.lineWidth = lineWidth;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.moveTo(this.loc.x, this.loc.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.strokeStyle = this.color.toString();
        ctx.lineWidth = this.lineWidth;
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

    constructor(center: Coordinate, radius: number, fill: Color, borderWidth: number = 0, borderColor: Color = Color.ofHex("#000")) {
        super(center);
        this.radius = radius;
        this.fill = fill;
        this.borderWidth = borderWidth;
        this.borderColor = borderColor;
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
        return Math.sqrt(((point.x - this.loc.x) ** 2) + ((point.y - this.loc.y) ** 2)) <= (this.radius + (this.borderWidth / 2));
    }
}

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const WIDTH = 1280, HEIGHT = 720;

const scenes: Node[][] = [
    [
        new Rect({x: 0, y: 0}, {x: WIDTH, y: HEIGHT}, Color.ofHex("#888")),
        new Text({x: 0, y: 360}, "TEST", Color.ofHex("#000"), 360, "Arial"),
        new Circle({x: 640, y: 360}, 300, Color.ofHex("#00ff00")),
        new Line({x: 10, y: 10}, {x: WIDTH - 10, y: HEIGHT - 10}, Color.ofHex("#000"), "butt", 5)
    ]
];
let currentLayer = 0;

function start(): void {
    canvas.height = HEIGHT;
    canvas.width = WIDTH;
    canvas.onclick = onclick;
    canvas.onmousemove = onmousemove;

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

    scenes[currentLayer].forEach((node: Node) => {
        node.draw(ctx);
    });

    requestAnimationFrame(renderScreen);
}

// Listeners
function onclick(): void {
    scenes[currentLayer].toReversed().forEach((node: Node) => {
        
    });
}
function onmousemove(): void {

}

start();

/*
TODO: 
Add hover, unhover, and click listeners.
For click, just use a to-be-made getMousePosition or smth function and then check each one (later elements are rendered on top)
For hover, use a list of Nodes that are hovered and run it once when they are added
For unhover, use the above list of Nodes but run when it is no longer hovered.
For the previous two, maybe just use one variable instead of a list because only the topmost element should recieve the hover so there's only one element to attribute the hover to

*/

/* 
Notes
- Either ctx.stroke() or ctx.fill() is required to make stuff appear on the screen, otherwise only the calculations are made

*/