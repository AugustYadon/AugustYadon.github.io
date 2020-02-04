var canvas: HTMLCanvasElement;
var ctx: CanvasRenderingContext2D;
var backgroundImg: HTMLImageElement;
var arrow: HTMLImageElement;
var symbolImages: HTMLImageElement[];
var dudAudio: HTMLAudioElement;
var clickAudio: HTMLAudioElement;
var coinsAudio: HTMLAudioElement;
var colors: string[] = ['green', 'red', 'yellow', 'blue'];
var gamePosition: coords;
var gameSize: number;
var numberReels: number = 3;
var startTime: Date;
var previousFrame: Date;
var currentFrame: Date;
var deltaTime: number; //The time between the last frame and this one

var Reels: SlotReel[];
var WheelOfWealth: Wheel;

var waitingForSpin: boolean = false;
var SwitchGames: boolean = true; //true means you're playing slots, false means you're playing the wheel
var stoppedReels: number = 0;
var chosenPrize: number = -1;

//The mainloop is called once per frame and updates logic for games as well as draws them.
function mainLoop(): void {
    requestAnimationFrame(mainLoop);
    currentFrame = new Date();
    deltaTime = currentFrame.getTime() - previousFrame.getTime();
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    if (SwitchGames) {
        for (let i = 0; i < Reels.length; ++i) {
            Reels[i].Update();
            Reels[i].Draw();
        }
    }
    else {
        WheelOfWealth.Update();
        WheelOfWealth.Draw();
    }

    previousFrame = currentFrame;
}

function ToggleSlots() {
    if (!waitingForSpin) {
        SwitchGames = !SwitchGames;
    }
}

function Spin(): void{
    if (waitingForSpin) return;
    waitingForSpin = true;

    if (SwitchGames) {
        for (let i = 0; i < numberReels; ++i) {
            setTimeout(function () { Reels[i].Spin(); }, 200 * i);
        }
    }
    else {
        WheelOfWealth.Spin();
    }
}

function CheckForPrize(): void {
    stoppedReels = 0;
    if (SwitchGames) {
        for (var wheel of Reels) {
            if (wheel.currentRotation != Reels[0].currentRotation) {
                dudAudio.play();
                waitingForSpin = false;
                return;
            }
        }
        waitingForSpin = false;
        coinsAudio.play();
    }
    else {
        waitingForSpin = false;
        coinsAudio.play();
    }
}

//This function is only called when the screen is resized and it resizes the necesary components so that they fit in the allotted area
function resize(): void {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
    
    if (canvas.width / canvas.height > 1) {//limit by height
        gamePosition.y = 0;
        gamePosition.x = (canvas.width / 2) - (canvas.height / 2);
        gameSize = canvas.height;
    }
    else {//limit by width
        gamePosition.y = 0;
        gamePosition.x = 0;
        gameSize = canvas.width;
    }
    if (Reels != undefined) {
        for (let i = 0; i < numberReels; i++) {
            Reels[i].Resize();
        }
    }
}

//Called when the page first loads, initializes assets and references
window.onload = () => {
    canvas = <HTMLCanvasElement>document.getElementById('maincanvas');
    ctx = canvas.getContext("2d");

    window.addEventListener("resize", resize)
    gamePosition = new coords(0, 0);
    resize();

    symbolImages = [];
    symbolImages[0] =  <HTMLImageElement>document.getElementById('symbol1');
    symbolImages[1] =  <HTMLImageElement>document.getElementById('symbol2');
    symbolImages[2] = <HTMLImageElement>document.getElementById('symbol3');
    backgroundImg = <HTMLImageElement>document.getElementById('bgImage');
    arrow = <HTMLImageElement>document.getElementById('arrow');

    dudAudio = new Audio("/audio/dud.mp3");
    clickAudio = new Audio("/audio/click.mp3");
    coinsAudio = new Audio("/audio/coins.mp3");

    Reels = [];
    for (let i = 0; i < numberReels; i++) {
        Reels[i] = new SlotReel(i);
    }
    WheelOfWealth = new Wheel();

    startTime = new Date();
    previousFrame = currentFrame = new Date();
    mainLoop();
};

