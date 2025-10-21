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

let birdX = 90, birdY, vel, pipes=[], frame=0, score=0;

subscribeLeaderboard(list=>{
  document.getElementById("scoreList").innerHTML =
     list.map((s,i)=>`<li>${s.name} – ${s.score}</li>`).join("");
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
  pipes=[{x:canvas.width, top:120+Math.random()*(canvas.height-PIPE_GAP-240)}];
}

function drawBird(){
  ctx.drawImage(birdImg, birdX, birdY, 50, 42);
}

/*  ===  NEW: unstretched dog  ===  */
function drawPipes(){
  /*  ----  sprite sheet data  ----  */
  const COLS       = 4;                 // 4 dogs in a row inside the PNG
  const FRAME_W    = pipeImg.width / COLS;
  const FRAME_H    = pipeImg.height;    // 1 row high

  pipes.forEach((p, idx) => {
    /*  ----  random scale  ----  */
    const MIN_SCALE = 0.35;
    const MAX_SCALE = 0.65;
    const scale     = MIN_SCALE + Math.random() * (MAX_SCALE - MIN_SCALE);

    /*  ----  random frame (0-3)  ----  */
    const frameIdx  = Math.floor(Math.random() * COLS);
    const sx        = frameIdx * FRAME_W;   // cut start x

    /*  ----  final draw size  ----  */
    const drawW = FRAME_W * scale;
    const drawH = FRAME_H * scale;

    /*  ----  centre horizontally  ----  */
    const offsetX = (PIPE_W - drawW) / 2;

    /*  ----  draw top & bottom dog  ----  */
    ctx.drawImage(pipeImg, sx, 0, FRAME_W, FRAME_H,
                         p.x + offsetX, p.top - drawH, drawW, drawH);

    ctx.drawImage(pipeImg, sx, 0, FRAME_W, FRAME_H,
                         p.x + offsetX, p.top + PIPE_GAP, drawW, drawH);
  });
}

function update(){
  if(!playing) return;
  vel += GRAVITY;  birdY += vel;
  if(frame % 120 === 0){
    pipes.push({x:canvas.width, top:120+Math.random()*(canvas.height-PIPE_GAP-240)});
  }
  pipes.forEach(p=> p.x -= PIPE_SPD);
  for(let p of pipes){
    if(p.x < birdX+50 && p.x+PIPE_W > birdX){
      if(birdY < p.top || birdY+42 > p.top+PIPE_GAP){ gameOver(); return; }
    }
    if(p.x+PIPE_W < birdX && !p.scored){ score++; p.scored=true; }
  }
  if(birdY < 0 || birdY+42 > canvas.height) gameOver();
  frame++;
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBird(); drawPipes();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 32px Arial";
  ctx.fillText(score, 25, 45);
}

function gameOver(){
  playing=false;
  if(score>best) best=score;
  saveScore(userName, score);
  setTimeout(()=>{
    if(confirm(`Score: ${score}\nPlay again?`)){ reset(); playing=true; loop(); }
    else location.reload();
  },100);
}

function loop(){
  update(); draw(); if(playing) requestAnimationFrame(loop);
}


