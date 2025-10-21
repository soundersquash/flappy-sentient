import { collection, addDoc, query, orderBy, limit, onSnapshot }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const col = collection(window.db, "scores");

export async function saveScore(name, score){
  await addDoc(col, { name, score, ts: Date.now() });
}

export function subscribeLeaderboard(cb){
  const q = query(col, orderBy("score","desc"), limit(10));
  onSnapshot(q, snap=> cb(snap.docs.map(d=>({...d.data()}))) );
}