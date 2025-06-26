// Touchdown Bingo Home Component (Fully Styled and Functional)
"use client";

import { useState, useEffect, useRef } from "react";
import { players } from "../data/players";
import { categories } from "../data/categories";
import {
  generateValidCategories,
  pickWinnablePlayers,
  seededShuffle,
} from "./utils/bingo";

export default function Home() {
  const todaySeed = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
  const DAYS = 10;
  const [dayOffset, setDayOffset] = useState(0);
  const boardSetRef = useRef<Record<number, { board: string[]; queue: any[] }>>({});

  const [boardCategories, setBoardCategories] = useState([]);
  const [playerQueue, setPlayerQueue] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [selectedSquares, setSelectedSquares] = useState(
    Array.from({ length: 16 }, () => ({ status: null, player: null }))
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [wildcardUsed, setWildcardUsed] = useState(false);

  const seed = todaySeed - dayOffset;
  const currentPlayer = playerQueue[currentPlayerIndex] || null;

  useEffect(() => {
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

  function handleCategoryClick(index) {
    const category = boardCategories[index];
    const isCorrect = currentPlayer.categories.includes(category);

    if (isCorrect) {
      const newSelected = [...selectedSquares];
      newSelected[index] = {
        status: "correct",
        player: currentPlayer.name,
      };
      setSelectedSquares(newSelected);

      const totalCorrect = newSelected.filter(sq =>
        ["correct", "wildcard"].includes(sq.status)
      ).length;
      if (totalCorrect === 16) {
        setShowEndModal(true);
        return;
      }

      setCurrentPlayerIndex(prev => prev + 1);
    } else {
      const newSelected = [...selectedSquares];
      newSelected[index] = { status: "wrong", player: null };
      setSelectedSquares(newSelected);

      setTimeout(() => {
        setSelectedSquares(prevSelected =>
          prevSelected.map(val =>
            val.status === "wrong" ? { status: null, player: null } : val
          )
        );
        setCurrentPlayerIndex(prev => prev + 2);
      }, 500);
    }
  }

  function handleWildcard() {
    if (!currentPlayer) return;

    const newSelected = [...selectedSquares];
    let matched = false;

    boardCategories.forEach((cat, index) => {
      const isAlreadyGuessed = newSelected[index].status !== null;
      const isMatch = currentPlayer.categories.includes(cat);
      if (!isAlreadyGuessed && isMatch) {
        newSelected[index] = {
          status: "wildcard",
          player: currentPlayer.name,
        };
        matched = true;
      }
    });

    if (matched) {
      setSelectedSquares(newSelected);
      setWildcardUsed(true);
      setCurrentPlayerIndex(prev => prev + 1);
    }
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

  return (
    <div className="min-h-screen pt-6 pb-2 text-center flex flex-col items-center gap-4 bg-[#001f3f] text-white">
      <h1 className="text-4xl font-bold" style={{ fontFamily: 'Impact', letterSpacing: '1px' }}>
        Touchdown Bingo
      </h1>

      <div className="w-full max-w-[480px]">
        

        <div className="bg-blue-800 text-white p-6 rounded-t-md w-full mx-auto flex flex-col items-center gap-2 relative">
          {gameStarted ? (
            <>
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white text-black text-3xl font-bold absolute left-4 top-4">
                {Math.max(0, playerQueue.length - currentPlayerIndex)}
              </div>
              {currentPlayer && (
                <div className="text-3xl font-bold">{currentPlayer.name}</div>
              )}
              <div className="h-[30px] mt-1">
                {!wildcardUsed && (
                  <button
                    onClick={handleWildcard}
                    className="bg-lime-400 hover:bg-lime-500 text-black text-xs font-semibold px-4 py-1 rounded mt-1"
                  >
                    Play Wildcard
                  </button>
                )}
              </div>
              {!showEndModal && (
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

        <div className="grid grid-cols-4 w-full aspect-square rounded-b-md overflow-hidden">
          {boardCategories.map((category, index) => {
            const safeFileName = category
              .toLowerCase()
              .replace(/ /g, "_")
              .replace(/[^\w_]/g, "");
            const square = selectedSquares[index];
            const isEvenRow = Math.floor(index / 4) % 2 === 0;
            const isEvenCol = index % 2 === 0;
            const isDark = isEvenRow ? isEvenCol : !isEvenCol;

            return (
              <div key={index} className="relative w-full aspect-square">
                <button
                  className={`absolute inset-0 flex flex-col items-center justify-center text-xs font-medium text-center transition-all duration-200 ${
                    square.status === "wrong"
                      ? "bg-red-500 text-white"
                      : isDark
                      ? "bg-gray-500 text-white hover:bg-gray-600"
                      : "bg-gray-800 text-white hover:bg-gray-700"
                  }`}
                  onClick={() => handleCategoryClick(index)}
                  disabled={square.status !== null}
                >
                  {["correct", "revealed", "wildcard"].includes(square.status) && (
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
                    ></div>
                  )}

                  <div className="relative z-10 flex flex-col items-center">
                    {gameStarted && (
                      <>
                        <img
                          src={`/logos/${safeFileName}.png`}
                          alt={category}
                          className="w-14 h-14 object-contain mb-2"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <span className="font-semibold text-xs font-sans tracking-wide px-1">
                          {category}
                        </span>
                      </>
                    )}
                    {square.player && (
                      <span className="text-[10px] uppercase font-bold mt-1">
                        {square.player.split(" ").map((part, i) =>
                          i === 0 ? part.charAt(0).toUpperCase() + "." : part.toUpperCase()
                        ).join(" ")}
                      </span>
                    )}
                  </div>
                </button>
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
            #{DAYS - dayOffset}
          </div>
          <button
            className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
            onClick={() => setDayOffset(prev => Math.max(0, prev - 1))}
            disabled={dayOffset <= 0}
          >
            Next &gt;
          </button>
        </div>
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
                ["correct", "wildcard"].includes(s.status)
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
    </div>
  );
}
