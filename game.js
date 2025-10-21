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
  // Start with one pipe that has pre-assigned random properties
  pipes=[{
    x: canvas.width, 
    top: 120 + Math.random() * (canvas.height - PIPE_GAP - 240),
    scale: 0.45 + Math.random() * 0.15, // Random scale between 0.45-0.6
    frameIdx: Math.floor(Math.random() * 4) // Random frame 0-3
  }];
}

function drawBird(){
  ctx.drawImage(birdImg, birdX, birdY, 50, 42);
}

/*  ===  FIXED: consistent dog rendering  ===  */
function drawPipes(){
  const COLS    = 4;
  const FRAME_W = pipeImg.width / COLS;
  const FRAME_H = pipeImg.height;

  pipes.forEach((p) => {
    // Use the pipe's stored scale and frameIdx (set once when created)
    const sx    = p.frameIdx * FRAME_W;
    const drawW = FRAME_W * p.scale;
    const drawH = FRAME_H * p.scale;
    const offsetX = (PIPE_W - drawW) / 2;

    // Draw top dog (upside down or normal - your choice)
    ctx.save();
    ctx.translate(p.x + PIPE_W/2, p.top);
    ctx.scale(1, -1); // Flip vertically for top obstacle
    ctx.drawImage(pipeImg, sx, 0, FRAME_W, FRAME_H,
                  -drawW/2, 0, drawW, drawH);
    ctx.restore();

    // Draw bottom dog
    ctx.drawImage(pipeImg, sx, 0, FRAME_W, FRAME_H,
                  p.x + offsetX, p.top + PIPE_GAP, drawW, drawH);
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
      scale: 0.45 + Math.random() * 0.15, // Random scale 0.45-0.6
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
    const FRAME_W = pipeImg.width / 4;
    const FRAME_H = pipeImg.height;
    const drawW = FRAME_W * p.scale;
    const drawH = FRAME_H * p.scale;
    const offsetX = (PIPE_W - drawW) / 2;
    
    // Actual x position and width of the visual dog
    const visualX = p.x + offsetX;
    const visualW = drawW;
    
    // Check collision with actual visual bounds
    if(birdX + 50 > visualX && birdX < visualX + visualW){
      if(birdY < p.top || birdY + 42 > p.top + PIPE_GAP){
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
