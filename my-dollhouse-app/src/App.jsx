import React, { useState, useEffect } from 'react';
import './index.css';
import { db } from './firebase.js';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// --- FIGMA VECTOR ASSET IMPORTS ---
import RoofSVG from './assets/roof.svg';
import PaintingFloorSVG from './assets/painting-floor.svg';
import PatternFloorSVG from './assets/pattern-floor.svg';
import CallFloorSVG from './assets/call-floor.svg';
import CarSVG from './assets/car.svg';
import PigeonSVG from './assets/pigeon.svg';
import MothA from './assets/moth_a.svg';
import MothB from './assets/moth_b.svg';
import FloorSVG from './assets/floor.svg';
import DrivewaySVG from './assets/driveway.svg';
import Book1 from './assets/books1.svg';
import Book2 from './assets/books2.svg';
import Book3 from './assets/books3.svg';
import PaintTube1 from './assets/paint-tube1.svg';
import PaintTube2 from './assets/paint-tube2.svg';
import PaintTube3 from './assets/paint-tube3.svg';

// --- INTERACTIVE ASSET IMPORTS ---
import ToDoListSVG from './assets/to-do-list.svg';
import PencilSVG from './assets/pencil.svg';
import CupSVG from './assets/cup.svg';
import CloudSVG from './assets/cloud.svg';

// --- CHARACTER ASSET IMPORTS ---
import Cata1 from './assets/cata1.svg';
import Cata2 from './assets/cata2.svg';
import Cata3 from './assets/cata3.svg';

const STATUS_BUTTONS = [
  { id: 'painting', label: 'Painting', icon: '🎨' },
  { id: 'pattern', label: 'Pattern', icon: '✦' },
  { id: 'call', label: 'Live Call', icon: '🎙️' },
  { id: 'coffee', label: 'Coffee', icon: '☕' },
  { id: 'out', label: 'Out of Office', icon: '🚙' }
];

const ROOM_TASKS = {
  painting: ['I\'m painting', 'I\'m mixing colors', 'I\'m stretching canvases', 'I\'m working on my website', 'I\'m posting my painting', 'I\'m packing orders'],
  pattern: ['I\'m designing patterns', 'I\'m pitching my portfolio', 'I\'m sending email to vendors', 'I\'m designing on illustrator', 'I\'m choosing color combinations', 'I\'m creating mock-ups'],
  call: ['I\'m on a call with London', 'I\'m on a call with New York', 'I\'m reading a brief', 'I\'m sending invoices', 'I\'m doing taxes', 'I\'m writing emails', 'I\'m sending deliverables'],
  coffee: ['I\'m having a coffee', 'I\'m taking a quick breather', 'I\'m having a sandwich', 'I\'m watching TikTok'],
  out: ['I\'m on my way to the store', 'I\'m on my way to Savannah', 'I\'m picking up studio supplies', 'I\'m on my way to the gym', 'I\'m running errands', 'I\'m on my way to Jacksonville', 'I\'m on the road']
};

const STATUS_DOC = doc(db, 'status', 'current');