class coords {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

// The wheel class arguably has a lot of the same functionality as the SlotReels and if I had more time 
// I would have reduced duplicated code by making them children of an abstract parent class
class Wheel {
    subDivisions: number = 8;
    subDivisionLength: number;
    currentRotation: number = 0;
    speed: number = 0;
    acceleration: number = 0;
    spinning: boolean = false;
    stopping: boolean = false;

    lastclick: number = 0;
    selectedDestination: number;

    Update() {
        if (this.spinning) {
            this.currentRotation = (this.currentRotation + unitsTravelled(this.speed, deltaTime / 1000, this.acceleration)) % (2*Math.PI);
            this.speed = Math.max(0, this.speed + (this.acceleration * (deltaTime / 1000)));
            if (this.stopping && this.speed == 0) {
                this.Stop();
            }
            else if (!this.stopping && this.speed < 1/8) {//we know that it's moving slowly enough that it won't enter the next tile
                this.stopping = true;
                var dist = (Math.ceil(this.currentRotation * 3) / 3) - this.currentRotation;
                this.acceleration = -(this.speed * this.speed) / (2 * dist);
            }
        }
        //play a click every time one tile is rotated
        if (this.currentRotation - this.lastclick > (2 * Math.PI)/8 || this.currentRotation < this.lastclick) {
            clickAudio.play();
            this.lastclick = this.currentRotation;
        }
    }

    Stop() {
        this.currentRotation = (Math.round(this.currentRotation * 3.0) / 3.0);
        this.stopping = false;
        this.spinning = false;
        CheckForPrize();
    }

    //In order to land on a preselected slot naturally, we must assume an amount of time, decceleration, and total rotation to get an initial velocity 
    Spin() {
        this.acceleration = -0.25;
        chosenPrize = +(<HTMLSelectElement>document.getElementById("selectPrize")).value;
        if (chosenPrize != -1) {
            this.selectedDestination = WheelOfWealth.currentRotation + (Math.PI * 2) + (chosenPrize * (2 * Math.PI) / 8);
            this.speed = getInitialSpeed(this.selectedDestination - WheelOfWealth.currentRotation, .003, this.acceleration) / 1000;
        }
        else {
            this.speed = RandomRange(3.5, 4.5);
        }

        //bools are used to keep track of the state of the game to control what should be happening in logic and what buttons can be used.
        this.spinning = true; 
        this.stopping = false;
    }

    //I decided to draw the wheel with html5 canvas rather than an image.
    Draw() {
        for (let i = 0; i < this.subDivisions; i++) {
            ctx.save();
            ctx.translate(gamePosition.x + (gameSize / 2), gamePosition.y + (gameSize / 2))
            ctx.rotate(-(2 * Math.PI)*(112.5/360))
            ctx.beginPath();
            moveTo(0, 0)
            ctx.arc(0, 0, gameSize / 2, this.currentRotation + (i * (2 * Math.PI) / 8), this.currentRotation + ((i+1) * (2 * Math.PI) / 8), false);
            ctx.fillStyle = colors[i%colors.length];
            ctx.lineWidth = 0;
            ctx.lineTo(0, 0);
            ctx.fill();
            ctx.stroke();
            ctx.rotate(this.currentRotation + (i * (2 * Math.PI) / 8) + ((2 * Math.PI) / 16));
            ctx.font = (50 * gameSize / 1000).toString() + "px Arial";
            ctx.fillStyle = colors[(i-1 + colors.length) % colors.length];
            ctx.fillText((i+1).toString(), (gameSize / 4), 0, (gameSize / 4));
            ctx.restore();
        }
        ctx.drawImage(arrow, gamePosition.x + (gameSize / 2) - 25, 0, (50 * gameSize / 1000), (50 * gameSize / 1000));
    }
}

//This is the class for the indiviual images that are drawn. They follow their parent Reel and offset by index to stack vertically
class SlotSymbol {
    image: HTMLImageElement;
    parent: SlotReel;
    index: number;

