import { saveScore, subscribeLeaderboard } from "./firebase.js";

const canvas = document.getElementById("game");
const ctx    = canvas.getContext("2d");

function resize(){
  canvas.width  = window.innerWidth - 260;   /* leave 260px for panel */
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const login   = document.getElementById("login");
const startBtn= document.getElementById("startBtn");
const userInp = document.getElementById("userName");

let userName = "", playing = false, best = 0;

const birdImg = new Image(); birdImg.src = "sentient-removebg-preview.png";
const pipeImg = new Image(); pipeImg.src = "unnamed-removebg-preview (1).png";

/* ------------- constants ------------- */
const PIPE_W   = 110;               /* slightly wider so whole dog shows */
const PIPE_GAP = 240;               /* bigger gap */
const GRAVITY  = 0.45;
const JUMP     = -8.5;
const PIPE_SPD = 2.4;

let birdX = 90, birdY, vel, pipes=[], frame=0, score=0;

/* ------------- leaderboard ------------- */
subscribeLeaderboard(list=>{
  document.getElementById("scoreList").innerHTML =
     list.map((s,i)=>`<li>${s.name} – ${s.score}</li>`).join("");
});

/* ------------- start button ------------- */
startBtn.onclick = ()=>{
  if(userInp.value.trim().length<2){ alert("2+ letters"); return; }
  userName = userInp.value.trim();
  login.style.display = "none";
  reset(); playing = true; loop();
};

/* ------------- controls ------------- */
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

function drawPipes(){
  pipes.forEach(p=>{
    /* top pipe */
    ctx.drawImage(pipeImg, p.x, 0, PIPE_W, p.top);
    /* bottom pipe - full height remaining */
    ctx.drawImage(pipeImg, p.x, p.top+PIPE_GAP, PIPE_W, canvas.height);
  });
}

function update(){
  if(!playing) return;
  vel += GRAVITY;
  birdY += vel;

  /* spawn pipe */
  if(frame % 120 === 0){
    pipes.push({x:canvas.width, top:120+Math.random()*(canvas.height-PIPE_GAP-240)});
  }
  pipes.forEach(p=> p.x -= PIPE_SPD);

  /* collision */
  for(let p of pipes){
    if(p.x < birdX+50 && p.x+PIPE_W > birdX){
      if(birdY < p.top || birdY+42 > p.top+PIPE_GAP){ gameOver(); return; }
    }
    if(p.x+PIPE_W < birdX && !p.scored){ score++; p.scored=true; }
  }

  /* boundaries */
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
  playing = false;
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
