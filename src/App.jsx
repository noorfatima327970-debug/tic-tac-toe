import { useEffect, useRef, useState } from "react";
import {
  FaRobot,
  FaUserFriends,
  FaRedoAlt,
  FaVolumeUp,
  FaVolumeMute,
  FaTrophy,
  FaArrowRight,
  FaArrowLeft,
  FaPlay,
  FaHeart,
  FaStar,
} from "react-icons/fa";

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const EMPTY_BOARD = Array(9).fill(null);

function checkWinner(board) {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;

    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return {
        winner: board[a],
        line,
      };
    }
  }

  return null;
}

function minimax(board, depth, maximizing) {
  const result = checkWinner(board);

  if (result?.winner === "O") return 10 - depth;
  if (result?.winner === "X") return depth - 10;
  if (board.every(Boolean)) return 0;

  let best = maximizing ? -Infinity : Infinity;

  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;

    board[i] = maximizing ? "O" : "X";

    const score = minimax(
      board,
      depth + 1,
      !maximizing
    );

    board[i] = null;

    best = maximizing
      ? Math.max(best, score)
      : Math.min(best, score);
  }

  return best;
}

function getBestMove(board) {
  let bestScore = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;

    board[i] = "O";

    const score = minimax(board, 0, false);

    board[i] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }

  return bestMove;
}

// Animated SVG X / O
function Symbol({ type, size = 80, animated = true }) {
  if (type === "X") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        className={`symbol-x ${animated ? "symbol-animate" : ""}`}
      >
        <path
          d="M23 23 L77 77"
          stroke="currentColor"
          strokeWidth="11"
          strokeLinecap="round"
          className="symbol-path"
        />
        <path
          d="M77 23 L23 77"
          stroke="currentColor"
          strokeWidth="11"
          strokeLinecap="round"
          className="symbol-path"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={`symbol-o ${animated ? "symbol-animate" : ""}`}
    >
      <circle
        cx="50"
        cy="50"
        r="31"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
        className="symbol-circle"
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
}

// Decorative background
function FloatingShapes() {
  return (
    <div className="floating-shapes" aria-hidden="true">
      <div className="shape shape-1">
        <Symbol type="X" size={85} />
      </div>

      <div className="shape shape-2">
        <Symbol type="O" size={110} />
      </div>

      <div className="shape shape-3">
        <Symbol type="X" size={55} />
      </div>

      <div className="shape shape-4">
        <Symbol type="O" size={70} />
      </div>

      <div className="shape shape-5">
        <Symbol type="X" size={120} />
      </div>

      <div className="shape shape-6">
        <Symbol type="O" size={45} />
      </div>
    </div>
  );
}