    constructor(image: HTMLImageElement, index: number, parent: SlotReel) {
        this.image = image;
        this.index = index;
        this.parent = parent;
    }

    //Drawn in line with parent SlotReel
    Draw() {
        ctx.drawImage(this.image, this.parent.position.x, this.parent.position.y - (this.index * this.parent.size), this.parent.size, this.parent.size);
    }
}

//SlotReels have properties that allow them to simulate motion, game logic, and also references to their child SlotSymbol objects
class SlotReel {
    index: number; //An ID to help with positioning and Array references
    symbols: SlotSymbol[];
    position: coords;
    size: number = 0;

    topPosition: number; //The Y location when the Reel has rotated 0 units
    bottomPosition: number; //The Y location when the Reel has rotated 1 Unit/full rotation
    currentRotation: number = 0;

    speed: number = 0;
    acceleration: number = 0;

    spinning: boolean = false;
    stopping: boolean = false;

    lastclick: number = 0;

    constructor(index: number) {
        this.index = index;
        this.symbols = [];
        for (let i = 0; i < 6; ++i) {
            this.symbols[i] = new SlotSymbol(symbolImages[i % symbolImages.length], i, this);
        }
        this.Resize();
    }

    //Called when the Game's Resize function is called to propogate size changes
    Resize(): void {
        this.position = new coords(gamePosition.x + (gameSize * this.index / numberReels), 0);
        this.size = gameSize / numberReels;
        this.topPosition = this.size * 2;
        this.bottomPosition = (this.symbols.length - 1) * this.size;
    }

    Draw(): void {
        for (let i = 0; i < 6; ++i) {
            this.symbols[i].Draw();
        }
    }

    Update() {
        if (this.spinning) {
            this.currentRotation = (this.currentRotation + unitsTravelled(this.speed, deltaTime / 1000, this.acceleration)) % 1;
            this.speed = Math.max(0, this.speed + (this.acceleration * (deltaTime / 1000)));
            if (this.stopping && this.speed == 0) {
                this.Stop();
            }
            else if (!this.stopping && this.speed < 1) {
                this.stopping = true;
                var dist = (Math.ceil(this.currentRotation * 3) / 3) - this.currentRotation;
                this.acceleration = -(this.speed * this.speed) / (2 * dist);
            }
        }
        //play a click every time one tile is rotated
        if (this.currentRotation - this.lastclick > 0.33 || this.currentRotation < this.lastclick) {
            clickAudio.play();
            this.lastclick = this.currentRotation;
        }
        this.position.y = lerp(this.topPosition, this.bottomPosition, this.currentRotation);//this.speed * (deltaTime / 1000);
    }

    //Spin for a few seconds and then enter the stopping phase where it'll do a predetermined # of spins before it stops on the correct spot
    Spin() {
        this.acceleration = -.3;
        this.speed = RandomRange(2.5, 3.5);
        this.spinning = true;
        this.stopping = false;
    }

    Stop() {
        this.currentRotation = (Math.round(this.currentRotation * 3.0) / 3.0);
        this.stopping = false;
        this.spinning = false;
        stoppedReels++;
        if (stoppedReels >= numberReels) { CheckForPrize();}
    }

}


/**
 * Helper functions
 */

//Standard Linear Interpolation, uses interpolant (between 0 and 1) to map analogous value between start and stop
function lerp(start: number, stop: number, interpolant: number): number {
    interpolant = Math.max(0, Math.min(interpolant, 1)); //clamping
    return start + ((stop - start) * interpolant);
}

// unitsTravelled() takes in known motion equation values and returns a distance in unspecifed units
function unitsTravelled(speed: number, time: number, acceleration: number): number {
    return (speed * time) + (acceleration * time * time / 2);
}

// getInitialSpeed() takes known motion equation values and returns an initial speed value
function getInitialSpeed(distance: number, time: number, acceleration: number): number {
    return ((-acceleration * time * time / 2) + distance) / time;
}

// Random Range function for convenience
function RandomRange(min, max) {
    return (Math.random() * (max - min)) + min;
}
