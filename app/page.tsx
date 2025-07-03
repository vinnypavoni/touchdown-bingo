// Touchdown Bingo Home Component (Fully Styled and Functional)
"use client";

import GoogleAd from "../components/GoogleAd"; // Adjust the path if needed
import { useState, useEffect, useRef } from "react";
import { players } from "../data/players";
import { categories } from "../data/categories";
import {
  generateValidCategories,
  pickWinnablePlayers,
  seededShuffle,
} from "./utils/bingo";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from 'next/navigation';


type Square = {
  status: "correct" | "wrong" | "wildcard" | "revealed" | null;
  player: string | null;
};

function PlayerName({ name }: { name: string }) {
  const [firstName, lastName] = name.split(" ");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={name}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="inline-block text-left font-bold uppercase tracking-wide font-sans text-xl"
        style={{ marginLeft: "0.5rem" }}
      >
        <div>{firstName}</div>
        <div>{lastName}</div>
      </motion.div>
    </AnimatePresence>
  );
}


export default function Home() {

  const searchParams = useSearchParams();
  const isAdmin = searchParams.get('admin') === '1';
  const [animOverlays, setAnimOverlays] = useState<
    { x: number; y: number; color: string; id: number }[]
  >([]);

  const [animating, setAnimating] = useState(false);

  const DAYS = 10;
  const [dayOffset, setDayOffset] = useState(0);
  const boardSetRef = useRef<Record<number, { board: string[]; queue: any[] }>>({});

  const [boardCategories, setBoardCategories] = useState<string[]>([]);
  const [playerQueue, setPlayerQueue] = useState<any[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [selectedSquares, setSelectedSquares] = useState<Square[]>(
    Array.from({ length: 16 }, () => ({ status: null, player: null }))
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [wildcardUsed, setWildcardUsed] = useState(false);

  const LAUNCH_DATE = new Date(2025, 5, 17); // June 17, 2024 (local time)
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysSinceLaunch = Math.floor(
    (todayMidnight.getTime() - LAUNCH_DATE.getTime()) / (1000 * 60 * 60 * 24)
  );
  const seed = daysSinceLaunch + 1 - dayOffset;
  const gameNumber = daysSinceLaunch + 1 - dayOffset;


  const currentPlayer = playerQueue[currentPlayerIndex] || null;

  useEffect(() => {
    console.log("Current seed:", seed);

    if (!boardSetRef.current[seed]) {
      try {
        const board = generateValidCategories(players, categories, seed);
        const queue = pickWinnablePlayers(players, board, seed);
        boardSetRef.current[seed] = { board, queue };
      } catch (err) {
        console.error("Board generation failed:", err);
        return;
      }
    }

    const { board, queue } = boardSetRef.current[seed];
    setBoardCategories(board);
    setPlayerQueue(queue);
    setCurrentPlayerIndex(0);
    setSelectedSquares(
      Array.from({ length: 16 }, () => ({ status: null, player: null }))
    );
    setWildcardUsed(false);
    setGameStarted(false);
    setShowEndModal(false);
  }, [seed]);

  useEffect(() => {
    if (gameStarted && !currentPlayer) {
      setShowEndModal(true);
    }
  }, [currentPlayer]);

  function handleCategoryClick(index: number) {
    const category = boardCategories[index];
    const isCorrect = currentPlayer.categories.includes(category);

    // Find the square DOM element by id
    const squareEl = document.getElementById(`square-${index}`);
    if (!squareEl) {
      console.warn("Square element not found for animation");
      return;
    }

    // Get bounding rect of square & grid container
    const squareRect = squareEl.getBoundingClientRect();
    const gridEl = squareEl.closest(".grid");
    if (!gridEl) {
      console.warn("Grid container not found");
      return;
    }
    const gridRect = gridEl.getBoundingClientRect();

    // Calculate overlay start size and position to cover ~2.5 squares and fade in from outside
    const overlaySize = gridRect.width * 0.6; // roughly 2.5 squares (4 squares total in row)
    const centerX = squareRect.left + squareRect.width / 2;
    const centerY = squareRect.top + squareRect.height / 2;

    // Position relative to viewport, so position fixed overlay
    // Start overlay bigger and centered on the square
    const overlayStartLeft = centerX - overlaySize / 2;
    const overlayStartTop = centerY - overlaySize / 2;

    // Create overlay div
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.left = `${overlayStartLeft}px`;
    overlay.style.top = `${overlayStartTop}px`;
    overlay.style.width = `${overlaySize}px`;
    overlay.style.height = `${overlaySize}px`;
    overlay.style.backgroundColor = isCorrect
      ? "#a3e635"
      : "rgba(255, 0, 0, 0.7)"; // green for correct, red-ish for wrong
    overlay.style.borderRadius = "8px";
    overlay.style.pointerEvents = "none";
    overlay.style.opacity = "0.7";
    overlay.style.zIndex = "1000";
    overlay.style.transition = "all 0.3s ease-out";

    document.body.appendChild(overlay);

    // Trigger animation: shrink overlay to exactly cover the square
    requestAnimationFrame(() => {
      overlay.style.left = `${squareRect.left}px`;
      overlay.style.top = `${squareRect.top}px`;
      overlay.style.width = `${squareRect.width}px`;
      overlay.style.height = `${squareRect.height}px`;
      overlay.style.opacity = "1";
    });

    // After animation duration, remove overlay and update state
    setTimeout(() => {
      document.body.removeChild(overlay);

      if (isCorrect) {
        const newSelected = [...selectedSquares];
        newSelected[index] = {
          status: "correct",
          player: currentPlayer.name,
        };
        setSelectedSquares(newSelected);

        const totalCorrect = newSelected.filter(
          (sq) =>
            sq.status !== null && ["correct", "wildcard"].includes(sq.status)
        ).length;
        if (totalCorrect === 16) {
          setShowEndModal(true);
          return;
        }

        setCurrentPlayerIndex((prev) => prev + 1);
      } else {
        const newSelected = [...selectedSquares];
        newSelected[index] = { status: "wrong", player: null };
        setSelectedSquares(newSelected);

        setTimeout(() => {
          setSelectedSquares((prevSelected) =>
            prevSelected.map((val) =>
              val.status === "wrong" ? { status: null, player: null } : val
            )
          );
          setCurrentPlayerIndex((prev) => prev + 2);
        }, 500);
      }
    }, 600); // Match the animation duration here
  }


  function handleWildcard() {
    if (!currentPlayer) return;

    const newSelected = [...selectedSquares];
    let matchedIndices: number[] = [];

    boardCategories.forEach((cat, index) => {
      const isAlreadyGuessed = newSelected[index].status !== null;
      const isMatch = currentPlayer.categories.includes(cat);
      if (!isAlreadyGuessed && isMatch) {
        newSelected[index] = {
          status: "wildcard",
          player: currentPlayer.name,
        };
        matchedIndices.push(index);
      }
    });

    setSelectedSquares(newSelected);
    setWildcardUsed(true);
    setCurrentPlayerIndex(prev => prev + 1);

    // Prepare overlay animations for all matched squares
    const overlays = matchedIndices.map((index) => {
      const squareElement = document.getElementById(`square-${index}`);
      if (!squareElement) return null;

      const rect = squareElement.getBoundingClientRect();
      return {
        id: index,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        color: "#fb923c", // Wildcard orange
      };
    }).filter(Boolean) as { id: number; x: number; y: number; color: string }[];

    setAnimOverlays(overlays);
  }




  function revealAnswers() {
    const newSelected = [...selectedSquares];
    const unmatched = boardCategories.map((cat, i) => ({ cat, i }))
      .filter(({ i }) => newSelected[i].status === null);

    const guessed = new Set(selectedSquares.filter(s => s.player).map(s => s.player));
    const remaining = playerQueue.filter(p => !guessed.has(p.name));

    unmatched.forEach(({ cat, i }) => {
      const match = remaining.find(p => p.categories.includes(cat));
      if (match) {
        newSelected[i] = {
          status: "revealed",
          player: match.name,
        };
      }
    });

    setSelectedSquares(newSelected);
    setShowEndModal(false);
  }

  const totalCorrect = selectedSquares.filter(
    sq => ["correct", "wildcard"].includes(sq.status || "")
  ).length;

  const gameCompleted = totalCorrect === 16;

  const categoryAbbreviations: Record<string, string> = {
    // NFL Teams
    "San Francisco 49ers": "SF 49ERS",
    "Tampa Bay Buccaneers": "TB BUCS",
    "New England Patriots": "NE PATRIOTS",
    "Philadelphia Eagles": "PHI EAGLES",
    "Los Angeles Chargers": "LA CHARGERS",
    "Los Angeles Rams": "LA RAMS",
    "Washington Commanders": "WAS COMMANDERS",
    "Arizona Cardinals": "AZ CARDINALS",
    "Kansas City Chiefs": "KC CHIEFS",
    "Jacksonville Jaguars": "JAX JAGUARS",
    "Minnesota Vikings": "MIN VIKINGS",
    "Green Bay Packers": "GB PACKERS",
    "Detroit Lions": "DET LIONS",
    "New Orleans Saints": "NO SAINTS",
    "New York Giants": "NYG",
    "New York Jets": "NYJ",
    "Cincinnati Bengals": "CIN BENGALS",
    "Cleveland Browns": "CLE BROWNS",

    // College Teams
    "Texas A&M Aggies": "TEXAS A&M",
    "Florida St Seminoles": "FLORIDA ST",
    "Mississippi St Bulldogs": "MISSISSIPPI ST",
    "Notre Dame Fighting Irish": "NOTRE DAME",
    "Michigan Wolverines": "MICHIGAN",
    "Ohio St Buckeyes": "OHIO ST",
    "Wisconsin Badgers": "WISCONSIN",
    "Nebraska Cornhuskers": "NEBRASKA",
    "Vanderbilt Commodores": "VANDY",
    "Arkansas Razorbacks": "ARKANSAS",
    "Tennessee Volunteers": "TENNESSEE",
    "South Carolina Gamecocks": "SOUTH CAROLINA",
    "North Carolina Tar Heels": "UNC",
    "Florida Gators": "FLORIDA",
    "Auburn Tigers": "AUBURN",
    "Georgia Bulldogs": "GEORGIA",
    "Ole Miss Rebels": "OLE MISS",
    "Oklahoma Sooners": "OKLAHOMA",
    "Missouri Tigers": "MIZZOU",
    "Texas Longhorns": "TEXAS",
    "Clemson Tigers": "CLEMSON",
    "Iowa Hawkeyes": "IOWA",
    "UCLA Bruins": "UCLA",
    "USC Trojans": "USC",
    "TCU Horned Frogs": "TCU",
    "Oregon Ducks": "OREGON",

    // Misc
    "Coached by Bill Belichick": "COACHED BY BELICHICK",
    "Coached by Andy Reid": "COACHED BY REID",
    "Coached by Pete Carroll": "COACHED BY CARROLL",
    "Coached by Sean Payton": "COACHED BY PAYTON",
    "Hall of Famer": "HOF",
    "Heisman Trophy Winner": "HEISMAN",
    "Super Bowl Winner": "SB WINNER",
    "DPOY": "DPOY",
    "MVP": "MVP",
  };

  return (
    <div className="min-h-screen pt-6 pb-2 text-center flex flex-col items-center gap-4 bg-[#001f3f] text-white">
      
      {animOverlays.map(({ x, y, color, id }) => (
        <motion.div
          key={id}
          className="fixed w-32 h-32 rounded-md pointer-events-none z-40"
          style={{
            left: x,
            top: y,
            backgroundColor: color,
            originX: 0.5,
            originY: 0.5,
            translateX: "-50%",
            translateY: "-50%",
            position: "fixed",
          }}
          initial={{ opacity: 0, scale: 2.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onAnimationComplete={() => {
            setAnimOverlays(prev => prev.filter(overlay => overlay.id !== id));
          }}
        />
      ))}


      <h1 className="text-4xl font-bold" style={{ fontFamily: 'Impact', letterSpacing: '1px' }}>
        Touchdown Bingo
      </h1>

      <div className="w-full max-w-[480px]">
        

        <div className="bg-blue-800 text-white p-6 rounded-t-md w-full mx-auto relative min-h-[144px]">
          {gameStarted ? (
            <>
              {/* Container for circle and name, left-aligned */}
              <div className="flex items-center gap-3 justify-start">
                {/* White circle flushed to left */}
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white text-black text-3xl font-bold flex items-center justify-center">
                  {Math.max(0, playerQueue.length - currentPlayerIndex)}
                </div>

                {/* Player name next to the circle, left aligned */}
                {currentPlayer && (
                  <div className="text-left font-extrabold uppercase text-2xl tracking-wide" style={{ fontFamily: 'Impact', lineHeight: 1.1 }}>
                    <PlayerName name={currentPlayer.name} />
                  </div>
                )}
              </div>

              {/* Wildcard button centered below the circle and name */}
              {!wildcardUsed && !gameCompleted && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleWildcard}
                    className="bg-lime-400 hover:bg-lime-500 text-black text-xs font-semibold px-4 py-1 rounded"
                  >
                    Play Wildcard
                  </button>
                </div>
              )}

              {/* Skip button top-right */}
              {!showEndModal && !gameCompleted && (
                <div
                  className="absolute right-4 top-4 text-white font-bold text-sm cursor-pointer"
                  onClick={() => setCurrentPlayerIndex(prev => prev + 1)}
                >
                  Skip →
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => setGameStarted(true)}
              className="bg-lime-400 hover:bg-lime-500 text-black font-bold text-lg uppercase px-8 py-4 rounded shadow"
            >
              Play Bingo
            </button>
          )}
        </div>

        
        <div className="grid grid-cols-4 w-full aspect-square rounded-b-md overflow-visible relative">
          {boardCategories.map((category, index) => {
            const imageOverrides: Record<string, string> = {
              "Texas A&M Aggies": "texas_am_aggies.png",
              // add more overrides as needed
            };

            const safeFileName =
              imageOverrides[category] ||
              category.toLowerCase().replace(/ /g, "_").replace(/[^\w_]/g, "");

            const square = selectedSquares[index];
            const isEvenRow = Math.floor(index / 4) % 2 === 0;
            const isEvenCol = index % 2 === 0;
            const isDark = isEvenRow ? isEvenCol : !isEvenCol;

            return (
              <div
               key={index}
               id={`square-${index}`}
               className="relative w-full aspect-square">
                <motion.button
                  className={`absolute inset-0 flex flex-col items-center justify-center text-xs font-medium text-center transition-all duration-50 ${
                    square.status === "wrong"
                      ? "bg-red-500 text-white"
                      : isDark
                      ? "bg-gray-500 text-white hover:bg-gray-600"
                      : "bg-gray-800 text-white hover:bg-gray-700"
                  }`}
                  onClick={() => handleCategoryClick(index)}
                  disabled={!gameStarted ||square.status !== null}
                >
                  {square.status !== null && ["correct", "revealed", "wildcard"].includes(square.status) && (
                    <div
                      className="absolute inset-1 rounded-md z-0"
                      style={{
                        backgroundColor:
                          square.status === "correct"
                            ? "#a3e635"
                            : square.status === "revealed"
                            ? "#facc15"
                            : "#fb923c",
                      }}
                    />

                  )}
                  

                  <div className="relative z-10 flex flex-col items-center">
                      <>
                        <img
                          src={`/logos/${safeFileName}.png`}
                          alt={category}
                          className="w-14 h-14 object-contain mb-2"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <>
                          <span className="font-semibold text-[10px] sm:hidden font-sans tracking-wide px-1 text-center leading-tight break-words">
                            {categoryAbbreviations[category] || category.toUpperCase()}
                          </span>
                          <span className="hidden sm:inline font-semibold text-xs font-sans tracking-wide px-1 text-center leading-tight break-words">
                            {category}
                          </span>
                        </>

                      </>                    
                    {square.player && (
                      <span className="text-[10px] uppercase font-bold mt-1">
                        {square.player.split(" ").map((part, i) =>
                          i === 0 ? part.charAt(0).toUpperCase() + "." : part.toUpperCase()
                        ).join(" ")}
                      </span>
                    )}
                  </div>
                </motion.button>
              </div>
            );
          })}
        </div>

            

        <div className="w-full flex justify-between mt-4 px-4">
          <button
            className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
            onClick={() => setDayOffset(prev => Math.min(DAYS - 1, prev + 1))}
            disabled={dayOffset >= DAYS - 1}
          >
            &lt; Previous
          </button>
          <div className="text-sm text-gray-300 font-semibold">
            #{gameNumber}
          </div>
          <button
            className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
            onClick={() => setDayOffset(prev => Math.max(0, prev - 1))}
            disabled={dayOffset <= 0}
          >
            Next &gt;
          </button>
        </div>

        {isAdmin && (
          <div className="flex gap-2 justify-center mt-2">
            <button
              className={`bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-semibold px-3 py-1 rounded ${
                dayOffset === -1 ? 'ring-2 ring-yellow-300' : ''
              }`}
              onClick={() => setDayOffset(-1)}
            >
              Preview Tomorrow
            </button>
            <button
              className="bg-gray-700 hover:bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded"
              onClick={() => setDayOffset(0)}
            >
              Back to Today
            </button>
          </div>
        )}
      </div>

      {showEndModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white p-6 rounded-md shadow-lg text-center max-w-sm w-full relative">
            <button
              className="absolute top-2 right-3 text-white text-xl font-bold"
              onClick={() => setShowEndModal(false)}
            >
              ×
            </button>

            {selectedSquares.filter(s =>
                s.status !== null && ["correct", "wildcard"].includes(s.status)
              ).length === 16 ? (
                <>
                  <h2 className="text-xl font-bold mb-2">🎉 You Won!</h2>
                  <p>
                    You won with{" "}
                    <span className="font-bold">
                      {playerQueue.length - currentPlayerIndex}
                    </span>{" "}
                    players remaining!
                  </p>
                </>
              ) : (
              <>
                <h2 className="text-2xl font-bold mb-2 text-red-400">YOU LOST</h2>
                <p className="mb-4">Better luck tomorrow!</p>
                <button
                  onClick={revealAnswers}
                  className="mt-2 bg-lime-400 hover:bg-lime-500 text-black font-bold px-4 py-2 rounded"
                >
                  Reveal Answers
                </button>
              </>
            )}

            <button
              onClick={() => {
                setShowEndModal(false);
                setCurrentPlayerIndex(0);
                setSelectedSquares(
                  Array.from({ length: 16 }, () => ({ status: null, player: null }))
                );
                setGameStarted(false);
              }}
              className="mt-4 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
      <div className="max-w-prose mx-auto px-4 py-6 text-sm text-gray-200 leading-relaxed">
        <h2 className="text-xl font-bold mb-2">What is Touchdown Bingo?</h2>
        <p>
          Touchdown Bingo is a daily NFL and college football guessing game. 
          Try to complete your bingo board by matching players to teams, awards, and coaches. 
          Each day brings a new challenge, with over 100+ categories and famous players.
        </p>
        <p>
          Explore Hall of Famers, Heisman winners, and your favorite NFL franchises.
          Come back daily to test your football knowledge!
        </p>
      </div>
    </div>
  );
}
