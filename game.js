import { saveScore, subscribeLeaderboard } from "./firebase.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Set canvas size
canvas.width = 400;
canvas.height = 600;

const login = document.getElementById("login");
const startBtn = document.getElementById("startBtn");
const userNameInput = document.getElementById("userName");

let userName = "", playing = false, best = 0;

// Load images
const birdImg = new Image();
birdImg.src = "sentient-removebg-preview.png";

const pipeImg = new Image();
pipeImg.src = "unnamed-removebg-preview (1).png";

// Game constants
const BIRD_X = 80;
const BIRD_WIDTH = 50;
const BIRD_HEIGHT = 42;
const GRAVITY = 0.45;
const JUMP = -7.2;
const PIPE_W = 100;
const PIPE_GAP = 180;
const PIPE_SPEED = 2.5;
const PIPE_FREQUENCY = 100;

// Game state
let birdY = 250;
let vel = 0;
let pipes = [];
let frame = 0;
let score = 0;

// Subscribe to leaderboard
subscribeLeaderboard(list => {
  document.getElementById("scoreList").innerHTML = list
    .map((s, i) => `<li>#${i + 1}: ${s.name} – ${s.score}</li>`)
    .join("");
});

// Start button
startBtn.onclick = () => {
  if (userNameInput.value.trim().length < 2) {
    alert("Please enter at least 2 characters");
    return;
  }
  userName = userNameInput.value.trim();
  login.style.display = "none";
  canvas.style.display = "block";
  reset();
  playing = true;
  loop();
};

// Controls
canvas.addEventListener("click", () => {
  if (playing) vel = JUMP;
});

document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    if (playing) vel = JUMP;
  }
});

// Reset game
function reset() {
  birdY = 250;
  vel = 0;
  score = 0;
  frame = 0;
  pipes = [{ x: 400, top: 120, scored: false }];
}

// Draw bird
function drawBird() {
  if (birdImg.complete) {
    ctx.drawImage(birdImg, BIRD_X, birdY, BIRD_WIDTH, BIRD_HEIGHT);
  } else {
    // Fallback
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(BIRD_X, birdY, BIRD_WIDTH, BIRD_HEIGHT);
  }
}

// Draw pipes with tiling
function drawPipes() {
  pipes.forEach(p => {
    if (pipeImg.complete) {
      // Calculate image aspect ratio
      const imgAspect = pipeImg.width / pipeImg.height;
      const tileHeight = PIPE_W / imgAspect;
      
      // Draw top pipe (tiled)
      let currentY = 0;
      while (currentY < p.top) {
        const remainingHeight = p.top - currentY;
        const drawHeight = Math.min(tileHeight, remainingHeight);
        const srcHeight = (drawHeight / tileHeight) * pipeImg.height;
        
        ctx.drawImage(
          pipeImg,
          0, 0, pipeImg.width, srcHeight,
          p.x, currentY, PIPE_W, drawHeight
        );
        currentY += tileHeight;
      }
      
      // Draw bottom pipe (tiled)
      currentY = p.top + PIPE_GAP;
      while (currentY < canvas.height) {
        const remainingHeight = canvas.height - currentY;
        const drawHeight = Math.min(tileHeight, remainingHeight);
        const srcHeight = (drawHeight / tileHeight) * pipeImg.height;
        
        ctx.drawImage(
          pipeImg,
          0, 0, pipeImg.width, srcHeight,
          p.x, currentY, PIPE_W, drawHeight
        );
        currentY += tileHeight;
      }
      
      // Draw pipe caps for better look
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(p.x - 5, p.top - 15, PIPE_W + 10, 15);
      ctx.fillRect(p.x - 5, p.top + PIPE_GAP, PIPE_W + 10, 15);
      
    } else {
      // Fallback green pipes
      ctx.fillStyle = "#228B22";
      ctx.fillRect(p.x, 0, PIPE_W, p.top);
      ctx.fillRect(p.x, p.top + PIPE_GAP, PIPE_W, canvas.height - (p.top + PIPE_GAP));
      
      ctx.fillStyle = "#32CD32";
      ctx.fillRect(p.x - 5, p.top - 20, PIPE_W + 10, 20);
      ctx.fillRect(p.x - 5, p.top + PIPE_GAP, PIPE_W + 10, 20);
    }
  });
}

// Update game
function update() {
  if (!playing) return;
  
  // Update bird
  vel += GRAVITY;
  birdY += vel;
  
  // Spawn new pipes
  if (frame % PIPE_FREQUENCY === 0) {
    const minTop = 80;
    const maxTop = canvas.height - PIPE_GAP - 80;
    const top = minTop + Math.random() * (maxTop - minTop);
    pipes.push({ x: canvas.width, top: top, scored: false });
  }
  
  // Move pipes
  pipes.forEach(p => p.x -= PIPE_SPEED);
  
  // Remove off-screen pipes
  pipes = pipes.filter(p => p.x + PIPE_W > -50);
  
  // Check collisions and score
  for (let p of pipes) {
    // Collision detection with margin
    const margin = 5;
    if (p.x < BIRD_X + BIRD_WIDTH - margin && p.x + PIPE_W > BIRD_X + margin) {
      if (birdY + margin < p.top || birdY + BIRD_HEIGHT - margin > p.top + PIPE_GAP) {
        gameOver();
        return;
      }
    }
    
    // Score when passing pipe
    if (!p.scored && p.x + PIPE_W < BIRD_X) {
      score++;
      p.scored = true;
    }
  }
  
  // Check boundaries
  if (birdY < 0 || birdY + BIRD_HEIGHT > canvas.height) {
    gameOver();
    return;
  }
  
  frame++;
}

// Draw game
function draw() {
  // Sky background
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw clouds
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.beginPath();
  ctx.arc(100, 80, 30, 0, Math.PI * 2);
  ctx.arc(130, 75, 35, 0, Math.PI * 2);
  ctx.arc(165, 80, 30, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(300, 120, 25, 0, Math.PI * 2);
  ctx.arc(325, 115, 30, 0, Math.PI * 2);
  ctx.arc(355, 120, 25, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw game objects
  drawBird();
  drawPipes();
  
  // Draw score
  ctx.fillStyle = "#FFF";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.font = "bold 36px Arial";
  ctx.strokeText(score, 20, 50);
  ctx.fillText(score, 20, 50);
}

// Game over
function gameOver() {
  playing = false;
  
  if (score > best) {
    best = score;
  }
  
  // Save score to Firebase
  saveScore(userName, score);
  
  setTimeout(() => {
    if (confirm(`Game Over!\nScore: ${score}\nBest: ${best}\n\nPlay again?`)) {
      reset();
      playing = true;
      loop();
    } else {
      location.reload();
    }
  }, 100);
}

// Game loop
function loop() {
  update();
  draw();
  if (playing) {
    requestAnimationFrame(loop);
  }
}
