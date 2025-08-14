//This code might be quite far from what is considered a good code but it works
//I wrote it in 1 evening, so who cares?

let mode = "menu"; //"aim", "dodge", "repel"
let chosenMode = "aim";
let canvas = {};
let ctx = {};
let mouseX = 0;
let mouseY = 0;
let mouseIsDown = false;
//----------
let map_width = 1300;
let map_height = 1300;
let player_radius = 33;
let tank_MaxSpeed = 5;
let player_accel = 0.07;

let droneStartingSpeed = 5;
let drone_MaxSpeed = 8;
let drone_accel = 0.03;

const drone_radius = 9.5;
let playerReload = 2000;

let startTime = Date.now();
let kill_count = 0;
let practiceMode = false;
let pause = false;
let pauseTime = Date.now();

let lastTimeShooting = Date.now();
//------COLORS----------
let colors = {
    background: "#a5b2a5",
    darkerbackground: "#939e93ff",
    player: "#4f93b5",
    enemy: "#e14f65",
    health: "#aad35d"
}

let player = {
    x: 750,
    y: 750,
    vx: 0,
    vy: 0
}


let targets = [];

let playerDrones = [];

let controlKeys = {
    W: false,
    A: false,
    S: false,
    D: false
}


function collide(x, y, r, X, Y, R) {
    return Math.hypot(X - x, Y - y) < (r + R);
}

function lerp(a, b, t) {return a+(b-a)*t;}
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}


