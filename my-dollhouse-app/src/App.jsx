import React, { useState, useEffect } from 'react';
import './index.css';
import { db } from './firebase.js';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

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
import PopupSVG from './assets/popup.svg';

// --- INTERACTIVE ASSET IMPORTS ---
import ToDoListSVG from './assets/to-do-list.svg';
import FormSVG from './assets/form.svg';
import FormWallSVG from './assets/form-wall.svg';
import ToDoListEmptySVG from './assets/to-do-list-empty.svg';
import PencilSVG from './assets/pencil.svg';
import CupSVG from './assets/cup.svg';
import CloudSVG from './assets/cloud.svg';

// --- EARPHONES ASSET IMPORTS ---
import Earphones1 from './assets/earphones1.svg';
import Earphones2 from './assets/earphones2.svg';
import Earphones3 from './assets/earphones3.svg';

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
const DASHBOARD_DOC = doc(db, 'dashboard', 'patterns');

const EARPHONE_FRAMES = [Earphones1, Earphones3, Earphones2, Earphones3];
const EARPHONE_DELAYS = [3000, 200, 200, 200];

const COLLECTIONS_TARGET = 12;

export default function DollhouseApp() {
  const [isOwner, setIsOwner] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [customTaskText, setCustomTaskText] = useState(null);
  const [carDriving, setCarDriving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [isToDoOpen, setIsToDoOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [hoverCup, setHoverCup] = useState(false);
  const [secretKnocks, setSecretKnocks] = useState(0);
  const [showPopup, setShowPopup] = useState(true);

  const [pigeons, setPigeons] = useState([]);
  const [earphonesFrame, setEarphonesFrame] = useState(0);

  // Dashboard state
  const [collections, setCollections] = useState(0);
  const [portfolioProgress, setPortfolioProgress] = useState(0);
  const [pitches, setPitches] = useState([
    { id: 1, name: '', sent: false, response: false },
    { id: 2, name: '', sent: false, response: false },
    { id: 3, name: '', sent: false, response: false },
    { id: 4, name: '', sent: false, response: false },
    { id: 5, name: '', sent: false, response: false },
  ]);

  const [callTasks, setCallTasks] = React.useState([
    { id: 1, task: '', invoiceSent: false, invoicePaid: false },
    { id: 2, task: '', invoiceSent: false, invoicePaid: false },
    { id: 3, task: '', invoiceSent: false, invoicePaid: false },
    { id: 4, task: '', invoiceSent: false, invoicePaid: false },
    { id: 5, task: '', invoiceSent: false, invoicePaid: false },
  ]);

  const [books, setBooks] = useState([{ id: 1, src: Book1, x: 0, y: 0 }, { id: 2, src: Book2, x: 0, y: 0 }, { id: 3, src: Book3, x: 0, y: 0 }]);
  const [paintTubes, setPaintTubes] = useState([{ id: 1, src: PaintTube1, x: 0, y: 0 }, { id: 2, src: PaintTube2, x: 0, y: 0 }, { id: 3, src: PaintTube3, x: 0, y: 0 }]);
  const [dragInfo, setDragInfo] = useState({ id: null, type: null, startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const [explosions, setExplosions] = useState([]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Earphones animation
  useEffect(() => {
    let frame = 0;
    let timeout;
    const step = () => {
      frame = (frame + 1) % EARPHONE_FRAMES.length;
      setEarphonesFrame(frame);
      timeout = setTimeout(step, EARPHONE_DELAYS[frame]);
    };
    timeout = setTimeout(step, EARPHONE_DELAYS[0]);
    return () => clearTimeout(timeout);
  }, []);

  // Firebase status sync
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

  // Firebase dashboard sync
  useEffect(() => {
    const unsubscribe = onSnapshot(DASHBOARD_DOC, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.collections !== undefined) setCollections(data.collections);
        if (data.portfolioProgress !== undefined) setPortfolioProgress(data.portfolioProgress);
        if (data.pitches !== undefined) setPitches(data.pitches);
      }
    });
    return () => unsubscribe();
  }, []);

  const saveDashboard = async (updates) => {
    await setDoc(DASHBOARD_DOC, updates, { merge: true });
  };

  const CALLTASKS_DOC = doc(db, 'dashboard', 'calltasks');
  const saveCallTasks = async (tasks) => {
    await setDoc(CALLTASKS_DOC, { tasks }, { merge: true });
  };

  const handleCallTaskChange = (id, field, value) => {
    const updated = callTasks.map(t => t.id === id ? { ...t, [field]: value } : t);
    setCallTasks(updated);
    saveCallTasks(updated);
  };

  const saveToFirebase = async (status, task) => {
    await setDoc(STATUS_DOC, { status, task });
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const handleSecretKnock = () => {
    if (secretKnocks >= 2) { setIsOwner(prev => !prev); setSecretKnocks(0); }
    else { setSecretKnocks(prev => prev + 1); setTimeout(() => setSecretKnocks(0), 1500); }
  };

  // Separate 3-knock counter for the notebook
  const [notebookKnocks, setNotebookKnocks] = React.useState(0);
  const [formKnocks, setFormKnocks] = React.useState(0);
  const [isFormDashboardOpen, setIsFormDashboardOpen] = React.useState(false);
  const handleNotebookKnock = () => {
    if (notebookKnocks >= 2) { setIsDashboardOpen(true); setNotebookKnocks(0); }
    else { setNotebookKnocks(prev => prev + 1); setTimeout(() => setNotebookKnocks(0), 1500); }
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

  const triggerCarAnimation = () => {
    if (carDriving || currentStatus === 'out') return;
    setCarDriving(true);
    setTimeout(() => setCarDriving(false), 2500);
  };

  const triggerPigeonFlight = () => {
    const newPigeon = { id: Date.now(), left: `${15 + Math.random() * 60}%`, bottom: `${35 + Math.random() * 15}%` };
    setPigeons(prev => [...prev, newPigeon]);
    setTimeout(() => setPigeons(prev => prev.filter(p => p.id !== newPigeon.id)), 10000);
  };

  const handleNotebookClick = () => {
    if (isOwner) setIsDashboardOpen(true);
    else setIsToDoOpen(true);
  };

  const handleCollectionsChange = (val) => {
    const v = Number(val);
    setCollections(v);
    saveDashboard({ collections: v, portfolioProgress, pitches });
  };

  const handlePortfolioChange = (val) => {
    const v = Number(val);
    setPortfolioProgress(v);
    saveDashboard({ collections, portfolioProgress: v, pitches });
  };

  const handlePitchChange = (id, field, value) => {
    const updated = pitches.map(p => p.id === id ? { ...p, [field]: value } : p);
    setPitches(updated);
    saveDashboard({ collections, portfolioProgress, pitches: updated });
  };

  const handleFormKnock = () => {
    if (formKnocks >= 2) { setIsFormDashboardOpen(true); setFormKnocks(0); }
    else { setFormKnocks(prev => prev + 1); setTimeout(() => setFormKnocks(0), 1500); }
  };

  const handlePointerDown = (e, item, type) => {
    setDragInfo({ id: item.id, type, startX: e.clientX, startY: e.clientY, initialX: item.x, initialY: item.y });
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (dragInfo.id !== null) {
      const dx = e.clientX - dragInfo.startX;
      const dy = e.clientY - dragInfo.startY;
      if (dragInfo.type === 'book') setBooks(prev => prev.map(b => b.id === dragInfo.id ? { ...b, x: dragInfo.initialX + dx, y: dragInfo.initialY + dy } : b));
      else if (dragInfo.type === 'tube') setPaintTubes(prev => prev.map(t => t.id === dragInfo.id ? { ...t, x: dragInfo.initialX + dx, y: dragInfo.initialY + dy } : t));
    }
  };

  const handlePointerUp = (e) => {
    if (dragInfo.id !== null) {
      e.target.releasePointerCapture(e.pointerId);
      const id = Date.now();
      setExplosions(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setExplosions(prev => prev.filter(ex => ex.id !== id)), 700);
      setDragInfo({ id: null, type: null, startX: 0, startY: 0, initialX: 0, initialY: 0 });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#a1dae1] text-slate-800 font-sans flex flex-col items-center justify-between p-4 selection:bg-amber-200 overflow-x-hidden relative max-w-[420px] mx-auto">

      {/* VISITOR: TO-DO POPUP */}
      {isToDoOpen && (
        <div onClick={() => setIsToDoOpen(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ cursor: `url(${PencilSVG}) 0 32, auto` }}>
          <div className="relative animate-[popIn_0.3s_ease-out_forwards]" onClick={(e) => e.stopPropagation()}>
            <img src={ToDoListSVG} alt="Large To-Do List" className="w-72 md:w-96 h-auto shadow-2xl drop-shadow-xl" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white font-medium text-xs tracking-widest uppercase opacity-80 pointer-events-none">Click anywhere to close</span>
          </div>
        </div>
      )}

      {/* OWNER: SECRET DASHBOARD POPUP */}
      {isDashboardOpen && (
        <div onClick={() => setIsDashboardOpen(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative animate-[popIn_0.3s_ease-out_forwards]" onClick={(e) => e.stopPropagation()}>

            {/* Notebook background */}
            <div className="relative w-80">
              <img src={ToDoListEmptySVG} alt="Notebook" className="w-full h-auto" />

              {/* Dashboard content overlaid on notebook */}
              <div className="absolute inset-0 flex flex-col justify-start pt-16 px-8 pb-6 gap-5">

                <p className="text-center text-[11px] font-black tracking-widest uppercase text-[#30797f] mb-1">✦ pattern studio ✦</p>

                {/* Collections */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-600">brainstorm collections</span>
                    <span className="text-[11px] font-black text-[#30797f]">{collections}/{COLLECTIONS_TARGET}</span>
                  </div>
                  <input
                    type="range" min="0" max={COLLECTIONS_TARGET} value={collections}
                    onChange={(e) => handleCollectionsChange(e.target.value)}
                    className="w-full h-2 rounded-full accent-[#30797f] cursor-pointer"
                  />
                </div>

                {/* Portfolio */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-600">update portfolio</span>
                    <span className="text-[11px] font-black text-[#30797f]">{portfolioProgress}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100" value={portfolioProgress}
                    onChange={(e) => handlePortfolioChange(e.target.value)}
                    className="w-full h-2 rounded-full accent-[#30797f] cursor-pointer"
                  />
                </div>

                {/* Pitches */}
                <div>
                  <p className="text-[11px] font-bold text-slate-600 mb-2">pitch to clients</p>
                  <div className="flex flex-col gap-1.5">
                    {pitches.map(pitch => (
                      <div key={pitch.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`client ${pitch.id}`}
                          value={pitch.name}
                          onChange={(e) => handlePitchChange(pitch.id, 'name', e.target.value)}
                          className="flex-1 text-[10px] bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-[#30797f] placeholder:text-slate-300 text-slate-600 pb-0.5"
                        />
                        <button
                          onClick={() => handlePitchChange(pitch.id, 'sent', !pitch.sent)}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border transition-all ${pitch.sent ? 'bg-[#30797f] text-white border-[#30797f]' : 'bg-transparent text-slate-400 border-slate-300'}`}
                        >sent</button>
                        <button
                          onClick={() => handlePitchChange(pitch.id, 'response', !pitch.response)}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border transition-all ${pitch.response ? 'bg-amber-400 text-white border-amber-400' : 'bg-transparent text-slate-400 border-slate-300'}`}
                        >reply</button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            <button onClick={() => setIsDashboardOpen(false)} className="absolute -top-3 -right-3 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow-md text-slate-500 font-bold text-sm hover:scale-110 transition-transform">✕</button>
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white font-medium text-xs tracking-widest uppercase opacity-80 pointer-events-none">Click anywhere to close</span>
          </div>
        </div>
      )}

      {/* OWNER: CALL FLOOR FORM DASHBOARD */}
      {isFormDashboardOpen && (
        <div onClick={() => setIsFormDashboardOpen(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative animate-[popIn_0.3s_ease-out_forwards]" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-72">
              <img src={FormSVG} alt="Form" className="w-full h-auto" />
              <div className="absolute inset-0 flex flex-col justify-start pt-16 px-7 pb-6 gap-3">
                <p className="text-center text-[11px] font-black tracking-widest uppercase text-white mb-1">✦ work & invoices ✦</p>
                {callTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`task ${t.id}`}
                      value={t.task}
                      onChange={(e) => handleCallTaskChange(t.id, 'task', e.target.value)}
                      className="flex-1 text-[10px] bg-transparent border-b border-dashed border-white/50 focus:outline-none focus:border-white placeholder:text-white/40 text-white pb-0.5"
                    />
                    <button
                      onClick={() => handleCallTaskChange(t.id, 'invoiceSent', !t.invoiceSent)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border transition-all whitespace-nowrap ${t.invoiceSent ? 'bg-white text-[#27417e] border-white' : 'bg-transparent text-white/60 border-white/40'}`}
                    >sent</button>
                    <button
                      onClick={() => handleCallTaskChange(t.id, 'invoicePaid', !t.invoicePaid)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border transition-all whitespace-nowrap ${t.invoicePaid ? 'bg-amber-400 text-white border-amber-400' : 'bg-transparent text-white/60 border-white/40'}`}
                    >paid</button>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setIsFormDashboardOpen(false)} className="absolute -top-3 -right-3 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow-md text-slate-500 font-bold text-sm hover:scale-110 transition-transform">✕</button>
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white font-medium text-xs tracking-widest uppercase opacity-80 pointer-events-none">Click anywhere to close</span>
          </div>
        </div>
      )}

      {/* WELCOME POPUP */}
      {showPopup && (
        <div onClick={() => setShowPopup(false)} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative animate-[popIn_0.3s_ease-out_forwards]" onClick={(e) => e.stopPropagation()}>
            <img src={PopupSVG} alt="Welcome Popup" onClick={() => setShowPopup(false)} className="w-72 md:w-96 h-auto shadow-2xl drop-shadow-xl cursor-pointer" />
            <button onClick={() => setShowPopup(false)} className="absolute -top-3 -right-3 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow-md text-slate-500 font-bold text-sm hover:scale-110 transition-transform">✕</button>
          </div>
        </div>
      )}

      {/* SPOTIFY BOTTOM BAR */}
      <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] z-[60] transition-all duration-500 ease-in-out ${isPlaylistOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        <iframe
          style={{ borderRadius: '0' }}
          src="https://open.spotify.com/embed/playlist/4ZNHyYY9OflnaieQ0JlvUW?utm_source=generator"
          width="100%" height="80" frameBorder="0"
          allowFullScreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>

      <header className="w-full max-w-md mx-auto text-center mt-10 mb-4 z-20 flex justify-center">
        <div className="relative inline-flex flex-col items-center justify-center w-[320px] p-6 drop-shadow-sm">
          <img src={CloudSVG} alt="Cloud Background" draggable={false} className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-auto object-contain -z-10 pointer-events-none" />
          <span onClick={handleSecretKnock} className="text-[10px] font-bold tracking-widest text-slate-500 uppercase cursor-pointer select-none hover:text-slate-700 relative z-10" title="Secret Door">{formatTime(currentTime)} currently</span>
          <div className="flex items-center justify-center gap-2 mt-1 relative z-10 w-full">
            {isOwner ? (
              <input type="text" value={customTaskText} onChange={handleTaskTextChange} className="text-sm font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-400 text-center focus:outline-none focus:border-amber-500 pb-0.5 px-2 w-56" />
            ) : (
              <p className="text-sm font-bold text-slate-800 px-2 w-56 text-center">{customTaskText}</p>
            )}
          </div>
        </div>
      </header>

      <div className="relative w-full max-w-[420px] flex flex-col mb-16">
        <div className="absolute z-40 w-8 h-8 pointer-events-none animate-[mothFlight_45s_ease-in-out_infinite]">
          <img src={MothA} alt="Moth" className="w-full h-full object-contain animate-[mothFlap_30s_linear_infinite]" />
        </div>
        <div className="w-full flex flex-col z-10">

          {/* ROOF */}
          <div className="w-full relative flex items-end">
            <img src={RoofSVG} alt="Studio Roof" className="w-full h-auto block" />
            <div onClick={triggerPigeonFlight} className="absolute bottom-[40%] w-8 h-8 z-40 select-none cursor-pointer hover:scale-110 animate-[pigeonWalk_17s_linear_infinite,pigeonBob_0.3s_ease-in-out_infinite]">
              <img src={PigeonSVG} alt="Pigeon Vector" className="w-full h-full object-contain" />
            </div>
            {pigeons.map(p => (
              <div key={p.id} className="absolute w-8 h-8 z-40 select-none animate-[pigeonWalk_17s_linear_infinite,pigeonBob_0.3s_ease-in-out_infinite]" style={{ left: p.left, bottom: p.bottom }}>
                <img src={PigeonSVG} alt="Pigeon" className="w-full h-full object-contain" />
              </div>
            ))}
          </div>

          {/* PAINTING FLOOR */}
          <div className="w-full relative flex items-end overflow-hidden select-none">
            <img src={PaintingFloorSVG} alt="Painting Floor" className="w-full h-auto block pointer-events-none" />
            {currentStatus === 'painting' && (
              <div className="absolute bottom-[5%] left-[43%] w-[22%] z-20 pointer-events-none animate-[bob_3s_ease-in-out_infinite] drop-shadow-md">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                  {customTaskText}<div className="w-2 h-2 bg-white transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                </div>
                <img src={Cata3} alt="Cata Painting" className="w-full h-auto block" />
              </div>
            )}
            <img
              src={EARPHONE_FRAMES[earphonesFrame]}
              alt="Earphones"
              onClick={() => setIsPlaylistOpen(prev => !prev)}
              className="absolute bottom-[8%] left-[65%] w-10 z-30 cursor-pointer drop-shadow-sm"
            />
            {paintTubes.map((tube, index) => (
              <img key={`tube-${tube.id}`} src={tube.src} draggable={false}
                onPointerDown={(e) => handlePointerDown(e, tube, 'tube')}
                onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
                style={{ transform: `translate(${tube.x}px, ${tube.y}px)`, touchAction: 'none' }}
                className={`absolute w-8 cursor-grab active:cursor-grabbing bottom-[10%] left-[${9 + (index * 15)}%] ${dragInfo.id === tube.id && dragInfo.type === 'tube' ? 'z-50 scale-110 duration-0' : 'z-30 duration-300 hover:scale-105'}`}
              />
            ))}
          </div>

          <img src={FloorSVG} alt="Floor Divider" className="w-full h-auto block" />

          {/* PATTERN FLOOR */}
          <div className="w-full relative flex items-end select-none">
            <img src={PatternFloorSVG} alt="Pattern Design Floor" className="w-full h-auto block pointer-events-none" />
            {(currentStatus === 'pattern' || currentStatus === 'coffee') && (
              <div className={`absolute bottom-[10%] ${currentStatus === 'coffee' ? 'left-[58%]' : 'left-[62%]'} w-[26%] z-20 pointer-events-none animate-[bob_3s_ease-in-out_infinite] drop-shadow-md transition-all duration-500`}>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                  {customTaskText}<div className="w-2 h-2 bg-white transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                </div>
                <img src={Cata2} alt="Cata Pattern" className="w-full h-auto block" />
              </div>
            )}
            {/* NOTEBOOK — prop for visitors, dashboard for owner */}
            <img
              src={ToDoListSVG} alt="Notebook"
              onClick={handleNotebookKnock}
              className="absolute top-[8%] left-[21%] w-14 z-30 drop-shadow-sm cursor-pointer"
            />
            <div className="absolute bottom-[10%] left-[15.5%] w-8 z-40 cursor-pointer drop-shadow-sm" onMouseEnter={() => setHoverCup(true)} onMouseLeave={() => setHoverCup(false)}>
              <a href="https://buymeacoffee.com/catalinawilliams" target="_blank" rel="noopener noreferrer" className="relative block w-full h-full">
                <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap transition-all duration-200 pointer-events-none ${hoverCup ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>Buy Cata a coffee</div>
                <img src={CupSVG} alt="Coffee Cup" draggable={false} className={`w-full h-auto transition-transform ${hoverCup ? 'animate-[wiggle_0.3s_ease-in-out_infinite]' : ''}`} />
              </a>
            </div>
          </div>

          <img src={FloorSVG} alt="Floor Divider" className="w-full h-auto block" />

          {/* CALL FLOOR */}
          <div className="w-full relative flex items-end overflow-hidden select-none">
            <img src={CallFloorSVG} alt="Live Call Floor" className="w-full h-auto block pointer-events-none" />
            {/* FORM on wall — 3 knocks opens invoice dashboard */}
            <img
              src={FormWallSVG} alt="Form"
              onClick={handleFormKnock}
              className="absolute top-[17%] left-[25%] w-14 z-30 cursor-pointer drop-shadow-sm"
            />
            {currentStatus === 'call' && (
              <div className="absolute bottom-[10%] left-[51%] w-[22%] z-20 pointer-events-none animate-[bob_3s_ease-in-out_infinite] drop-shadow-md">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                  {customTaskText}<div className="w-2 h-2 bg-white transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                </div>
                <img src={Cata1} alt="Cata Calling" className="w-full h-auto block" />
              </div>
            )}
            {books.map((book, index) => (
              <img key={`book-${book.id}`} src={book.src} draggable={false}
                onPointerDown={(e) => handlePointerDown(e, book, 'book')}
                onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
                style={{ transform: `translate(${book.x}px, ${book.y}px)`, touchAction: 'none' }}
                className={`absolute w-12 cursor-grab active:cursor-grabbing bottom-[5%] left-[${8 + (index * 15)}%] ${dragInfo.id === book.id && dragInfo.type === 'book' ? 'z-50 scale-110 duration-0' : 'z-30 duration-300 hover:scale-105'}`}
              />
            ))}
          </div>

          {/* DRIVEWAY */}
          <div className="w-full relative flex items-end bg-transparent z-40">
            <img src={DrivewaySVG} alt="Driveway" className="w-full h-auto block" />
            <div className="absolute bottom-[2%] left-4 z-50 flex flex-col items-center">
              <div className={`transition-all duration-300 ${currentStatus === 'out' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'} mb-1`}>
                <div className="relative bg-white text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap z-50">
                  {customTaskText}<div className="w-2 h-2 bg-white transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                </div>
              </div>
              <button onClick={triggerCarAnimation} className={`h-20 cursor-pointer transition-transform select-none ${currentStatus === 'out' ? 'animate-[bumpy_0.4s_ease-in-out_infinite]' : (carDriving ? 'animate-[drive_2.5s_ease-in-out_infinite]' : 'hover:scale-105')}`}>
                <img src={CarSVG} alt="Mini Car" className="h-full w-auto object-contain block" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Star explosions */}
      {explosions.map(ex => (
        <div key={ex.id} className="fixed pointer-events-none z-[999]" style={{ left: ex.x, top: ex.y }}>
          {["✦","✧","★","✦","✧","★","✦","✧"].map((s, i) => {
            const angle = (i / 8) * 360;
            const dist = 35 + Math.random() * 20;
            const dx = Math.cos((angle * Math.PI) / 180) * dist;
            const dy = Math.sin((angle * Math.PI) / 180) * dist;
            return <span key={i} className="absolute text-amber-400 text-sm animate-[starBurst_0.6s_ease-out_forwards]" style={{ "--dx": `${dx}px`, "--dy": `${dy}px` }}>{s}</span>;
          })}
        </div>
      ))}

      {isOwner && (
        <footer className="fixed w-full max-w-sm mx-auto z-50 animate-[popIn_0.3s_ease-out_forwards]" style={{ bottom: isPlaylistOpen ? '104px' : '24px', transition: 'bottom 0.5s ease-in-out' }}>
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
        @keyframes mothFlight { 0%, 20% { top: 16%; left: 81%; transform: rotate(0deg); } 28% { top: 30%; left: 60%; transform: rotate(-25deg); } 33% { top: 38%; left: 45%; transform: rotate(15deg); } 38% { top: 42%; left: 25%; transform: rotate(-20deg); } 40%, 58% { top: 48%; left: 7%; transform: rotate(0deg); } 65% { top: 55%; left: 25%; transform: rotate(20deg); } 70% { top: 62%; left: 50%; transform: rotate(-15deg); } 75% { top: 68%; left: 68%; transform: rotate(10deg); } 80%, 100% { top: 72%; left: 78%; transform: rotate(0deg); } }
        @keyframes mothFlap { 0%, 33.3% { content: url(${MothA}); } 34.5% { content: url(${MothB}); } 35.5% { content: url(${MothA}); } 40%, 66.6% { content: url(${MothA}); } 67.5% { content: url(${MothB}); } 68.5% { content: url(${MothA}); } 73.3%, 100% { content: url(${MothA}); } }
        @keyframes starBurst {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
        }
        input[type='range'] { -webkit-appearance: none; appearance: none; background: #e2e8f0; height: 6px; border-radius: 9999px; }
        input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #30797f; cursor: pointer; }
      `}</style>
    </div>
  );
}