// Confetti
function Confetti() {
  return (
    <div className="confetti-container" aria-hidden="true">
      {Array.from({ length: 35 }).map((_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${(i % 10) * 0.12}s`,
            backgroundColor: [
              "#ff6b9d",
              "#ffc857",
              "#8b5cf6",
              "#38bdf8",
              "#ffffff",
            ][i % 5],
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState("computer");

  const [board, setBoard] = useState([...EMPTY_BOARD]);
  const [isXTurn, setIsXTurn] = useState(true);
  const [isThinking, setIsThinking] = useState(false);

  const [scores, setScores] = useState({
    X: 0,
    O: 0,
    draw: 0,
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [winningLine, setWinningLine] = useState([]);

  const timerRef = useRef(null);
  const audioRef = useRef(null);

  const result = checkWinner(board);
  const winner = result?.winner;
  const isDraw = !winner && board.every(Boolean);
  const gameOver = Boolean(winner || isDraw);

  // Sound
  const playSound = (frequency = 500) => {
    if (!soundEnabled) return;

    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      if (!audioRef.current) {
        audioRef.current = new AudioContext();
      }

      const ctx = audioRef.current;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.07, ctx.currentTime);

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.18
      );

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.18);
    } catch {
      // Sound is optional.
    }
  };

  const resetBoard = () => {
    clearTimeout(timerRef.current);
    timerRef.current = null;

    setBoard([...EMPTY_BOARD]);
    setIsXTurn(true);
    setIsThinking(false);
    setWinningLine([]);
  };

  const startGame = (selectedMode) => {
    resetBoard();

    setScores({
      X: 0,
      O: 0,
      draw: 0,
    });

    setMode(selectedMode);
    setScreen("game");

    playSound(650);
  };

  const backHome = () => {
    resetBoard();
    setScreen("home");
  };

  const applyMove = (nextBoard, player) => {
    const gameResult = checkWinner(nextBoard);

    setBoard(nextBoard);

    if (gameResult) {
      setWinningLine(gameResult.line);

      setScores((prev) => ({
        ...prev,
        [gameResult.winner]: prev[gameResult.winner] + 1,
      }));

      playSound(850);
      return;
    }

    if (nextBoard.every(Boolean)) {
      setScores((prev) => ({
        ...prev,
        draw: prev.draw + 1,
      }));

      playSound(350);
      return;
    }

    setIsXTurn(player === "O");
  };

  const handleCellClick = (index) => {
    if (
      board[index] ||
      gameOver ||
      isThinking ||
      (mode === "computer" && !isXTurn)
    ) {
      return;
    }

    const nextBoard = [...board];
    const player = isXTurn ? "X" : "O";

    nextBoard[index] = player;

    playSound(player === "X" ? 520 : 420);
    applyMove(nextBoard, player);

    if (
      mode === "computer" &&
      player === "X" &&
      !checkWinner(nextBoard) &&
      !nextBoard.every(Boolean)
    ) {
      setIsThinking(true);

      timerRef.current = setTimeout(() => {
        const computerBoard = [...nextBoard];
        const move = getBestMove(computerBoard);

        if (move !== -1) {
          computerBoard[move] = "O";
          applyMove(computerBoard, "O");
        }

        setIsThinking(false);
        timerRef.current = null;
      }, 650);
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      audioRef.current?.close();
    };
  }, []);

  const statusText = winner
    ? winner === "X"
      ? "Player X Wins!"
      : mode === "computer"
      ? "Computer Wins!"
      : "Player O Wins!"
    : isDraw
    ? "It's a Draw!"
    : isThinking
    ? "AI is thinking..."
    : isXTurn
    ? "Player X's Turn"
    : mode === "computer"
    ? "Computer's Turn"
    : "Player O's Turn";

  return (
    <div className="app-container">
      <FloatingShapes />

      {/* Top Navbar */}
      <header className="top-navbar">
        <div className="brand">
          <span className="brand-icon">
            <Symbol type="X" size={24} animated={false} />
            <Symbol type="O" size={24} animated={false} />
          </span>

          <span>TIC TAC TOE</span>
        </div>

        <button
          className="sound-toggle"
          onClick={() => setSoundEnabled((prev) => !prev)}
          aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
        >
          {soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
        </button>
      </header>

      <main className="main-content">
        {screen === "home" ? (
          // HOME SCREEN
          <div className="home-screen screen-enter">
            <div className="home-badge">
              <FaStar />
              <span>THE CLASSIC GAME, REIMAGINED</span>
              <FaStar />
            </div>

            {/* Hero Animated Symbols */}
            <div className="hero-symbols">
              <div className="hero-symbol hero-x">
                <Symbol type="X" size={130} />
              </div>

              <div className="hero-symbol hero-o">
                <Symbol type="O" size={130} />
              </div>

              <div className="hero-sparkle sparkle-1">✦</div>
              <div className="hero-sparkle sparkle-2">✧</div>
              <div className="hero-sparkle sparkle-3">✦</div>
            </div>

            <h1 className="hero-title">
              TIC TAC
              <span>TOE!</span>
            </h1>

            <p className="hero-description">
              A little strategy, a little fun, and a whole lot
              of X's and O's!
            </p>

            <div className="mode-selection">
              <button
                className="mode-card mode-computer"
                onClick={() => startGame("computer")}
              >
                <div className="mode-icon">
                  <FaRobot />
                </div>

                <div className="mode-text">
                  <h3>Play with AI</h3>
                  <p>Challenge the computer</p>
                </div>

                <FaArrowRight className="mode-arrow" />
              </button>

              <button
                className="mode-card mode-friends"
                onClick={() => startGame("player")}
              >
                <div className="mode-icon">
                  <FaUserFriends />
                </div>

                <div className="mode-text">
                  <h3>Play with Friend</h3>
                  <p>Two players, one screen</p>
                </div>

                <FaArrowRight className="mode-arrow" />
              </button>
            </div>

            <p className="home-bottom-text">
              <FaHeart /> Made for fun & friendly competition
            </p>
          </div>
        ) : (
          // GAME SCREEN
          <div className="game-screen screen-enter">
            <div className="game-top">
              <button
                className="back-button"
                onClick={backHome}
              >
                <FaArrowLeft />
                <span>Back</span>
              </button>

              <div className="game-mode-label">
                {mode === "computer" ? (
                  <>
                    <FaRobot /> VS COMPUTER
                  </>
                ) : (
                  <>
                    <FaUserFriends /> 2 PLAYERS
                  </>
                )}
              </div>
            </div>

            <div className="game-heading">
              <h1>
                Let's <span>Play!</span>
              </h1>

              <p>Three in a row takes the crown.</p>
            </div>

            {/* Scoreboard */}
            <div className="scoreboard">
              <div className="score-card player-x-score">
                <div className="score-symbol">
                  <Symbol
                    type="X"
                    size={30}
                    animated={false}
                  />
                </div>

                <span className="score-name">YOU / X</span>
                <strong>{scores.X}</strong>
              </div>

              <div className="score-card draw-score">
                <span className="draw-icon">=</span>
                <span className="score-name">DRAWS</span>
                <strong>{scores.draw}</strong>
              </div>

              <div className="score-card player-o-score">
                <div className="score-symbol">
                  <Symbol
                    type="O"
                    size={30}
                    animated={false}
                  />
                </div>

                <span className="score-name">
                  {mode === "computer" ? "AI / O" : "PLAYER O"}
                </span>

                <strong>{scores.O}</strong>
              </div>
            </div>

            {/* Game Status */}
            <div
              className={`game-status ${
                winner ? "winner-status" : ""
              }`}
            >
              {winner ? (
                <FaTrophy />
              ) : isDraw ? (
                <FaStar />
              ) : isThinking ? (
                <FaRobot className="thinking-icon" />
              ) : (
                <span className="status-dot" />
              )}

              <span>{statusText}</span>
            </div>

            {/* Board */}
            <div className="board-wrapper">
              <div className="game-board">
                {board.map((cell, index) => (
                  <button
                    key={index}
                    onClick={() => handleCellClick(index)}
                    disabled={
                      Boolean(cell) ||
                      gameOver ||
                      isThinking
                    }
                    aria-label={`Cell ${index + 1}: ${
                      cell || "empty"
                    }`}
                    className={`board-cell ${
                      winningLine.includes(index)
                        ? "winning-cell"
                        : ""
                    } ${
                      !cell && !gameOver && !isThinking
                        ? "empty-cell"
                        : ""
                    }`}
                  >
                    {cell && (
                      <Symbol
                        type={cell}
                        size={76}
                        animated
                      />
                    )}
                  </button>
                ))}
              </div>

              {winner && <Confetti />}
            </div>

            {/* Bottom Controls */}
            <div className="game-controls">
              <button
                className="restart-button"
                onClick={() => {
                  resetBoard();
                  playSound(600);
                }}
              >
                <FaRedoAlt />
                <span>Play Again</span>
              </button>

              <button
                className="change-mode-button"
                onClick={backHome}
              >
                <FaPlay />
                <span>Change Mode</span>
              </button>
            </div>

            <p className="game-tip">
              ✦ First to match 3 symbols wins! ✦
            </p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        MADE WITH <FaHeart /> & A LITTLE MAGIC ✦
      </footer>
    </div>
  );
}