function drawPlayer() {
    ctx.save();
        ctx.beginPath()
        ctx.arc(player.x, player.y, player_radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = colors.player;
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.beginPath()
            let vx = mouseX - canvas.width / 2;
            let vy = mouseY - canvas.height / 2;
            let vlen = Math.hypot(vy, vx);
            vx = vx / vlen * player_radius;
            vy = vy / vlen * player_radius;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2.75;
            ctx.moveTo(player.x, player.y);
            ctx.lineTo(player.x + vx, player.y + vy);
        ctx.closePath();
            ctx.stroke()
        ctx.restore();
    ctx.restore();
}


function drawPlayerDrones() {
    ctx.save();
    ctx.fillStyle = colors.player;
    ctx.strokeStyle = "#373834";
    for (let drone of playerDrones) {
        ctx.save();
        
        
        ctx.translate(drone.x, drone.y)

        let R = drone_radius * 2;
        let x1 = R;
        let y1 = 0;

        let x2 = R * Math.cos(Math.PI * 2 / 3);
        let y2 = R * Math.sin(Math.PI * 2 / 3);

        let x3 = R * Math.cos(Math.PI * 4 / 3);
        let y3 = R * Math.sin(Math.PI * 4 / 3);

        let angle = Math.atan2(drone.vy, drone.vx);
        
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath()

        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}


function drawTargets() {
    ctx.save();
        for (let target of targets) {
            ctx.fillStyle = colors.enemy;
            ctx.strokeStyle = "#373834";
            ctx.beginPath();
            ctx.arc(target.x, target.y, player_radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            if (target.hp < 16) {
                ctx.fillStyle = "#373834";
                ctx.fillRect(target.x - 40, target.y + 45, 80, 8);

                ctx.fillStyle = colors.health;
                ctx.fillRect(target.x - 38, target.y + 47, 76 * target.hp / 16, 4);
            }
        }
    ctx.restore();
}


function handlePlayerMovement() {
    if (controlKeys.W) {
        player.vy = lerp(player.vy, -tank_MaxSpeed, player_accel);
    }

    if (controlKeys.S) {
        player.vy = lerp(player.vy, tank_MaxSpeed, player_accel);
    }

    if (!controlKeys.W && !controlKeys.S) {
        player.vy = lerp(player.vy, 0, player_accel);
    }

    if (controlKeys.A) {
        player.vx = lerp(player.vx, -tank_MaxSpeed, player_accel);
    }

    if (controlKeys.D) {
        player.vx = lerp(player.vx, tank_MaxSpeed, player_accel);
    }

    if (!controlKeys.A && !controlKeys.D) {
        player.vx = lerp(player.vx, 0, player_accel);
    }

    let playerSpd = Math.hypot(player.vy, player.vx);
    if (playerSpd > tank_MaxSpeed) {
        player.vx = player.vx / playerSpd * tank_MaxSpeed;
        player.vy = player.vy / playerSpd * tank_MaxSpeed;
    }
    player.x += player.vx;
    player.y += player.vy;

    player.x = Math.max(player.x, 0);
    player.x = Math.min(player.x, map_width);
    player.y = Math.max(player.y, 0);
    player.y = Math.min(player.y, map_height);
}


function handlePlayerDrones() {
    let mx = mouseX + player.x - window.innerWidth / 2;
    let my = mouseY + player.y - window.innerHeight / 2;

    if (Date.now() - lastTimeShooting > playerReload) {
        //4 barrels
        for (let i = 0; i < 4; ++i) {
            if (playerDrones.length < 8) {
                let angle = Math.atan2(my, mx) + Math.PI / 2 * i + Math.PI / 4;

                let newDrone = {
                        x: player.x,
                        y: player.y,
                        vx: Math.cos(angle) * droneStartingSpeed,
                        vy: Math.sin(angle) * droneStartingSpeed
                };

                playerDrones.push(newDrone);
                lastTimeShooting = Date.now();
            }
        }
        
        
    }

    for (let drone of playerDrones) {
        
        let vx = mx - drone.x;
        let vy = my - drone.y;

        let dst = Math.hypot(vx, vy);
        vx = vx / dst * drone_MaxSpeed;
        vy = vy / dst * drone_MaxSpeed;

        if (collide(drone.x, drone.y, drone_radius, mx, my, 1)) {
            drone.vx = lerp(drone.vx, 0, drone_accel);
            drone.vy = lerp(drone.vy, 0, drone_accel);
        } else {
            if (!mouseIsDown) {
                drone.vx = lerp(drone.vx, vx, drone_accel);
                drone.vy = lerp(drone.vy, vy, drone_accel);
            } else {
                drone.vx = lerp(drone.vx, -vx, drone_accel);
                drone.vy = lerp(drone.vy, -vy, drone_accel);
            }
        }
        let spd = Math.hypot(drone.vx, drone.vy);
        if (spd > drone_MaxSpeed) {
            drone.vx = drone.vx / spd * drone_MaxSpeed;
            drone.vy = drone.vy / spd * drone_MaxSpeed;
        }

        drone.x += drone.vx;
        drone.y += drone.vy;
    }

    for (let drone of playerDrones) {
        for (let drone2 of playerDrones) {
            if (drone !== drone2 && collide(drone.x, drone.y, drone_radius, drone2.x, drone2.y, drone_radius)) {
                let dvx = drone2.x - drone.x;
                let dvy = drone2.y - drone.y;
                
                if (dvx === 0 && dvy === 0) dvx = 0.001;
                let ddst = Math.hypot(dvx, dvy); 
                dvx = dvx / ddst * drone_radius * 2;
                dvy = dvy / ddst * drone_radius * 2;
                drone2.x = drone.x + dvx;
                drone2.y = drone.y + dvy;
            }
        }
    }

    for (let drone of playerDrones) {
        if (drone.x < 0) drone.x = 0;
        if (drone.x > map_width) drone.x = map_width;
        if (drone.y < 0) drone.y = 0;
        if (drone.y > map_height) drone.y = map_height;
    }
}


function handleTargets() {
    while (targets.length < 7) {
        let newTarget = {
            x: Math.random() * map_width,
            y: Math.random() * map_height,
            vx: 0,
            vy: 0,
            hp: 16,
            keys: {
            W: false,
            A: false,
            S: false,
            D: false
        },
        nextChange: Date.now()
        };
        targets.push(newTarget);
        
    }

    for (const [index, target] of targets.entries()) {
        if (Date.now() > target.nextChange) {
            let potential = 1;
            do {
                target.keys = {
                    W: Math.random() < 0.5,
                    A: Math.random() < 0.5,
                    S: Math.random() < 0.5,
                    D: Math.random() < 0.5,
                }
                
                potential = Number(target.keys.W) - Number(target.keys.S) + Number(target.keys.D) - Number(target.keys.A);
            } while (potential === 0);
            target.nextChange = Date.now() + (Math.floor(700 + Math.random() * 700)) * ((practiceMode) ? 2 : 1);
        }

        if (target.keys.W) {
            target.vy = lerp(target.vy, -tank_MaxSpeed, player_accel);
        }

        if (target.keys.S) {
            target.vy = lerp(target.vy, tank_MaxSpeed, player_accel);
        }

        if (!target.keys.W && !target.keys.S) {
            target.vy = lerp(target.vy, 0, player_accel);
        }

        if (target.keys.A) {
            target.vx = lerp(target.vx, -tank_MaxSpeed, player_accel);
        }

        if (target.keys.D) {
            target.vx = lerp(target.vx, tank_MaxSpeed, player_accel);
        }

        if (!target.keys.A && !target.keys.D) {
            target.vx = lerp(target.vx, 0, player_accel);
        }

    
        let spd = Math.hypot(target.vy, target.vx);
        if (spd > tank_MaxSpeed) {
            target.vx = target.vx / spd * tank_MaxSpeed;
            target.vy = target.vy / spd * tank_MaxSpeed;
        }

        for (let i = 0; i < playerDrones.length; ++i) {
            let drone = playerDrones[i];
            if (collide(target.x, target.y, player_radius, drone.x, drone.y, drone_radius)) {
                playerDrones.splice(i, 1);
                target.hp--;
            }
        }

        if (target.hp <= 0) {
            targets.splice(index, 1);
            ++kill_count;
            continue;
        }

        target.x += target.vx;
        target.y += target.vy;

        if (target.x < 0) target.x = 0;
        if (target.x > map_width) target.x = map_width;
        if (target.y < 0) target.y = 0;
        if (target.y > map_height) target.y = map_height;
    }
}


function gameCycle() {
    ctx.save()
        ctx.fillStyle = colors.darkerbackground;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.save()
    ctx.strokeStyle = "#373834";
    ctx.lineWidth = 2.75;
    ctx.translate(-player.x + canvas.width / 2, -player.y + canvas.height / 2);
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, map_width, map_height);
    if (mode === "aim") {
        drawPlayerDrones();
        drawTargets();
    }
    drawPlayer();
    ctx.restore();

    if (mode === "aim") {
        ctx.font = " 600 25px ubuntu";
        ctx.textAlign = "left";
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 5;
        ctx.beginPath()

        if (!pause) {
            ctx.strokeText("Time(s): " + Math.floor((Date.now() - startTime) / 1000), 10, 40);
            ctx.fillText("Time(s): " + Math.floor((Date.now() - startTime) / 1000), 10, 40);
        } else {
            ctx.strokeText("Time(s): " + Math.floor((pauseTime - startTime) / 1000), 10, 40);
            ctx.fillText("Time(s): " + Math.floor((pauseTime - startTime) / 1000), 10, 40);
        }
        ctx.closePath();
    
        ctx.strokeText("Kills: " + kill_count.toString(), 10, 70);
        ctx.fillText("Kills: " + kill_count.toString(), 10, 70);

        ctx.fillStyle = "#d1ff05ff";
        ctx.strokeText("Practice Mode(Press [K]): " + ((practiceMode) ? "enabled" : "disabled"), 10, 100);
        ctx.fillText("Practice Mode(Press [K]): " + ((practiceMode) ? "enabled" : "disabled"), 10, 100);

        ctx.strokeText("Pause(Press [P]): " + ((pause) ? "enabled" : "disabled"), 10, 130);
        ctx.fillText("Pause(Press [P]): " + ((pause) ? "enabled" : "disabled"), 10, 130);

        ctx.fillStyle = "#ffffff";
        if (startTime !== Date.now()) {
            let kps = (kill_count / (Date.now() - startTime) * 1000).toFixed(3);
            ctx.strokeText("Kills per second: " + kps.toString(), 10, 160);
            ctx.fillText("Kills per second: " + kps.toString(), 10, 160);
        }
    }

    
    if (!pause) handlePlayerMovement();
    if (mode === "aim" && !pause) {
        handlePlayerDrones();
        handleTargets();
    }
}




window.onload = () => {
const menu = document.getElementById("menu");
const radioButtons = document.querySelectorAll('input[name="choice"]');
const description = document.getElementById('description');
const startButton = document.getElementById('startButton');
canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");

    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                chosenMode = this.value;
                if (this.value === 'aim') {              
                    description.textContent = 'Use left or right mouse to repel drones. This mode trains your skill to control your drones. You need this to hit and damage your opponents. Try focusing on any target and perfectly following it with your drones until you kill it.';
                } else if (this.value === 'dodge') {
                    description.textContent = 'This mode trains your skill to avoid enemy\'s drones. You need this to prevent yourself from getting hit. Just drones that spawn as long as you can without getting hit.';
                } else if (this.value === 'repel') {
                    description.textContent = 'This mode trains your skill to find your opponent\'s tank by his drones when he is out of your field of view. Assume where your opponent is by his drones and repel your drones with right click towards him until you hit him.';
                }
            }
        });
    });

    startButton.onclick = () => {
        mode = chosenMode;
        menu.style.display = "none";
        canvas.style.visibility = "visible";
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        startTime = Date.now();
        setInterval(gameCycle, 1000 / 60);
    }
}


