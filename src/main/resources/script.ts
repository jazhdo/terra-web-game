export {}

// Types
type Size = {
    x: number,
    y: number
}
type PhysicsProperties = {
    enabled: boolean,
    y: {
        velocity: number,
        acceleration: number
    },
    collides: boolean,
    collidable: boolean,
    collidableSurfaces: CollisionSurface[]
}
type Coordinate = {
    x: number,
    y: number
}
function equalCoordinates(one: Coordinate, two: Coordinate) {
    return one.x === two.x && one.y === two.y;
}
type CollisionSurface = {}
type CollisionPlane = CollisionSurface & {
    startPoint: number,
    commonCoordinate: number,
    commonCoordinatePlane: "x" | "y",
    endPoint: number
}
type CollisionCircle = CollisionSurface & {
    center: Coordinate,
    radius: number
}

let error = false;

abstract class Node {
    protected loc: Coordinate;
    public onclick?: () => void;
    public onhover?: () => void;
    public onunhover?: () => void;
    public physics: PhysicsProperties = {
        enabled: false,
        y: {
            velocity: 0,
            acceleration: CONFIG.GRAVITY
        },
        collides: false,
        collidable: false,
        collidableSurfaces: []
    };

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

    public setPhysics(newPhysics: PhysicsProperties) {
        this.physics = newPhysics;
    }
    public setCollides(newCollides: boolean) {
        this.physics.collides = newCollides;
    }
    public setCollidable(newCollidable: boolean) {
        this.physics.collidable = newCollidable;
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
        this.physics.collidableSurfaces = [
            {
                startPoint: this.loc.x,
                commonCoordinate: this.loc.y,
                commonCoordinatePlane: "y",
                endPoint: this.loc.x + this.size.x
            } as CollisionPlane,
            {
                startPoint: this.loc.y,
                commonCoordinate: this.loc.x + this.size.x,
                commonCoordinatePlane: "x",
                endPoint: this.loc.y + this.size.y
            } as CollisionPlane,
            {
                startPoint: this.loc.x,
                commonCoordinate: this.loc.y + this.size.y,
                commonCoordinatePlane: "y",
                endPoint: this.loc.x + this.size.x
            } as CollisionPlane,
            {
                startPoint: this.loc.y,
                commonCoordinate: this.loc.x,
                commonCoordinatePlane: "x",
                endPoint: this.loc.y + this.size.y
            } as CollisionPlane
        ]
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
        this.physics.collidableSurfaces = [
            {
                // Gave up here; just use contains with the four points on the four axises points on the circle player (-x, -y, x, & Y)
            }
        ];
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
        const collidableSurfaceIsX = start.x === end.x;
        this.physics.collidableSurfaces = [
            {
                startPoint: collidableSurfaceIsX ? start.y : start.x,
                commonCoordinate: collidableSurfaceIsX ? start.x : start.y,
                commonCoordinatePlane: collidableSurfaceIsX ? "x" : "y",
                endPoint: collidableSurfaceIsX ? end.y : end.x
            } as CollisionPlane
        ]
    }

    public getEnd() {
        return this.end;
    }
    public getColor() {
        return this.color;
    }
    public getLineCap() {
        return this.lineCap;
    }
    public getLineWidth() {
        return this.lineWidth;
    }

