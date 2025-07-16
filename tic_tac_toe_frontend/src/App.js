import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// Color theme (matches project scheme)
const COLORS = {
  primary: "#1565c0",
  secondary: "#43a047",
  accent: "#fbc02d",
};

const API_URL = process.env.REACT_APP_API_URL;

// Utilities
function api(endpoint, method = "GET", body = null, token = null) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.detail || data.message || r.statusText);
    return data;
  });
}

// ======== Auth Components ========

const AuthForm = ({ mode, onAuth, error, loading }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      className="auth-form"
      onSubmit={(e) => {
        e.preventDefault();
        onAuth(username, password);
      }}
    >
      <h2 style={{ color: COLORS.primary, letterSpacing: 1, fontWeight: 700 }}>
        {mode === "register" ? "Register" : "Login"}
      </h2>
      <input
        className="input"
        type="text"
        value={username}
        autoFocus
        placeholder="Username"
        onChange={(e) => setUsername(e.target.value)}
        minLength={3}
        maxLength={20}
        required
        autoComplete="username"
      />
      <input
        className="input"
        type="password"
        value={password}
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        minLength={4}
        maxLength={30}
        required
        autoComplete={mode}
      />
      {error && <div className="error">{error}</div>}
      <button
        style={{
          background: COLORS.primary,
          color: "white",
          borderRadius: 8,
          marginTop: 8,
          fontWeight: 700,
          fontSize: 16,
        }}
        disabled={loading}
        type="submit"
        className="btn"
      >
        {loading ? "..." : mode === "register" ? "Register" : "Login"}
      </button>
    </form>
  );
};