export default function DollhouseApp() {
  const [isOwner, setIsOwner] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [customTaskText, setCustomTaskText] = useState(null);
  const [carDriving, setCarDriving] = useState(false);
  const [pigeonFlying, setPigeonFlying] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [isToDoOpen, setIsToDoOpen] = useState(false);
  const [hoverCup, setHoverCup] = useState(false);
  const [secretKnocks, setSecretKnocks] = useState(0);

  const [books, setBooks] = useState([{ id: 1, src: Book1, x: 0, y: 0 }, { id: 2, src: Book2, x: 0, y: 0 }, { id: 3, src: Book3, x: 0, y: 0 }]);
  const [paintTubes, setPaintTubes] = useState([{ id: 1, src: PaintTube1, x: 0, y: 0 }, { id: 2, src: PaintTube2, x: 0, y: 0 }, { id: 3, src: PaintTube3, x: 0, y: 0 }]);
  const [dragInfo, setDragInfo] = useState({ id: null, type: null, startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // ⭐ NEW: star explosion state
  const [explosions, setExplosions] = useState([]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to Firebase in real time — all visitors stay in sync
  useEffect(() => {
    const unsubscribe = onSnapshot(STATUS_DOC, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCurrentStatus(data.status || 'painting');
        setCustomTaskText(data.task || 'I\'m painting');
      }
    });
    return () => unsubscribe();
  }, []);

  // Save to Firebase whenever owner changes status or task
  const saveToFirebase = async (status, task) => {
    await setDoc(STATUS_DOC, { status, task });
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const handleSecretKnock = () => {
    if (secretKnocks >= 2) { setIsOwner(!isOwner); setSecretKnocks(0); } 
    else { setSecretKnocks(prev => prev + 1); setTimeout(() => setSecretKnocks(0), 1500); }
  };

  const handleStatusChange = (statusId) => {
    const tasks = ROOM_TASKS[statusId];
    const newTask = tasks[Math.floor(Math.random() * tasks.length)];
    setCurrentStatus(statusId);
    setCustomTaskText(newTask);
    saveToFirebase(statusId, newTask);
  };

  const handleTaskTextChange = (e) => {
    setCustomTaskText(e.target.value);
    saveToFirebase(currentStatus, e.target.value);
  };

  const triggerCarAnimation = () => { if (carDriving || currentStatus === 'out') return; setCarDriving(true); setTimeout(() => setCarDriving(false), 2500); };
  const triggerPigeonFlight = () => { if (pigeonFlying) return; setPigeonFlying(true); setTimeout(() => setPigeonFlying(false), 4000); };

  const handlePointerDown = (e, item, type) => { setDragInfo({ id: item.id, type: type, startX: e.clientX, startY: e.clientY, initialX: item.x, initialY: item.y }); e.target.setPointerCapture(e.pointerId); };
  const handlePointerMove = (e) => {
    if (dragInfo.id !== null) {
      const dx = e.clientX - dragInfo.startX; const dy = e.clientY - dragInfo.startY;
      if (dragInfo.type === 'book') setBooks(prev => prev.map(b => b.id === dragInfo.id ? { ...b, x: dragInfo.initialX + dx, y: dragInfo.initialY + dy } : b));
      else if (dragInfo.type === 'tube') setPaintTubes(prev => prev.map(t => t.id === dragInfo.id ? { ...t, x: dragInfo.initialX + dx, y: dragInfo.initialY + dy } : t));
    }
  };

  // ⭐ UPDATED: handlePointerUp now triggers star explosion
  const handlePointerUp = (e) => {
    if (dragInfo.id !== null) {
      e.target.releasePointerCapture(e.pointerId);

      // Trigger star explosion at drop position
      const id = Date.now();
      setExplosions(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setExplosions(prev => prev.filter(ex => ex.id !== id)), 700);

      setDragInfo({ id: null, type: null, startX: 0, startY: 0, initialX: 0, initialY: 0 });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#a1dae1] text-slate-800 font-sans flex flex-col items-center justify-between p-4 selection:bg-amber-200 overflow-x-hidden relative max-w-[420px] mx-auto">
      {isToDoOpen && (
        <div onClick={() => setIsToDoOpen(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ cursor: `url(${PencilSVG}) 0 32, auto` }}>
          <div className="relative animate-[popIn_0.3s_ease-out_forwards]" onClick={(e) => e.stopPropagation()} style={{ cursor: `url(${PencilSVG}) 0 32, auto` }}>
            <img src={ToDoListSVG} alt="Large To-Do List" className="w-72 md:w-96 h-auto shadow-2xl drop-shadow-xl" style={{ cursor: `url(${PencilSVG}) 0 32, auto` }} />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white font-medium text-xs tracking-widest uppercase opacity-80 pointer-events-none">Click anywhere to close</span>
          </div>
        </div>
      )}

      <header className="w-full max-w-md mx-auto text-center mt-10 mb-4 z-20 flex justify-center">
        <div className="relative inline-flex flex-col items-center justify-center w-[320px] p-6 drop-shadow-sm">
          <img src={CloudSVG} alt="Cloud Background" draggable={false} className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-auto object-contain -z-10 pointer-events-none" />
          <span onClick={handleSecretKnock} className="text-[10px] font-bold tracking-widest text-slate-500 uppercase cursor-pointer select-none hover:text-slate-700 relative z-10" title="Secret Door">{formatTime(currentTime)} currently</span>
          <div className="flex items-center justify-center gap-2 mt-1 relative z-10 w-full">
            <span className="text-lg">{STATUS_BUTTONS.find(b => b.id === currentStatus)?.icon}</span>
            {isOwner ? (
              <input type="text" value={customTaskText} onChange={handleTaskTextChange} className="text-sm font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-400 text-center focus:outline-none focus:border-amber-500 pb-0.5 px-2 w-56" />
            ) : (
              <p className="text-sm font-bold text-slate-800 px-2 w-56 text-center">{customTaskText}</p>
            )}
          </div>
        </div>
      </header>

      <div className="relative w-full max-w-[420px] flex flex-col mb-16">
        <div className="absolute z-40 w-8 h-8 pointer-events-none animate-[mothFlight_45s_ease-in-out_infinite]"><img src={MothA} alt="Moth" className="w-full h-full object-contain animate-[mothFlap_30s_linear_infinite]" /></div>
        <div className="w-full flex flex-col z-10">
          <div className="w-full relative flex items-end">
            <img src={RoofSVG} alt="Studio Roof" className="w-full h-auto block" />
            <div onClick={triggerPigeonFlight} className={`absolute bottom-[40%] w-8 h-8 z-40 select-none cursor-pointer hover:scale-110 ${pigeonFlying ? 'animate-[pigeonFlyAway_4s_ease-in-out_forwards]' : 'animate-[pigeonWalk_17s_linear_infinite,pigeonBob_0.3s_ease-in-out_infinite]'}`}><img src={PigeonSVG} alt="Pigeon Vector" className="w-full h-full object-contain" /></div>
          </div>
          <div className="w-full relative flex items-end overflow-hidden select-none">
            <img src={PaintingFloorSVG} alt="Painting Floor" className="w-full h-auto block pointer-events-none" />
            {currentStatus === 'painting' && (
              <div className="absolute bottom-[5%] left-[43%] w-[18%] z-20 pointer-events-none animate-[bob_3s_ease-in-out_infinite] drop-shadow-md">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-amber-0 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                  {customTaskText}<div className="w-2 h-2 bg-white border-b border-r border-amber-0 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                </div><img src={Cata3} alt="Cata Painting" className="w-full h-auto block" />
              </div>
            )}
            {paintTubes.map((tube, index) => (<img key={`tube-${tube.id}`} src={tube.src} draggable={false} onPointerDown={(e) => handlePointerDown(e, tube, 'tube')} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} style={{ transform: `translate(${tube.x}px, ${tube.y}px)`, touchAction: 'none' }} className={`absolute w-8 cursor-grab active:cursor-grabbing bottom-[15%] left-[${25 + (index * 15)}%] ${dragInfo.id === tube.id && dragInfo.type === 'tube' ? 'z-50 scale-110 duration-0' : 'z-30 duration-300 hover:scale-105'}`} />))}
          </div>
          <img src={FloorSVG} alt="Floor Divider" className="w-full h-auto block" />
          <div className="w-full relative flex items-end select-none">
            <img src={PatternFloorSVG} alt="Pattern Design Floor" className="w-full h-auto block pointer-events-none" />
            {(currentStatus === 'pattern' || currentStatus === 'coffee') && (
              <div className={`absolute bottom-[10%] ${currentStatus === 'coffee' ? 'left-[58%]' : 'left-[62%]'} w-[22%] z-20 pointer-events-none animate-[bob_3s_ease-in-out_infinite] drop-shadow-md transition-all duration-500`}>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-amber-0 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                  {customTaskText}<div className="w-2 h-2 bg-white border-b border-r border-amber-0 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                </div><img src={Cata2} alt="Cata Pattern" className="w-full h-auto block" />
              </div>
            )}
            <img src={ToDoListSVG} alt="Mini To-Do List" onClick={() => setIsToDoOpen(true)} className="absolute top-[8%] left-[21%] w-14 cursor-pointer hover:scale-110 transition-transform duration-300 z-30 drop-shadow-sm" />
            <div className="absolute bottom-[10%] left-[15.5%] w-8 z-40 cursor-pointer drop-shadow-sm" onMouseEnter={() => setHoverCup(true)} onMouseLeave={() => setHoverCup(false)}>
              <a href="https://buymeacoffee.com/catalinawilliams" target="_blank" rel="noopener noreferrer" className="relative block w-full h-full">
                <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-white border border-amber-0 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap transition-all duration-200 pointer-events-none ${hoverCup ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>Buy Cata a coffee</div>
                <img src={CupSVG} alt="Coffee Cup" draggable={false} className={`w-full h-auto transition-transform ${hoverCup ? 'animate-[wiggle_0.3s_ease-in-out_infinite]' : ''}`} />
              </a>
            </div>
          </div>
          <img src={FloorSVG} alt="Floor Divider" className="w-full h-auto block" />
          <div className="w-full relative flex items-end overflow-hidden select-none">
            <img src={CallFloorSVG} alt="Live Call Floor" className="w-full h-auto block pointer-events-none" />
            {currentStatus === 'call' && (
              <div className="absolute bottom-[10%] left-[51%] w-[18%] z-20 pointer-events-none animate-[bob_3s_ease-in-out_infinite] drop-shadow-md">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-amber-0 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                  {customTaskText}<div className="w-2 h-2 bg-white border-b border-r border-amber-0 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                </div><img src={Cata1} alt="Cata Calling" className="w-full h-auto block" />
              </div>
            )}
            {books.map((book, index) => (<img key={`book-${book.id}`} src={book.src} draggable={false} onPointerDown={(e) => handlePointerDown(e, book, 'book')} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} style={{ transform: `translate(${book.x}px, ${book.y}px)`, touchAction: 'none' }} className={`absolute w-12 cursor-grab active:cursor-grabbing bottom-[15%] left-[${25 + (index * 15)}%] ${dragInfo.id === book.id && dragInfo.type === 'book' ? 'z-50 scale-110 duration-0' : 'z-30 duration-300 hover:scale-105'}`} />))}
          </div>
          <div className="w-full relative flex items-end bg-transparent z-40">
            <img src={DrivewaySVG} alt="Driveway" className="w-full h-auto block" />
            <div className="absolute bottom-[2%] left-4 z-50 flex flex-col items-center">
              <div className={`transition-all duration-300 ${currentStatus === 'out' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'} mb-1`}>
                <div className="relative bg-white border border-amber-0 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap z-50">
                  {customTaskText}<div className="w-2 h-2 bg-white border-b border-r border-amber-0 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                </div>
              </div>
              <button onClick={triggerCarAnimation} className={`h-20 cursor-pointer transition-transform select-none ${currentStatus === 'out' ? 'animate-[bumpy_0.4s_ease-in-out_infinite]' : (carDriving ? 'animate-[drive_2.5s_ease-in-out_infinite]' : 'hover:scale-105')}`}><img src={CarSVG} alt="Mini Car" className="h-full w-auto object-contain block" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* ⭐ NEW: Star explosions rendered here */}
      {explosions.map(ex => (
        <div key={ex.id} className="fixed pointer-events-none z-[999]" style={{ left: ex.x, top: ex.y }}>
          {["✦","✧","★","✦","✧","★","✦","✧"].map((s, i) => {
            const angle = (i / 8) * 360;
            const dist = 35 + Math.random() * 20;
            const dx = Math.cos((angle * Math.PI) / 180) * dist;
            const dy = Math.sin((angle * Math.PI) / 180) * dist;
            return (
              <span
                key={i}
                className="absolute text-amber-400 text-sm animate-[starBurst_0.6s_ease-out_forwards]"
                style={{ "--dx": `${dx}px`, "--dy": `${dy}px` }}
              >
                {s}
              </span>
            );
          })}
        </div>
      ))}

      {isOwner && (
        <footer className="fixed bottom-6 w-full max-w-sm mx-auto z-50 animate-[popIn_0.3s_ease-out_forwards]">
          <div className="flex justify-between items-center bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg border border-slate-200 gap-1 mx-4">
            {STATUS_BUTTONS.map((btn) => {
              const isActive = currentStatus === btn.id;
              return (
                <button key={btn.id} onClick={() => handleStatusChange(btn.id)} className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${isActive ? 'bg-amber-500 text-white font-medium scale-105 shadow-md' : 'bg-transparent hover:bg-slate-100 text-slate-600'}`}>
                  <span className="text-sm">{btn.icon}</span><span className="text-[9px] font-bold tracking-tight whitespace-nowrap">{btn.label}</span>
                </button>
              );
            })}
          </div>
        </footer>
      )}

      <style>{`
        @keyframes popIn { 0% { transform: scale(0.8) translateY(20px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes wiggle { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
        @keyframes bob { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        @keyframes bumpy { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-3px) rotate(-1deg); } }
        @keyframes drive { 
          0% { transform: translateX(0px) scaleX(1); } 
          49% { transform: translateX(280px) scaleX(1); } 
          50% { transform: translateX(280px) scaleX(-1); } 
          99% { transform: translateX(0px) scaleX(-1); } 
          100% { transform: translateX(0px) scaleX(1); } 
        }
        @keyframes pigeonWalk { 0% { left: 15%; transform: scaleX(1) translateY(0px) rotate(0deg); } 24% { left: 75%; transform: scaleX(1) translateY(0px) rotate(0deg); } 48% { left: 75%; transform: scaleX(1) translateY(0px) rotate(0deg); } 50% { left: 80%; transform: scaleX(-1) translateY(0px) rotate(0deg); } 74% { left: 15%; transform: scaleX(-1) translateY(0px) rotate(0deg); } 98% { left: 15%; transform: scaleX(-1) translateY(0px) rotate(0deg); } 100% { left: 15%; transform: scaleX(1) translateY(0px) rotate(0deg); } }
        @keyframes pigeonBob { 0%, 100% { top: 0px; } 50% { top: -4px; } }
        @keyframes pigeonFlyAway { 0% { bottom: 20%; transform: scale(1) translateY(0); opacity: 1; } 40% { bottom: 110%; transform: scale(0.4) translateY(-100px); opacity: 0; } 100% { bottom: 15%; transform: scale(1); opacity: 1; } }
        @keyframes mothFlight { 0%, 20% { top: 16%; left: 81%; transform: rotate(0deg); } 28% { top: 30%; left: 60%; transform: rotate(-25deg); } 33% { top: 38%; left: 45%; transform: rotate(15deg); } 38% { top: 42%; left: 25%; transform: rotate(-20deg); } 40%, 58% { top: 48%; left: 7%; transform: rotate(0deg); } 65% { top: 55%; left: 25%; transform: rotate(20deg); } 70% { top: 62%; left: 50%; transform: rotate(-15deg); } 75% { top: 68%; left: 68%; transform: rotate(10deg); } 80%, 100% { top: 72%; left: 78%; transform: rotate(0deg); } }
        @keyframes mothFlap { 0%, 33.3% { content: url(${MothA}); } 34.5% { content: url(${MothB}); } 35.5% { content: url(${MothA}); } 40%, 66.6% { content: url(${MothA}); } 67.5% { content: url(${MothB}); } 68.5% { content: url(${MothA}); } 73.3%, 100% { content: url(${MothA}); } }
        @keyframes starBurst { 
          0% { transform: translate(0, 0) scale(1); opacity: 1; } 
          100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; } 
        }
      `}</style>
    </div>
  );
}
