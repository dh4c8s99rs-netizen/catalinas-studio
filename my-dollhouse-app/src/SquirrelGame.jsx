import React, { useState, useEffect, useRef } from 'react';
import Squirrel1 from './assets/squirrel1.svg';
import Squirrel2 from './assets/squirrel2.svg';
import AcornSVG from './assets/acorn.svg';
import GoldenAcornSVG from './assets/goldenacorn.svg';
import BlueberrySVG from './assets/blueberry.svg';
import TimesUpSVG from './assets/timesup.svg';
import PlayAgainSVG from './assets/playagain.svg';

const GAME_WIDTH = 380;
const GAME_HEIGHT = 620;
const SQUIRREL_SIZE = 48;
const ACORN_SIZE = 36;
const GOLDEN_ACORN_SIZE = 42;
const BLUEBERRY_SIZE = 30;
const TOTAL_ACORNS = 20;
const GAME_DURATION = 30;
const SPEED = 6;

// Golden acorn: max 2 total appearances per game
const GOLDEN_ACORN_MAX = 2;
// Blueberry: ~40% of acorn frequency (acorns spawn on collect/disappear; blueberries are rarer)
const BLUEBERRY_SPAWN_CHANCE = 0.18; // chance per regular acorn replacement event

let itemIdCounter = TOTAL_ACORNS + 10;

// item types: 'acorn' | 'goldenacorn' | 'blueberry'
function makeItem(id, type, elapsed = 0) {
  const size = type === 'goldenacorn' ? GOLDEN_ACORN_SIZE : type === 'blueberry' ? BLUEBERRY_SIZE : ACORN_SIZE;
  return {
    id,
    type,
    x: 40 + Math.random() * (GAME_WIDTH - 80),
    y: 40 + Math.random() * (GAME_HEIGHT - 80),
    wobble: Math.random() * 2 * Math.PI,
    visible: true,
    // Golden acorns disappear faster to make them feel precious
    disappearAt: elapsed + (type === 'goldenacorn' ? 6 + Math.random() * 5 : 8 + Math.random() * 12),
    size,
    points: type === 'goldenacorn' ? 10 : type === 'blueberry' ? 2 : 1,
  };
}

function randomAcorns() {
  return Array.from({ length: TOTAL_ACORNS }, (_, i) => makeItem(i, 'acorn', 0));
}

