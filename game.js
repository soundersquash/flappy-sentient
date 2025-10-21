import { saveScore, subscribeLeaderboard } from "./firebase.js";

const canvas = document.getElementById("game");
const ctx    = canvas.getContext("2d");

function resize(){
  canvas.width  = document.getElementById("gameWrapper").clientWidth - 280 - 48;
  canvas.height = window.innerHeight - 48;
}
window.addEventListener("resize", resize);
resize();

const login   = document.getElementById("login");
const startBtn= document.getElementById("startBtn");
const userInp = document.getElementById("userName");

let userName = "", playing = false, best = 0;

const birdImg = new Image(); birdImg.src = "sentient-removebg-preview.png";
const pipeImg = new Image(); pipeImg.src = "unnamed-removebg-preview (1).png";

const PIPE_W   = 110;
const PIPE_GAP = 240;
const GRAVITY  = 0.45;
const JUMP     = -8.5;
const PIPE_SPD = 2.4;
const PIPE_FREQUENCY = 180; // Increased from 120 to spawn less frequently

let birdX = 90, birdY, vel, pipes=[], frame=0, score=0;

subscribeLeaderboard(list=>{
  document.getElementById("scoreList").innerHTML =
     list.map((s,i)=>`<li>${s.name} — ${s.score}</li>`).join("");
});

startBtn.onclick = ()=>{
  if(userInp.value.trim().length<2){ alert("2+ letters"); return; }
  userName = userInp.value.trim();
  login.style.display = "none";
  reset(); playing = true; loop();
};

canvas.addEventListener("click", ()=> playing && (vel = JUMP));
document.addEventListener("keydown", e=>{
  if(e.code==="Space"){ e.preventDefault(); playing && (vel = JUMP); }
});

function reset(){
  birdY = canvas.height / 2;
  vel   = 0;
  score = 0;
  frame = 0;
  // Start with one pipe that has pre-assigned random frame
  pipes=[{
    x: canvas.width, 
    top: 120 + Math.random() * (canvas.height - PIPE_GAP - 240),
    frameIdx: Math.floor(Math.random() * 4), // Random frame 0-3
    scored: false
  }];
}

function drawBird(){
  ctx.drawImage(birdImg, birdX, birdY, 50, 42);
}

/*  ===  FIXED: proper obstacle rendering like Flappy Bird  ===  */
function drawPipes(){
  const COLS    = 4;
  const FRAME_W = pipeImg.width / COLS;
  const FRAME_H = pipeImg.height;

  pipes.forEach((p) => {
    const sx = p.frameIdx * FRAME_W;
    
    // Fixed size for obstacles (not random scaled)
    const dogWidth = 80;  // Width of each dog obstacle
    const dogHeight = (FRAME_H / FRAME_W) * dogWidth; // Maintain aspect ratio
    
    // Center the dog in the pipe area
    const offsetX = (PIPE_W - dogWidth) / 2;

    // TOP OBSTACLE - Fill from top to gap with repeating dogs
    const topHeight = p.top;
    const numDogsTop = Math.ceil(topHeight / dogHeight);
    
    for(let i = 0; i < numDogsTop; i++){
      const yPos = i * dogHeight;
      const remainingHeight = topHeight - yPos;
      const drawHeight = Math.min(dogHeight, remainingHeight);
      
      ctx.drawImage(
        pipeImg, 
        sx, 0, FRAME_W, (drawHeight / dogHeight) * FRAME_H,
        p.x + offsetX, yPos, dogWidth, drawHeight
      );
    }

    // BOTTOM OBSTACLE - Fill from gap to bottom with repeating dogs
    const bottomStart = p.top + PIPE_GAP;
    const bottomHeight = canvas.height - bottomStart;
    const numDogsBottom = Math.ceil(bottomHeight / dogHeight);
    
    for(let i = 0; i < numDogsBottom; i++){
      const yPos = bottomStart + (i * dogHeight);
      const remainingHeight = canvas.height - yPos;
      const drawHeight = Math.min(dogHeight, remainingHeight);
      
      ctx.drawImage(
        pipeImg, 
        sx, 0, FRAME_W, (drawHeight / dogHeight) * FRAME_H,
        p.x + offsetX, yPos, dogWidth, drawHeight
      );
    }
    
    // Optional: Draw a cap/edge at the gap for better visibility
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(p.x, p.top - 5, PIPE_W, 5); // Top cap
    ctx.fillRect(p.x, p.top + PIPE_GAP, PIPE_W, 5); // Bottom cap
  });
}

function update(){
  if(!playing) return;
  vel += GRAVITY;
  birdY += vel;
  
  // Spawn new pipe less frequently and with random properties
  if(frame % PIPE_FREQUENCY === 0){
    const minTop = 120;
    const maxTop = canvas.height - PIPE_GAP - 120;
    pipes.push({
      x: canvas.width, 
      top: minTop + Math.random() * (maxTop - minTop),
      frameIdx: Math.floor(Math.random() * 4), // Random dog frame
      scored: false
    });
  }
  
  // Move pipes
  pipes.forEach(p => p.x -= PIPE_SPD);
  
  // Remove off-screen pipes
  pipes = pipes.filter(p => p.x + PIPE_W > -50);
  
  // Collision detection with actual visual size
  for(let p of pipes){
    const dogWidth = 80; // Must match the width in drawPipes
    const offsetX = (PIPE_W - dogWidth) / 2;
    const visualX = p.x + offsetX;
    
    // Check collision with actual visual bounds (with small margin for forgiveness)
    const margin = 5;
    if(birdX + 50 - margin > visualX && birdX + margin < visualX + dogWidth){
      if(birdY + margin < p.top || birdY + 42 - margin > p.top + PIPE_GAP){
        gameOver();
        return;
      }
    }
    
    // Score when passing the pipe
    if(p.x + PIPE_W < birdX && !p.scored){
      score++;
      p.scored = true;
    }
  }
  
  // Boundary check
  if(birdY < 0 || birdY + 42 > canvas.height) gameOver();
  
  frame++;
}

function draw(){
  // Sky background
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  drawBird();
  drawPipes();
  
  // Score display
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.font = "bold 36px Arial";
  ctx.strokeText(score, 25, 45);
  ctx.fillText(score, 25, 45);
}

function gameOver(){
  playing = false;
  if(score > best) best = score;
  saveScore(userName, score);
  setTimeout(()=>{
    if(confirm(`Score: ${score}\nBest: ${best}\nPlay again?`)){
      reset();
      playing = true;
      loop();
    } else {
      location.reload();
    }
  }, 100);
}

function loop(){
  update();
  draw();
  if(playing) requestAnimationFrame(loop);
}