document.addEventListener('keydown', function(event) {

  if (mode === "menu") {
    if (event.code === "Enter") {
        mode = chosenMode;
        menu.style.display = "none";
        canvas.style.visibility = "visible";
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        startTime = Date.now();
        setInterval(gameCycle, 1000 / 60);
    }
   }

  if (mode !== "menu") {
    if (event.code === 'KeyW') {
        controlKeys.W = true;
    }

    if (event.code === "KeyS") {
        controlKeys.S = true;
    }

    if (event.code === "KeyA") {
        controlKeys.A = true;
    }

    if (event.code === "KeyD") {
        controlKeys.D = true;
    }
  }

  if (mode === "aim") {
    if (event.code === "KeyK") {
        practiceMode = !practiceMode;
        if (practiceMode) {
            tank_MaxSpeed = 5 / 2;
            player_accel = 0.07 / 2;

            droneStartingSpeed = 5 / 2;
            drone_MaxSpeed = 8 / 2;
            drone_accel = 0.03 / 2;
            playerReload = 2000 * 2;
        } else {
            tank_MaxSpeed = 5;
            player_accel = 0.07;

            droneStartingSpeed = 5;
            drone_MaxSpeed = 8;
            drone_accel = 0.03;
            playerReload = 2000;
        }
    }

    if (event.code === "KeyP") {
        pause = !pause;
        if (!pause) {
            startTime += Date.now() - pauseTime;
        }
        pauseTime = Date.now();
    }
  }
});


document.addEventListener('keyup', function(event) {
  // Check if the 'Enter' key was pressed
  if (mode !== "menu") {
    if (event.code === 'KeyW') {
        controlKeys.W = false;
    }

    if (event.code === "KeyS") {
        controlKeys.S = false;
    }

    if (event.code === "KeyA") {
        controlKeys.A = false;
    }

    if (event.code === "KeyD") {
        controlKeys.D = false;
    }
  }
});


document.addEventListener('mousemove', function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
});


document.addEventListener('mousedown', () => {
    mouseIsDown = true; 

});


document.addEventListener('mouseup', () => {
    mouseIsDown = false;
});

document.addEventListener('contextmenu', event => event.preventDefault());