const AuthPage = ({ onLogin, onRegister, error, loading }) => {
  const [mode, setMode] = useState("login");
  return (
    <div className="centered-page auth-bg">
      <div className="auth-card">
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h1
            style={{
              color: COLORS.primary,
              fontWeight: 900,
              fontSize: 36,
              marginBottom: 8,
            }}
          >
            Tic Tac Toe Online
          </h1>
          <span
            style={{
              color: COLORS.secondary,
              fontSize: 18,
              letterSpacing: 1,
            }}
          >
            Play. Compete. Track your Wins!
          </span>
        </div>
        <AuthForm
          mode={mode}
          onAuth={mode === "register" ? onRegister : onLogin}
          error={error}
          loading={loading}
        />
        <div
          style={{ textAlign: "center", marginTop: 16, fontWeight: 500 }}
        >
          {mode === "login" ? (
            <>
              No account?{" "}
              <button
                onClick={() => setMode("register")}
                type="button"
                className="linkish"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already a user?{" "}
              <button
                onClick={() => setMode("login")}
                type="button"
                className="linkish"
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ======== Lobby / Game Join/Create ========

const LobbyPage = ({
  user,
  onLogout,
  onCreateGame,
  onJoinGame,
  games,
  refreshGames,
  loading,
}) => {
  const [joiningGameId, setJoiningGameId] = useState("");
  return (
    <div className="centered-page" style={{ padding: 0 }}>
      <div className="topbar">
        <span
          style={{
            color: COLORS.primary,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 1,
          }}
        >
          {user && user.username}
        </span>
        <button className="btn small" onClick={onLogout}>
          Logout
        </button>
      </div>
      <div className="lobby-card">
        <h2 style={{ color: COLORS.secondary }}>Game Lobby</h2>
        <button
          className="btn"
          style={{
            marginBottom: 10,
            background: COLORS.accent,
            color: "#1a1a1a",
          }}
          onClick={onCreateGame}
          disabled={loading}
        >
          + Create New Game
        </button>
        <div
          style={{
            margin: "12px 0",
            padding: 0,
            minHeight: 24,
            letterSpacing: 0.3,
            color: "#777",
          }}
        >
          <b>Available Games:</b>
        </div>
        <button className="btn small" onClick={refreshGames} style={{marginBottom:8}}>Refresh List</button>
        <ul className="games-list">
          {games.length === 0 ? (
            <li style={{ padding: "8px 0", color: "#bbb" }}>
              No joinable games found.
            </li>
          ) : (
            games.map((g) => (
              <li key={g.id} className="game-row">
                <span>
                  #{g.id.slice(-5)} ({g.playerCount}/2){" "}
                  {g.started && (
                    <span style={{ color: "#ccc" }}>(Started)</span>
                  )}
                </span>
                <button
                  className="btn small"
                  disabled={g.playerCount >= 2}
                  onClick={() => onJoinGame(g.id)}
                  style={{
                    background: COLORS.primary,
                    opacity: g.playerCount >= 2 ? 0.5 : 1,
                  }}
                >
                  {g.playerCount >= 2 ? "Full" : "Join"}
                </button>
              </li>
            ))
          )}
        </ul>
        <div style={{ marginTop: 18, fontWeight: 500 }}>
          <ScoreLink />
        </div>
      </div>
    </div>
  );
};

// Jump to Score History dashboard
function ScoreLink() {
  const onScoreDash = () =>
    window.dispatchEvent(new CustomEvent("nav", { detail: { page: "score" } }));
  return (
    <button
      className="btn small"
      style={{
        background: COLORS.secondary,
        color: "#fff",
        margin: "0 6px",
        fontWeight: 700,
      }}
      onClick={onScoreDash}
      type="button"
    >
      🏆 Score Dashboard
    </button>
  );
}

// ======= Game Board =======

function GamePage({
  user,
  game,
  onMove,
  onLeave,
  status,
  message,
  isPlayerTurn,
  result,
  loading,
}) {
  if (!game) return null;
  const { board, players, current_turn, player_symbols } = game;
  const meSym = player_symbols[user.username];
  const opUser =
    Object.keys(player_symbols).find((u) => u !== user.username) || null;
  const opSym = opUser && player_symbols[opUser];

  return (
    <div className="game-layout">
      <div className="topbar">
        <span>
          <b style={{ color: COLORS.primary }}>{user.username}</b> ({meSym || "-"}){" "}
          {opUser ? (
            <>
              vs <b style={{ color: COLORS.secondary }}>{opUser}</b> ({opSym})
            </>
          ) : (
            <span style={{ color: "#aaa", marginLeft: 6 }}>Waiting for 2nd player…</span>
          )}
        </span>
        <button className="btn small" onClick={onLeave}>Leave</button>
      </div>
      <div className="game-content">
        <Board
          board={board}
          mySymbol={meSym}
          yourTurn={isPlayerTurn}
          onCellClick={onMove}
          disabled={!!result || !isPlayerTurn || loading}
        />
        <div className="game-status">
          {message && (
            <div className="game-msg" style={{ color: COLORS.primary }}>
              {message}
            </div>
          )}
          {result && (
            <GameResult result={result} />
          )}
        </div>
      </div>
    </div>
  );
}

function Board({ board, onCellClick, mySymbol, yourTurn, disabled }) {
  return (
    <div className="ttt-board">
      {board &&
        board.map((row, i) =>
          row.map((cell, j) => (
            <button
              key={`${i}-${j}`}
              className={`board-cell ${cell ? "filled" : ""}`}
              onClick={() => (!cell && !disabled) && onCellClick(i, j)}
              style={{
                color:
                  cell === "X"
                    ? COLORS.primary
                    : cell === "O"
                    ? COLORS.secondary
                    : "#333",
                border: "2px solid #e0e0e0",
                background: cell
                  ? "#f8f8f8"
                  : disabled
                  ? "#fafafa"
                  : COLORS.accent + "33",
                cursor: cell || disabled ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                fontWeight: "900",
              }}
              disabled={!!cell || disabled}
              aria-label={`cell-${i}-${j}`}
            >
              {cell || ""}
            </button>
          ))
        )}
      <div className="board-footer" style={{ gridColumn: "1 / span 3" }}>
        <span>
          Your Symbol: <b>{mySymbol || "—"}</b>
          {yourTurn ? (
            <span style={{ color: COLORS.primary, marginLeft: 14 }}>
              • Your Turn!
            </span>
          ) : (
            ""
          )}
        </span>
      </div>
    </div>
  );
}

function GameResult({ result }) {
  if (result === "draw") {
    return (
      <span className="result-draw">
        It&apos;s a <b>draw!</b> 🤝
      </span>
    );
  }
  const winnerTxt = result?.winner
    ? (
        <>
          Winner: <span style={{ color: COLORS.accent }}>{result.winner}</span> 🎉
        </>
      )
    : null;
  return (
    <span className="result-final">
      {winnerTxt || "Game over"}
    </span>
  );
}

// ======= Score Dashboard =======

function ScoreDashboard({ user, onBack, scores, loading, error }) {
  return (
    <div className="score-page">
      <div className="topbar" style={{marginBottom:24}}>
        <span style={{ color: COLORS.primary, fontWeight: 700, letterSpacing:1 }}>
          Score History
        </span>
        <button className="btn small" onClick={onBack}>&lt; Back</button>
      </div>
      <div className="score-table-wrap">
        <h3
          style={{
            margin: "10px 0",
            color: COLORS.secondary,
            letterSpacing: 0.5,
          }}
        >
          Games Played by {user.username}
        </h3>
        {loading ? (
          <div style={{ color: "#888" }}>Loading...</div>
        ) : error ? (
          <div className="error">{String(error)}</div>
        ) : (
          <ScoreTable scores={scores} currentUser={user.username} />
        )}
      </div>
    </div>
  );
}

function ScoreTable({ scores, currentUser }) {
  if (!scores?.length)
    return <div style={{ color: "#999" }}>No games recorded yet.</div>;
  return (
    <table className="score-table">
      <thead>
        <tr>
          <th>Game</th>
          <th>Opponent</th>
          <th>Outcome</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {scores.map((r, i) => (
          <tr key={i}>
            <td>#{r.game_id.slice(-5)}</td>
            <td>
              {r.opponent || "(N/A)"}
            </td>
            <td>
              {r.winner === currentUser
                ? (
                  <span style={{ color: COLORS.secondary, fontWeight:"bold" }}>
                    Win
                  </span>
                )
                : r.winner === r.opponent
                ? (
                  <span style={{ color: "#d32f2f", fontWeight:"bold" }}>Loss</span>
                )
                : (
                  <span style={{ color: COLORS.accent }}>Draw</span>
                )}
            </td>
            <td>{new Date(r.timestamp).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ======= Main App Component & Logic =======

// Simple router replacement for SPA
function usePageRouter(initial = "auth") {
  const [page, setPage] = useState(initial);
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.page) setPage(e.detail.page);
    };
    window.addEventListener("nav", handler);
    return () => window.removeEventListener("nav", handler);
  }, []);
  return [page, setPage];
}

// PUBLIC_INTERFACE
function App() {
  const [page, setPage] = usePageRouter("auth");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authErr, setAuthErr] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Lobby/game state
  const [games, setGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [game, setGame] = useState(null);
  const [gameStatus, setGameStatus] = useState("");
  const [gameResult, setGameResult] = useState(null);
  const [moveLoading, setMoveLoading] = useState(false);

  // Scores
  const [scores, setScores] = useState([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [scoresError, setScoresError] = useState("");

  // THEME
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "light" ? "dark" : "light")),
    []
  );

  // --- Auth Logic ---
  const handleLogin = (username, password) => {
    setAuthLoading(true);
    api(`/auth/login`, "POST", { username, password })
      .then((resp) => {
        setUser(resp.user);
        setToken(resp.token);
        setPage("lobby");
        setAuthErr("");
      })
      .catch((e) => setAuthErr(String(e)))
      .finally(() => setAuthLoading(false));
  };
  const handleRegister = (username, password) => {
    setAuthLoading(true);
    api(`/auth/register`, "POST", { username, password })
      .then((resp) => {
        setUser(resp.user);
        setToken(resp.token);
        setPage("lobby");
        setAuthErr("");
      })
      .catch((e) => setAuthErr(String(e)))
      .finally(() => setAuthLoading(false));
  };
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setPage("auth");
  };

  // --- Game Lobby Logic ---
  useEffect(() => {
    if (page === "lobby" && token) refreshGames();
    // eslint-disable-next-line
  }, [page, token]);

  const refreshGames = () => {
    setGamesLoading(true);
    api(`/games`, "GET", null, token)
      .then((data) => setGames(data.games || []))
      .catch(() => setGames([]))
      .finally(() => setGamesLoading(false));
  };

  const handleCreateGame = () => {
    setGamesLoading(true);
    api(`/games/create`, "POST", {}, token)
      .then((g) => {
        setGame(g);
        setPage("game");
      })
      .catch((err) => alert("Failed to create game: " + String(err)))
      .finally(() => setGamesLoading(false));
  };

  const handleJoinGame = (gameId) => {
    setGamesLoading(true);
    api(`/games/${gameId}/join`, "POST", {}, token)
      .then((g) => {
        setGame(g);
        setPage("game");
      })
      .catch((err) => alert("Failed to join: " + String(err)))
      .finally(() => setGamesLoading(false));
  };

  // --- Game Play Logic + Poll for state ---
  useEffect(() => {
    if (page !== "game" || !game?.id) return;
    let cancelled = false;
    const fetchLatest = () => {
      api(`/games/${game.id}`, "GET", null, token)
        .then((g) => {
          if (cancelled) return;
          setGame(g);
          if (g.result) setGameResult(g.result);
          else setGameResult(null);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled)
            setTimeout(fetchLatest, 950); // Poll ~1/sec for "real-time"
        });
    };
    fetchLatest();
    return () => { cancelled = true; };
  }, [page, game?.id, token]);

  const isMyTurn =
    game && game.current_turn && user && game.player_symbols[user.username] === game.current_turn;
  const gameResultObj =
    game && game.result
      ? typeof game.result === "object"
        ? game.result
        : game.result === "draw"
        ? { winner: null }
        : { winner: game.result }
      : null;

  const handleMove = (i, j) => {
    setMoveLoading(true);
    api(`/games/${game.id}/move`, "POST", { row: i, col: j }, token)
      .then((g) => {
        setGame(g);
        if (g.result) setGameResult(g.result);
      })
      .catch((err) =>
        setGameStatus("Move failed: " + String(err))
      )
      .finally(() => setMoveLoading(false));
  };

  const handleLeaveGame = () => {
    setGame(null);
    setPage("lobby");
  };

  // --- Scores Dashboard ---
  const goToScoreDash = () => setPage("score");
  useEffect(() => {
    if (page !== "score" || !user || !token) return;
    setScoresLoading(true);
    setScoresError("");
    api(`/scores`, "GET", null, token)
      .then((data) => setScores(data.scores || []))
      .catch((e) => setScoresError(String(e)))
      .finally(() => setScoresLoading(false));
  }, [page, user, token]);

  // Router-like SPA logic
  let renderPage = null;
  if (!user || page === "auth")
    renderPage = (
      <AuthPage
        onLogin={handleLogin}
        onRegister={handleRegister}
        error={authErr}
        loading={authLoading}
      />
    );
  else if (page === "lobby")
    renderPage = (
      <LobbyPage
        user={user}
        onLogout={handleLogout}
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
        games={games}
        refreshGames={refreshGames}
        loading={gamesLoading}
      />
    );
  else if (page === "game")
    renderPage = (
      <GamePage
        user={user}
        game={game}
        onMove={handleMove}
        onLeave={handleLeaveGame}
        status={gameStatus}
        message={gameStatus}
        isPlayerTurn={isMyTurn}
        result={gameResultObj}
        loading={moveLoading}
      />
    );
  else if (page === "score")
    renderPage = (
      <ScoreDashboard
        user={user}
        onBack={() => setPage("lobby")}
        scores={scores}
        loading={scoresLoading}
        error={scoresError}
      />
    );

  return (
    <div className="App">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
      {renderPage}
      <footer className="footer" style={{ background: "#f3f6fa", color:"#666" }}>
        <div>
          <a
            href="https://github.com/kavia-ai"
            style={{ color: COLORS.primary, marginRight: 12, textDecoration:"none" }}
          >
            GitHub
          </a>
          <span style={{ fontSize: 12 }}>
            &copy; {new Date().getFullYear()} TicTacToe App
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;