    public setEnd(newEnd: Coordinate) {
        this.end = newEnd;
        return this;
    }
    public setColor(newColor: Color) {
        this.color = newColor;
        return this;
    }
    public setLineCap(newLineCap: CanvasLineCap) {
        this.lineCap = newLineCap;
        return this;
    }
    public setLineWidth(newLineWidth: number) {
        this.lineWidth = newLineWidth;
        return this;
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
type AnimatedProperties = {
    in: boolean,
    start: Coordinate,
    end: Coordinate,
    movesPerTick: number
}
class AnimatedLine extends Line {
    public animated: AnimatedProperties = {
        in: false,
        start: {x: 0, y: 0},
        end: {x: 0, y: 0},
        movesPerTick: 0
    };

    constructor(start: Coordinate, end: Coordinate, color: Color = Color.of("#000"), lineCap: CanvasLineCap = "butt", lineWidth: number = 1) {
        super(start, end, color, lineCap, lineWidth);
    }

    public animate(newStart: Coordinate, newEnd: Coordinate, movesPerTick: number = 1) {
        this.animated.in = true;
        this.animated.start = newStart;
        this.animated.end = newEnd;
        this.animated.movesPerTick = movesPerTick;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        // Animated movement
        if (this.animated.in) {
            this.loc.x += Math.min(this.animated.movesPerTick, this.animated.start.x - this.loc.x);
            this.loc.y += Math.min(this.animated.movesPerTick, this.animated.start.y - this.loc.y);
            this.end.x += Math.min(this.animated.movesPerTick, this.animated.end.x - this.end.x);
            this.end.y += Math.min(this.animated.movesPerTick, this.animated.end.y - this.end.y);
            if (equalCoordinates(this.loc, this.animated.start) && equalCoordinates(this.end, this.animated.end)) this.animated.in = false;
        }

        // Draw function copied from parent
        ctx.beginPath();
        ctx.moveTo(this.loc.x, this.loc.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.strokeStyle = this.color.toString();
        ctx.lineWidth = this.lineWidth;
        ctx.lineCap = this.lineCap;
        ctx.stroke();
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
        this.physics.collidableSurfaces = [
            {
                center: this.loc,
                radius: this.radius
            } as CollisionCircle
        ];
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
        JUMP_HEIGHT: -50
    },
    GRAVITY: 5,
    INPUT_MAP: {
        "up": ["KeyW", "ArrowUp", "Space"],
        "right": ["KeyD", "ArrowRight"],
        "down": ["KeyS", "ArrowDown"],
        "left": ["KeyA", "ArrowLeft"],
        "enter": ["Enter", "Space"]
    },
    INITIAL_SCENE: 0
}

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
        new Circle({x: CONFIG.WIDTH / 2, y: CONFIG.HEIGHT / 2}, 50, Color.of("#0f9369")),

        // Menu toggle
        new RoundRect({x: CONFIG.WIDTH - 80, y: 16}, {x: 64, y: 64}, Color.of("#ccc"), 16),
        new AnimatedLine({x: CONFIG.WIDTH - 66, y: 34}, {x: CONFIG.WIDTH - 30, y: 34}, Color.of("#000"), "round", 4),
        new AnimatedLine({x: CONFIG.WIDTH - 66, y: 48}, {x: CONFIG.WIDTH - 30, y: 48}, Color.of("#000"), "round", 4),
        new AnimatedLine({x: CONFIG.WIDTH - 66, y: 62}, {x: CONFIG.WIDTH - 30, y: 62}, Color.of("#000"), "round", 4),
        new RoundRect({x: CONFIG.WIDTH - 80, y: 16}, {x: 64, y: 64}, Color.of("#00000000"), 16).setonclick((node) => {
            const menuDisplay = [
                // new Rect({x: CONFIG.WIDTH - 80, y: 72}, {x: 64, y: 40}, Color.of("#ccc")),
                new RoundRect({x: CONFIG.WIDTH - 216, y: 80}, {x: 200, y: 80}, Color.of("#ccc"), 32),
                new RoundRect({x: CONFIG.WIDTH - 200, y: 96}, {x: 168, y: 48}, Color.of("#aaa"), 16).setonclick(() => {
                    changeScene(0);
                    if (node.onclick !== undefined) node.onclick();
                }),
                new Text({x: CONFIG.WIDTH - 189, y: 131}, "Main Menu", Color.of("#000"), 29),
            ];

            const opened = (tmp.sceneMemory.get("opened") || false) === true, sc = tmp.scenes[1];
            if (!opened) {
                (sc.at(-4) as AnimatedLine).animate({x: CONFIG.WIDTH - 66, y: 48}, {x: CONFIG.WIDTH - 48, y: 66}, 1);
                (sc.at(-3) as AnimatedLine).animate({x: CONFIG.WIDTH - 48, y: 30}, {x: CONFIG.WIDTH - 48, y: 66}, 1);
                (sc.at(-2) as AnimatedLine).animate({x: CONFIG.WIDTH - 30, y: 48}, {x: CONFIG.WIDTH - 48, y: 66}, 1);
                tmp.scenes[1].push(...menuDisplay);
            } else {
                (sc.at(-4 - menuDisplay.length) as AnimatedLine).animate({x: CONFIG.WIDTH - 66, y: 34}, {x: CONFIG.WIDTH - 30, y: 34}, 1);
                (sc.at(-3 - menuDisplay.length) as AnimatedLine).animate({x: CONFIG.WIDTH - 66, y: 48}, {x: CONFIG.WIDTH - 30, y: 48}, 1);
                (sc.at(-2 - menuDisplay.length) as AnimatedLine).animate({x: CONFIG.WIDTH - 66, y: 62}, {x: CONFIG.WIDTH - 30, y: 62}, 1);
                tmp.scenes[1].splice(7, menuDisplay.length);
            }
            tmp.sceneMemory.set("opened", !opened);
        }),
    ]
];

// Scene inputs
function clickRatelimited(): boolean {
    const lastPressed = (tmp.sceneMemory.get("last") || 0) as number, currentTime = Date.now();
    if (currentTime - lastPressed <= CONFIG.CLICK_RATELIMIT_MS_LENGTH) return true;
    tmp.sceneMemory.set("last", currentTime);
    return false
}
function scene0refreshOptions(newOption: (oldOption: number) => number) {
    const oldOption = tmp.sceneMemory.get("currentOption"), currentOption = newOption(oldOption);
    tmp.sceneMemory.set("currentOption", currentOption);
    const oldText = tmp.scenes[0][7 + oldOption] as Text;
    oldText.setContent(" " + oldText.getContent().substring(1));
    const newText = tmp.scenes[0][7 + currentOption] as Text;
    newText.setContent(">" + newText.getContent().substring(1));
    tmp.scenes[0][6].setY((currentOption * 40) + 367);
}
function scene0clickOption() {
    const currentOption = tmp.sceneMemory.get("currentOption");
    if (currentOption === 0) changeScene(1);
    else scene0menuPopup(currentOption - 1);
}
function scene0menuPopup(menu: number) {
    const popupElements = [
        [
            // Cheats toggle
            new Text({x: 64, y: 140}, "Cheats:", Color.of("#000"), 24, "sans-serif"),
            new Circle({x: 171, y: 131}, 11, localStorage.getItem("setting.cheats") === "true" ? Color.of("#0f0") : Color.of("#f00"), 1, Color.of("#444")).setonclick((node) => {
                const cheats = localStorage.getItem("setting.cheats") === "true";
                localStorage.setItem("setting.cheats", cheats ? "false" : "true");
                node.setFill(Color.of(cheats ? "#f00" : "#0f0"));
            }).setonhover(() => document.body.style.cursor = "pointer").setonunhover(() => document.body.style.cursor = "")
        ],
        [
            new Text({x: 64, y: 140}, "This is a simple beginner canvas game. Most of development was spent on the rendering engine, so the", Color.of("#000"), 24, "sans-serif"),
            new Text({x: 64, y: 164}, "actual game won't be of the same quality as a Godot game made with the same time.", Color.of("#000"), 24, "sans-serif")
        ],
        [
            new Text({x: 64, y: 140}, "All code and assets made by Jazhdo.", Color.of("#000"), 24, "sans-serif"),
            new Text({x: 64, y: 164}, "Zero AI usage. If this project is flagged for AI, those are false flags.", Color.of("#000"), 24, "sans-serif"),
        ]
    ],
    pageNames = ["Settings", "About", "Credits"],
    commonElements = [
        // Background
        new Rect({x: 0, y: 0}, {x: CONFIG.WIDTH, y: CONFIG.HEIGHT}, Color.of("#00000088")).setonclick(() => tmp.scenes[0] = tmp.scenes[0].slice(0, -(6 + popupElements[menu].length))),

        // Popup
        new RoundRect({x: 40, y: 40}, {x: CONFIG.WIDTH - 80, y: CONFIG.HEIGHT - 80}, Color.of("#dcdcdc"), 40),

        // Title
        new Text({x: 64, y: 100}, pageNames[menu], Color.of("#000"), 40),

        // Exit button
        new Circle({x: CONFIG.WIDTH - 85, y: 85}, 25, Color.of("#f00")).setonhover((node) => {
            document.body.style.cursor = "pointer";
            node.setFill(Color.of("#e00"))
        }).setonunhover((node) => {
            document.body.style.cursor = "";
            node.setFill(Color.of("#f00"))
        }).setonclick(() => tmp.scenes[0] = tmp.scenes[0].slice(0, -(6 + popupElements[menu].length))),
        new Line({x: CONFIG.WIDTH - 75, y: 75}, {x: CONFIG.WIDTH - 95, y: 95}, Color.of("#000"), "round", 2),
        new Line({x: CONFIG.WIDTH - 95, y: 75}, {x: CONFIG.WIDTH - 75, y: 95}, Color.of("#000"), "round", 2),
    ];

    tmp.scenes[0].push(...commonElements, ...popupElements[menu]);
}
type inputMapping = {
    before?: () => boolean,
    up?: () => void,
    right?: () => void,
    down?: () => void,
    left?: () => void,
    enter?: () => void
}
const SCENE_INPUTS: inputMapping[] = [
    {
        before: () => !clickRatelimited(),
        up: () => scene0refreshOptions((oldOption) => oldOption === 0 ? 3 : oldOption - 1),
        down: () => scene0refreshOptions((oldOption) => oldOption === 3 ? 0 : oldOption + 1),
        enter: scene0clickOption
    },
    {
        up: () => {
            // Jump
            const player = tmp.scenes[1][1];
            if (player.getY() >= 500) player.physics.y.velocity = CONFIG.PLAYER.JUMP_HEIGHT;
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

// Scene change / init
const SCENE_INIT: (() => void)[] = [
    () => {
        tmp.sceneMemory.set("currentOption", 0);
        tmp.sceneMemory.set("last", 0);
    }
];
function changeScene(scene: number) {
    tmp.keysDown = new Set<string>();
    tmp.sceneMemory = new Map<string, any>();
    tmp.currentScene = scene;
    if (SCENE_INIT[scene] !== undefined) SCENE_INIT[scene]();
}

// Main variables
const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
let tmp = {
    scenes: SCENES,
    sceneMemory: new Map<string, any>(),
    currentScene: CONFIG.INITIAL_SCENE,
    keysDown: new Set<string>()
};

function copyCoordinate(point: Coordinate) {
    return {x: point.x, y: point.y};
}
function coordinateToString(point: Coordinate) {
    return "(x: " + point.x + ", y: " + point.y + ")";
}
function anyCollision(point: Coordinate, check: Node) {
    const nodes = tmp.scenes[1].filter(node => node !== check);
    for (const node of nodes) if (node.contains(point)) return true;
    return false;
}
function playerColliding(points: number) {
    const player = tmp.scenes[1][1] as Circle, check: Coordinate[] = [];
    if ((points >> 3) && 0b0001) {
        const center = copyCoordinate(player.getLoc());
        center.y += player.getRadius();
        check.push(center)
    } else if ((points >> 2) && 0b0001) {
        const center = copyCoordinate(player.getLoc());
        center.x += player.getRadius();
        check.push(center);
    } else if ((points >> 1) && 0b0001) {
        const center = copyCoordinate(player.getLoc());
        center.y -= player.getRadius();
        check.push(center);
    } else if (points && 0b0001) {
        const center = copyCoordinate(player.getLoc());
        center.x -= player.getRadius();
        check.push(center);
    }
    for (const coord of check) if (anyCollision(coord, player)) return true;
    return false;
}

// Main loops
function renderScreen(): void {
    // Inputs per scene
    const si = SCENE_INPUTS[tmp.currentScene];
    for (const key of tmp.keysDown as Set<keyof inputMapping>) key in si && (si.before === undefined || si.before()) && (si[key] as () => void)();

    // Gravity physics (ground is on y500)
    const player = tmp.scenes[1][1];
    if (!playerColliding(0b1111)) {
        player.physics.y.velocity += player.physics.y.acceleration;
        const wantedY = player.getY() + player.physics.y.velocity;
        console.log("Wanted y: " + wantedY)
        player.setY(Math.min(CONFIG.HEIGHT, wantedY));
    }
    // console.log("Player Location: (x: " + player.getX() + ", y: " + player.getY() + ")");

    // Render
    ctx.restore();
    ctx.save();
    ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    tmp.scenes[tmp.currentScene].forEach((node: Node) => node.draw(ctx));

    // Next frame
    requestAnimationFrame(renderScreen);
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

function start(): void {
    canvas.height = CONFIG.HEIGHT;
    canvas.width = CONFIG.WIDTH;
    canvas.onclick = onclick;
    document.onmousemove = onmousemove;
    document.onkeydown = (ev: KeyboardEvent) => Object.entries(CONFIG.INPUT_MAP).forEach((value: [string, string[]]) => value[1].includes(ev.code) && tmp.keysDown.add(value[0]));
    document.onkeyup = (ev: KeyboardEvent) => Object.entries(CONFIG.INPUT_MAP).forEach((value: [string, string[]]) => value[1].includes(ev.code) && tmp.keysDown.delete(value[0]));

    SCENE_INIT[CONFIG.INITIAL_SCENE]();

    ctx.save();
    requestAnimationFrame(renderScreen);
}

if (error === false) start();
else console.error("An error occurred while startup, exiting...");

/*
TODO: 

*/

/* 
Notes
- Either ctx.stroke() or ctx.fill() is required to make stuff appear on the screen, otherwise only the calculations are made

*/