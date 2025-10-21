import { saveScore, subscribeLeaderboard } from "./firebase.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const login = document.getElementById("login");
const startBtn = document.getElementById("startBtn");
const userNameInput = document.getElementById("userName");

let userName = "", playing = false, best = 0;
const birdImg = new Image(); birdImg.src = "sentient-removebg-preview.png";
const pipeImg = new Image(); pipeImg.src = "unnamed-removebg-preview (1).png";

const BIRD_X = 80;
let birdY = 250, vel = 0;
const GRAVITY = 0.45, JUMP = -7.2, PIPE_W = 100, PIPE_GAP = 180;
let pipes = [], frame = 0, score = 0;

subscribeLeaderboard(list=>{
  document.getElementById("scoreList").innerHTML =
     list.map((s,i)=>`<li>${s.name} – ${s.score}</li>`).join("");
});

startBtn.onclick = ()=>{
  if(userNameInput.value.trim().length<2){ alert("2+ letters"); return; }
  userName = userNameInput.value.trim();
  login.style.display = "none";
  canvas.style.display = "block";
  reset(); playing = true; loop();
};

canvas.addEventListener("click",()=> playing && (vel = JUMP));
document.addEventListener("keydown",e=>{ if(e.code==="Space"){ e.preventDefault(); playing && (vel = JUMP); }});

function reset(){ birdY = 250; vel = 0; score = 0; frame = 0; pipes = [{x:400, top:120}]; }

function drawBird(){ ctx.drawImage(birdImg, BIRD_X, birdY, 50, 42); }

function drawPipes(){
  pipes.forEach(p=>{
    ctx.drawImage(pipeImg, p.x, 0, PIPE_W, p.top);
    ctx.drawImage(pipeImg, p.x, p.top+PIPE_GAP, PIPE_W, 600);
  });
}

function update(){
  if(!playing) return;
  vel += GRAVITY; birdY += vel;
  if(frame % 100 === 0) pipes.push({x:400, top:100+Math.random()*250});
  pipes.forEach(p=> p.x -= 2.5);
  for(let p of pipes){
    if(p.x<BIRD_X+50 && p.x+PIPE_W>BIRD_X){
      if(birdY<p.top || birdY+42>p.top+PIPE_GAP){ gameOver(); return; }
    }
    if(p.x+PIPE_W===BIRD_X) score++;
  }
  if(birdY<0 || birdY+42>600) gameOver();
  frame++;
}

function draw(){ ctx.clearRect(0,0,400,600); drawBird(); drawPipes(); ctx.fillStyle="#fff"; ctx.font="24px Arial"; ctx.fillText(score,20,40); }

function gameOver(){
  playing = false; if(score>best) best=score;
  saveScore(userName, score);
  setTimeout(()=>{ if(confirm(`Score: ${score}\nAgain?`)){ reset(); playing=true; loop(); }else location.reload(); },100);
}


function loop(){ update(); draw(); if(playing) requestAnimationFrame(loop); }
