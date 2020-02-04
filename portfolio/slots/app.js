var canvas;
var ctx;
var backgroundImg;
var arrow;
var symbolImages;
var dudAudio;
var clickAudio;
var coinsAudio;
var colors = ['green', 'red', 'yellow', 'blue'];
var gamePosition;
var gameSize;
var numberReels = 3;
var startTime;
var previousFrame;
var currentFrame;
var deltaTime; //The time between the last frame and this one
var Reels;
var WheelOfWealth;
var waitingForSpin = false;
var SwitchGames = true; //true means you're playing slots, false means you're playing the wheel
var stoppedReels = 0;
var chosenPrize = -1;
//The mainloop is called once per frame and updates logic for games as well as draws them.
function mainLoop() {
    requestAnimationFrame(mainLoop);
    currentFrame = new Date();
    deltaTime = currentFrame.getTime() - previousFrame.getTime();
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    if (SwitchGames) {
        for (var i = 0; i < Reels.length; ++i) {
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
function Spin() {
    if (waitingForSpin)
        return;
    waitingForSpin = true;
    if (SwitchGames) {
        var _loop_1 = function (i) {
            setTimeout(function () { Reels[i].Spin(); }, 200 * i);
        };
        for (var i = 0; i < numberReels; ++i) {
            _loop_1(i);
        }
    }
    else {
        WheelOfWealth.Spin();
    }
}
function CheckForPrize() {
    stoppedReels = 0;
    if (SwitchGames) {
        for (var _i = 0, Reels_1 = Reels; _i < Reels_1.length; _i++) {
            var wheel = Reels_1[_i];
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
function resize() {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
    if (canvas.width / canvas.height > 1) { //limit by height
        gamePosition.y = 0;
        gamePosition.x = (canvas.width / 2) - (canvas.height / 2);
        gameSize = canvas.height;
    }
    else { //limit by width
        gamePosition.y = 0;
        gamePosition.x = 0;
        gameSize = canvas.width;
    }
    if (Reels != undefined) {
        for (var i = 0; i < numberReels; i++) {
            Reels[i].Resize();
        }
    }
}
//Called when the page first loads, initializes assets and references
window.onload = function () {
    canvas = document.getElementById('maincanvas');
    ctx = canvas.getContext("2d");
    window.addEventListener("resize", resize);
    gamePosition = new coords(0, 0);
    resize();
    symbolImages = [];
    symbolImages[0] = document.getElementById('symbol1');
    symbolImages[1] = document.getElementById('symbol2');
    symbolImages[2] = document.getElementById('symbol3');
    backgroundImg = document.getElementById('bgImage');
    arrow = document.getElementById('arrow');
    dudAudio = new Audio("/audio/dud.mp3");
    clickAudio = new Audio("/audio/click.mp3");
    coinsAudio = new Audio("/audio/coins.mp3");
    Reels = [];
    for (var i = 0; i < numberReels; i++) {
        Reels[i] = new SlotReel(i);
    }
    WheelOfWealth = new Wheel();
    startTime = new Date();
    previousFrame = currentFrame = new Date();
    mainLoop();
};
var coords = /** @class */ (function () {
    function coords(x, y) {
        this.x = x;
        this.y = y;
    }
    return coords;
}());
// The wheel class arguably has a lot of the same functionality as the SlotReels and if I had more time 
// I would have reduced duplicated code by making them children of an abstract parent class
var Wheel = /** @class */ (function () {
    function Wheel() {
        this.subDivisions = 8;
        this.currentRotation = 0;
        this.speed = 0;
        this.acceleration = 0;
        this.spinning = false;
        this.stopping = false;
        this.lastclick = 0;
    }
    Wheel.prototype.Update = function () {
        if (this.spinning) {
            this.currentRotation = (this.currentRotation + unitsTravelled(this.speed, deltaTime / 1000, this.acceleration)) % (2 * Math.PI);
            this.speed = Math.max(0, this.speed + (this.acceleration * (deltaTime / 1000)));
            if (this.stopping && this.speed == 0) {
                this.Stop();
            }
            else if (!this.stopping && this.speed < 1 / 8) { //we know that it's moving slowly enough that it won't enter the next tile
                this.stopping = true;
                var dist = (Math.ceil(this.currentRotation * 3) / 3) - this.currentRotation;
                this.acceleration = -(this.speed * this.speed) / (2 * dist);
            }
        }
        //play a click every time one tile is rotated
        if (this.currentRotation - this.lastclick > (2 * Math.PI) / 8 || this.currentRotation < this.lastclick) {
            clickAudio.play();
            this.lastclick = this.currentRotation;
        }
    };
    Wheel.prototype.Stop = function () {
        this.currentRotation = (Math.round(this.currentRotation * 3.0) / 3.0);
        this.stopping = false;
        this.spinning = false;
        CheckForPrize();
    };
    //In order to land on a preselected slot naturally, we must assume an amount of time, decceleration, and total rotation to get an initial velocity 
    Wheel.prototype.Spin = function () {
        this.acceleration = -0.25;
        chosenPrize = +document.getElementById("selectPrize").value;
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
    };
    //I decided to draw the wheel with html5 canvas rather than an image.
    Wheel.prototype.Draw = function () {
        for (var i = 0; i < this.subDivisions; i++) {
            ctx.save();
            ctx.translate(gamePosition.x + (gameSize / 2), gamePosition.y + (gameSize / 2));
            ctx.rotate(-(2 * Math.PI) * (112.5 / 360));
            ctx.beginPath();
            moveTo(0, 0);
            ctx.arc(0, 0, gameSize / 2, this.currentRotation + (i * (2 * Math.PI) / 8), this.currentRotation + ((i + 1) * (2 * Math.PI) / 8), false);
            ctx.fillStyle = colors[i % colors.length];
            ctx.lineWidth = 0;
            ctx.lineTo(0, 0);
            ctx.fill();
            ctx.stroke();
            ctx.rotate(this.currentRotation + (i * (2 * Math.PI) / 8) + ((2 * Math.PI) / 16));
            ctx.font = (50 * gameSize / 1000).toString() + "px Arial";
            ctx.fillStyle = colors[(i - 1 + colors.length) % colors.length];
            ctx.fillText((i + 1).toString(), (gameSize / 4), 0, (gameSize / 4));
            ctx.restore();
        }
        ctx.drawImage(arrow, gamePosition.x + (gameSize / 2) - 25, 0, (50 * gameSize / 1000), (50 * gameSize / 1000));
    };
    return Wheel;
}());
//This is the class for the indiviual images that are drawn. They follow their parent Reel and offset by index to stack vertically
var SlotSymbol = /** @class */ (function () {
    function SlotSymbol(image, index, parent) {
        this.image = image;
        this.index = index;
        this.parent = parent;
    }
    //Drawn in line with parent SlotReel
    SlotSymbol.prototype.Draw = function () {
        ctx.drawImage(this.image, this.parent.position.x, this.parent.position.y - (this.index * this.parent.size), this.parent.size, this.parent.size);
    };
    return SlotSymbol;
}());
//SlotReels have properties that allow them to simulate motion, game logic, and also references to their child SlotSymbol objects
var SlotReel = /** @class */ (function () {
    function SlotReel(index) {
        this.size = 0;
        this.currentRotation = 0;
        this.speed = 0;
        this.acceleration = 0;
        this.spinning = false;
        this.stopping = false;
        this.lastclick = 0;
        this.index = index;
        this.symbols = [];
        for (var i = 0; i < 6; ++i) {
            this.symbols[i] = new SlotSymbol(symbolImages[i % symbolImages.length], i, this);
        }
        this.Resize();
    }
    //Called when the Game's Resize function is called to propogate size changes
    SlotReel.prototype.Resize = function () {
        this.position = new coords(gamePosition.x + (gameSize * this.index / numberReels), 0);
        this.size = gameSize / numberReels;
        this.topPosition = this.size * 2;
        this.bottomPosition = (this.symbols.length - 1) * this.size;
    };
    SlotReel.prototype.Draw = function () {
        for (var i = 0; i < 6; ++i) {
            this.symbols[i].Draw();
        }
    };
    SlotReel.prototype.Update = function () {
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
        this.position.y = lerp(this.topPosition, this.bottomPosition, this.currentRotation); //this.speed * (deltaTime / 1000);
    };
    //Spin for a few seconds and then enter the stopping phase where it'll do a predetermined # of spins before it stops on the correct spot
    SlotReel.prototype.Spin = function () {
        this.acceleration = -.3;
        this.speed = RandomRange(2.5, 3.5);
        this.spinning = true;
        this.stopping = false;
    };
    SlotReel.prototype.Stop = function () {
        this.currentRotation = (Math.round(this.currentRotation * 3.0) / 3.0);
        this.stopping = false;
        this.spinning = false;
        stoppedReels++;
        if (stoppedReels >= numberReels) {
            CheckForPrize();
        }
    };
    return SlotReel;
}());
/**
 * Helper functions
 */
//Standard Linear Interpolation, uses interpolant (between 0 and 1) to map analogous value between start and stop
function lerp(start, stop, interpolant) {
    interpolant = Math.max(0, Math.min(interpolant, 1)); //clamping
    return start + ((stop - start) * interpolant);
}
// unitsTravelled() takes in known motion equation values and returns a distance in unspecifed units
function unitsTravelled(speed, time, acceleration) {
    return (speed * time) + (acceleration * time * time / 2);
}
// getInitialSpeed() takes known motion equation values and returns an initial speed value
function getInitialSpeed(distance, time, acceleration) {
    return ((-acceleration * time * time / 2) + distance) / time;
}
// Random Range function for convenience
function RandomRange(min, max) {
    return (Math.random() * (max - min)) + min;
}
//# sourceMappingURL=app.js.map