export default function SquirrelGame({ onClose }) {
  const [squirrelPos, setSquirrelPos] = useState({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
  const [squirrelFacing, setSquirrelFacing] = useState(1);
  const [isMoving, setIsMoving] = useState(false);
  const [items, setItems] = useState(randomAcorns);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('squirrelHighScore') || '0'));

  const keysRef = useRef({});
  const posRef = useRef({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
  const itemsRef = useRef(items);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const elapsedRef = useRef(0);
  const goldenAcornCountRef = useRef(0); // how many golden acorns have spawned this game
  const goldenAcornActiveRef = useRef(false); // only one on screen at a time
  const gameAreaRef = useRef(null);

  // Sync items ref
  useEffect(() => { itemsRef.current = items; }, [items]);

  // ── Mobile scroll freeze ──────────────────────────────────────────────────
  // Attach non-passive touch listeners to the game area so we can preventDefault
  useEffect(() => {
    const el = gameAreaRef.current;
    if (!el) return;

    const preventScroll = (e) => {
      if (!gameOverRef.current) e.preventDefault();
    };

    el.addEventListener('touchstart', preventScroll, { passive: false });
    el.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      el.removeEventListener('touchstart', preventScroll);
      el.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    };
    const up = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Touch/swipe controls
  const touchStart = useRef(null);
  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchMove = (e) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      keysRef.current['ArrowRight'] = dx > 0;
      keysRef.current['ArrowLeft'] = dx < 0;
      keysRef.current['ArrowUp'] = false;
      keysRef.current['ArrowDown'] = false;
    } else {
      keysRef.current['ArrowUp'] = dy < 0;
      keysRef.current['ArrowDown'] = dy > 0;
      keysRef.current['ArrowLeft'] = false;
      keysRef.current['ArrowRight'] = false;
    }
  };
  const handleTouchEnd = () => { keysRef.current = {}; touchStart.current = null; };

  // Decide what to spawn when a slot opens up
  function spawnReplacement(elapsed) {
    // Try golden acorn first: only if under max and none currently on screen
    if (
      goldenAcornCountRef.current < GOLDEN_ACORN_MAX &&
      !goldenAcornActiveRef.current &&
      Math.random() < 0.12 // ~12% chance per spawn event
    ) {
      goldenAcornCountRef.current += 1;
      goldenAcornActiveRef.current = true;
      return makeItem(++itemIdCounter, 'goldenacorn', elapsed);
    }
    // Blueberry chance
    if (Math.random() < BLUEBERRY_SPAWN_CHANCE) {
      return makeItem(++itemIdCounter, 'blueberry', elapsed);
    }
    return makeItem(++itemIdCounter, 'acorn', elapsed);
  }

  // Game loop
  useEffect(() => {
    if (gameOver) return;
    let last = performance.now();
    let raf;

    const loop = (now) => {
      if (gameOverRef.current) return;
      const dt = (now - last) / 1000;
      last = now;
      elapsedRef.current += dt;

      // Move squirrel
      let { x, y } = posRef.current;
      let moved = false;
      let newFacing = null;
      if (keysRef.current['ArrowRight']) { x = Math.min(GAME_WIDTH - SQUIRREL_SIZE, x + SPEED); moved = true; newFacing = 1; }
      if (keysRef.current['ArrowLeft']) { x = Math.max(0, x - SPEED); moved = true; newFacing = -1; }
      if (keysRef.current['ArrowUp']) { y = Math.max(0, y - SPEED); moved = true; }
      if (keysRef.current['ArrowDown']) { y = Math.min(GAME_HEIGHT - SQUIRREL_SIZE, y + SPEED); moved = true; }

      posRef.current = { x, y };
      setSquirrelPos({ x, y });
      setIsMoving(moved);
      if (newFacing) setSquirrelFacing(newFacing);

      // Check collisions + spawn replacements
      let spawned = [];
      const updated = itemsRef.current.map(a => {
        if (!a.visible) return a;

        // Expire
        if (elapsedRef.current >= a.disappearAt) {
          if (a.type === 'goldenacorn') goldenAcornActiveRef.current = false;
          spawned.push(spawnReplacement(elapsedRef.current));
          return { ...a, visible: false };
        }

        // Collision
        const cx = a.x + a.size / 2;
        const cy = a.y + a.size / 2;
        const sx = x + SQUIRREL_SIZE / 2;
        const sy = y + SQUIRREL_SIZE / 2;
        const dist = Math.sqrt((cx - sx) ** 2 + (cy - sy) ** 2);
        if (dist < (SQUIRREL_SIZE / 2 + a.size / 2) * 0.8) {
          if (a.type === 'goldenacorn') goldenAcornActiveRef.current = false;
          scoreRef.current += a.points;
          setScore(scoreRef.current);
          spawned.push(spawnReplacement(elapsedRef.current));
          return { ...a, visible: false };
        }

        return a;
      });

      const next = [...updated, ...spawned];
      itemsRef.current = next;
      setItems([...next]);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameOver]);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          gameOverRef.current = true;
          setGameOver(true);
          const hs = Math.max(scoreRef.current, parseInt(localStorage.getItem('squirrelHighScore') || '0'));
          localStorage.setItem('squirrelHighScore', hs);
          setHighScore(hs);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver]);

  // Wobble tick
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 50);
    return () => clearInterval(t);
  }, []);

  const restart = () => {
    posRef.current = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
    scoreRef.current = 0;
    elapsedRef.current = 0;
    gameOverRef.current = false;
    goldenAcornCountRef.current = 0;
    goldenAcornActiveRef.current = false;
    setSquirrelPos({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setItems(randomAcorns());
  };

  // Item image lookup
  function itemSrc(type) {
    if (type === 'goldenacorn') return GoldenAcornSVG;
    if (type === 'blueberry') return BlueberrySVG;
    return AcornSVG;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="relative flex flex-col items-center animate-[popIn_0.3s_ease-out_forwards]">

        {/* Header */}
        <div className="w-full flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-lg">🌰 {score}</span>
            <span className="text-white/60 text-xs font-bold">best: {highScore}</span>
          </div>
          <div className={`font-black text-xl ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm transition-all"
          >✕</button>
        </div>

        {/* Game area */}
        <div
          ref={gameAreaRef}
          className="relative rounded-2xl overflow-hidden"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT, background: 'transparent', touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Items */}
          {items.map(a => a.visible && (
            <img
              key={a.id}
              src={itemSrc(a.type)}
              alt={a.type}
              style={{
                position: 'absolute',
                left: a.x,
                top: a.y,
                width: a.size,
                height: a.size,
                transform: `rotate(${Math.sin(tick * 0.15 + a.wobble) * 15}deg) scale(${1 + Math.sin(tick * 0.2 + a.wobble) * 0.1})`,
                transition: 'transform 0.05s',
                opacity: elapsedRef.current > a.disappearAt - 3 ? 0.4 : 1,
                // Golden acorns get a glow
                filter: a.type === 'goldenacorn'
                  ? `drop-shadow(0 0 6px gold) ${elapsedRef.current > a.disappearAt - 3 ? 'opacity(0.4)' : ''}`
                  : 'none',
              }}
            />
          ))}

          {/* Squirrel */}
          <img
            src={isMoving ? Squirrel1 : Squirrel2}
            alt="squirrel"
            style={{
              position: 'absolute',
              left: squirrelPos.x,
              top: squirrelPos.y,
              width: SQUIRREL_SIZE,
              height: SQUIRREL_SIZE,
              transform: `scaleX(${squirrelFacing})`,
              transition: 'transform 0.1s',
              zIndex: 10,
            }}
          />

          {/* Game over overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 rounded-xl">
              {/* Time's up SVG */}
              <img src={TimesUpSVG} alt="Time's up!" className="w-48" />

              <p className="text-white text-lg font-bold">
                you collected <span className="text-amber-400 text-2xl">{score}</span> points
              </p>
              {score >= highScore && score > 0 && (
                <p className="text-amber-400 font-black text-sm tracking-widest uppercase animate-pulse">✦ new high score! ✦</p>
              )}
              <p className="text-white/60 text-xs">best: {highScore} 🌰</p>

              {/* Play again SVG button */}
              <button onClick={restart} className="mt-2 transition-all hover:scale-105 active:scale-95">
                <img src={PlayAgainSVG} alt="Play again" className="w-36" />
              </button>

              <button onClick={onClose} className="text-white/60 text-xs hover:text-white transition-colors">close</button>
            </div>
          )}

          {/* Mobile arrow controls */}
          <div className="absolute bottom-4 right-4 grid grid-cols-3 gap-1 opacity-60">
            {[
              { key: 'ArrowUp', label: '↑', col: 2, row: 1 },
              { key: 'ArrowLeft', label: '←', col: 1, row: 2 },
              { key: 'ArrowDown', label: '↓', col: 2, row: 2 },
              { key: 'ArrowRight', label: '→', col: 3, row: 2 },
            ].map(btn => (
              <button
                key={btn.key}
                onPointerDown={() => { keysRef.current[btn.key] = true; }}
                onPointerUp={() => { keysRef.current[btn.key] = false; }}
                onPointerLeave={() => { keysRef.current[btn.key] = false; }}
                className="w-9 h-9 bg-white/30 rounded-lg text-white font-bold flex items-center justify-center active:bg-white/50 select-none"
                style={{ gridColumn: btn.col, gridRow: btn.row }}
              >{btn.label}</button>
            ))}
          </div>
        </div>

        <p className="text-white/50 text-[10px] mt-2 tracking-widest uppercase">arrow keys or swipe to move</p>
      </div>
    </div>
  );
}
