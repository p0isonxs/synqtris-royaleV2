import React, { useEffect, useRef, useState } from "react";

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const TETROMINOES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
};
const COLORS = {
  I: "#00f0f0",
  O: "#f0f000",
  T: "#a000f0",
  S: "#00f000",
  Z: "#f00000",
  J: "#0000f0",
  L: "#f0a000",
};

function getRandomTetromino() {
  const keys = Object.keys(TETROMINOES);
  const rand = keys[Math.floor(Math.random() * keys.length)];
  return { shape: TETROMINOES[rand], type: rand };
}

function rotate(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      result[x][rows - 1 - y] = matrix[y][x];
    }
  }
  return result;
}

function SynqtrisGame() {
  const canvasRef = useRef(null);
  const [grid, setGrid] = useState(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const [current, setCurrent] = useState(getRandomTetromino());
  const [position, setPosition] = useState({ x: 3, y: 0 });
  const [tick, setTick] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [username, setUsername] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const SUPABASE_URL = "https://drvegjjbjxryogrxrhpz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydmVnampianhyeW9ncnhyaHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzEyNzIsImV4cCI6MjA2NTkwNzI3Mn0._UMUfA4sxx96oA7d4h9YwgUo1ZpZZOnLgQxgOgrxO68";

const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = () => {
      fetch(`${SUPABASE_URL}/rest/v1/scores?select=*&order=score.desc&limit=5`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      })
        .then(res => res.json())
        .then(data => {
          const sorted = data.sort((a, b) => b.score - a.score).slice(0, 5);
          setLeaderboard(sorted);
          setLoadingLeaderboard(false);
        });
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000); // update every 10 seconds

    if (gameOver || !hasStarted) return;
    const id = setInterval(() => {
      setTick(t => t + 1);
    }, 800);

    return () => {
      clearInterval(id);
      clearInterval(interval);
    };
  }, [gameOver, hasStarted]);

    

  useEffect(() => {
    if (!gameOver && hasStarted) moveDown();
  }, [tick]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (gameOver || !hasStarted) return;
      if (e.key === "ArrowLeft") {
        move(-1);
      } else if (e.key === "ArrowRight") {
        move(1);
      } else if (e.key === "ArrowDown") {
        moveDown();
      } else if (e.key === "ArrowUp") {
        const rotated = rotate(current.shape);
        if (canMove(rotated, position.x, position.y)) {
          setCurrent(cur => ({ ...cur, shape: rotated }));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [current, position, grid, gameOver, hasStarted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    draw(ctx);
  }, [grid, current, position]);

  function move(dir) {
    const newX = position.x + dir;
    if (canMove(current.shape, newX, position.y)) {
      setPosition(pos => ({ ...pos, x: newX }));
    }
  }

  function moveDown() {
    const nextY = position.y + 1;
    if (!canMove(current.shape, position.x, nextY)) {
      const newGrid = grid.map((row) => [...row]);
      for (let y = 0; y < current.shape.length; y++) {
        for (let x = 0; x < current.shape[y].length; x++) {
          if (current.shape[y][x]) {
            const newY = position.y + y;
            const newX = position.x + x;
            if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
              newGrid[newY][newX] = COLORS[current.type];
            }
          }
        }
      }
      const linesCleared = clearLines(newGrid);
      setScore(prev => prev + linesCleared * 100);
      setGrid(newGrid);
      const next = getRandomTetromino();
      if (!canMove(next.shape, 3, 0)) {
        setGameOver(true);
        fetch(`${SUPABASE_URL}/rest/v1/scores?name=eq.${username}`, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.length === 0 || score + linesCleared * 100 > data[0].score) {
              fetch(`${SUPABASE_URL}/rest/v1/scores`, {
                method: "POST",
                headers: {
                  apikey: SUPABASE_KEY,
                  Authorization: `Bearer ${SUPABASE_KEY}`,
                  "Content-Type": "application/json",
                  Prefer: "resolution=merge-duplicates"
                },
                body: JSON.stringify({
                  name: username,
                  score: score + linesCleared * 100
                })
              });
            }
          });
        setTimeout(() => {
          alert("Game Over. Final Score for " + username + ": " + (score + linesCleared * 100));
        }, 100);
        return;
      }
      setCurrent(next);
      setPosition({ x: 3, y: 0 });
    } else {
      setPosition(pos => ({ ...pos, y: nextY }));
    }
  }

  function draw(ctx) {
    ctx.clearRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);
    drawGrid(ctx);
    drawTetromino(ctx, current.shape, position.x, position.y, COLORS[current.type]);
  }

  function drawGrid(ctx) {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (grid[y][x]) {
          ctx.fillStyle = grid[y][x];
          ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        } else {
          ctx.strokeStyle = "#ccc";
          ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      }
    }
  }

  function drawTetromino(ctx, shape, offsetX, offsetY, color) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const drawX = offsetX + x;
          const drawY = offsetY + y;
          if (drawY >= 0) {
            const grad = ctx.createLinearGradient(
  drawX * BLOCK_SIZE,
  drawY * BLOCK_SIZE,
  (drawX + 1) * BLOCK_SIZE,
  (drawY + 1) * BLOCK_SIZE
);
grad.addColorStop(0, "#ffffff22");
grad.addColorStop(1, color);
ctx.fillStyle = grad;
ctx.save();
ctx.fillRect(drawX * BLOCK_SIZE, drawY * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
ctx.restore();

ctx.strokeStyle = "#ffffff55";
ctx.lineWidth = 1.2;
ctx.strokeRect(drawX * BLOCK_SIZE + 0.5, drawY * BLOCK_SIZE + 0.5, BLOCK_SIZE - 1, BLOCK_SIZE - 1);

ctx.shadowColor = color;
ctx.shadowBlur = 20;
ctx.shadowOffsetX = 2;
ctx.shadowOffsetY = 2;
          }
        }
      }
    }
  }

  function canMove(shape, offsetX, offsetY) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newY = offsetY + y;
          const newX = offsetX + x;
          if (newY >= ROWS || newX < 0 || newX >= COLS || (newY >= 0 && grid[newY][newX])) {
            return false;
          }
        }
      }
    }
    return true;
  }

  function clearLines(currentGrid) {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (currentGrid[y].every(cell => cell)) {
        currentGrid.splice(y, 1);
        currentGrid.unshift(Array(COLS).fill(0));
        linesCleared++;
        y++;
      }
    }
    return linesCleared;
  }

  function resetGame() {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    setCurrent(getRandomTetromino());
    setPosition({ x: 3, y: 0 });
    setScore(0);
    setTick(0);
    setGameOver(false);
    setHasStarted(true);
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-black via-indigo-900 to-purple-950 text-white font-mono">
      <h1 className="text-4xl font-extrabold my-6 tracking-wide bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-500 text-transparent bg-clip-text drop-shadow-md">Synqtris Royale</h1>
      {!hasStarted && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2 rounded mr-2 bg-slate-900 text-white placeholder-cyan-300 border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg shadow hover:from-green-400 hover:to-teal-400"
            onClick={resetGame}
            disabled={!username.trim()}
          >
            Start Game
          </button>
        </div>
      )}

      {hasStarted && <p className="text-lg font-medium mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-800 to-purple-700 shadow-md">Player: {username} | Score: {score}</p>}

      {gameOver && (
        <>
          <p className="text-red-600 font-bold mb-2">Game Over</p>
          <button
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:from-blue-400 hover:to-indigo-500"
            onClick={resetGame}
          >
            Restart
          </button>
        </>
      )}

      <canvas ref={canvasRef} className="border-4 border-cyan-400 mt-4 bg-black rounded-lg shadow-lg" />

      <div className="mt-6 w-full max-w-xs">
        <h2 className="text-lg font-semibold mb-2">🏆 Leaderboard</h2>
        <ul className="bg-slate-800 border border-cyan-500 rounded-xl shadow-md text-cyan-200 divide-y divide-cyan-600 overflow-hidden">
  {loadingLeaderboard ? (
    <li className="px-4 py-3 text-center text-cyan-400">Loading...</li>
  ) : leaderboard.length === 0 ? (
    <li className="px-4 py-3 text-center">No scores yet</li>
  ) : (
    leaderboard.map((entry, index) => (
      <li
        key={index}
        className="flex justify-between items-center px-4 py-3 hover:bg-cyan-700/10 transition-all"
      >
        <div className="flex gap-2 items-center">
          <span className="font-bold text-lg text-cyan-300">#{index + 1}</span>
          <span className="text-base font-medium">{entry.name}</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{entry.score} pts</p>
          <p className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </li>
    ))
  )}
</ul>
      </div>
    </div>
  );
}

export default SynqtrisGame;
