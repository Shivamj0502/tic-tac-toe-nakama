import { useEffect, useState, useCallback } from "react";
import { Client } from "@heroiclabs/nakama-js";

function App() {
  const [socket, setSocket] = useState(null);
  const [matchId, setMatchId] = useState("");
  const [board, setBoard] = useState(Array(9).fill(""));
  const [symbol, setSymbol] = useState("");
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState(null);

  const checkWinner = (newBoard) => {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    for (let [a,b,c] of lines) {
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        return newBoard[a];
      }
    }

    if (!newBoard.includes("")) return "Draw";
    return null;
  };

  const updateBoard = useCallback((index, sym) => {
    setBoard((prev) => {
      const updated = [...prev];
      if (updated[index] !== "") return prev;

      updated[index] = sym;

      const result = checkWinner(updated);
      if (result) setWinner(result);

      return updated;
    });

    setTurn(sym === "X" ? "O" : "X");
  }, []);

  useEffect(() => {
    const client = new Client("defaultkey", "127.0.0.1", "7350", false);

    const authenticate = async () => {
      const session = await client.authenticateDevice(
        Math.random().toString()
      );

      const newSocket = client.createSocket(false, false);
      await newSocket.connect(session, true);

      newSocket.onmatchdata = (matchState) => {
        try {
          const decoded = matchState.data
            ? new TextDecoder().decode(matchState.data)
            : "{}";

          const data = JSON.parse(decoded);
          updateBoard(data.index, data.symbol);
        } catch {
          console.log("decode skipped");
        }
      };

      setSocket(newSocket);
    };

    authenticate();
  }, [updateBoard]);

  const createMatch = async () => {
    if (!socket) return;
    const match = await socket.createMatch();
    setMatchId(match.match_id);
    setSymbol("X");
    setTurn("X");
    setBoard(Array(9).fill(""));
    setWinner(null);
  };

  const joinMatch = async () => {
    if (!socket || !matchId) return;
    await socket.joinMatch(matchId);
    setSymbol("O");
  };

  const handleClick = async (index) => {
    if (!socket || !matchId) return;
    if (!symbol) return;
    if (winner) return;
    if (turn !== symbol) return;
    if (board[index] !== "") return;

    updateBoard(index, symbol);

    const message = { index, symbol };

    await socket.sendMatchState(
      matchId,
      1,
      JSON.stringify(message)
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Tic Tac Toe Multiplayer</h1>

      <p>You are: {symbol || "-"}</p>
      <p>Turn: {turn}</p>

      {winner && (
        <h2>
          {winner === "Draw"
            ? "It's a Draw!"
            : `Winner: ${winner}`}
        </h2>
      )}

      <button onClick={createMatch}>Create Match</button>

      <br /><br />

      <input
        placeholder="Enter match id"
        value={matchId}
        onChange={(e) => setMatchId(e.target.value)}
      />

      <button onClick={joinMatch}>Join Match</button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 100px)",
          gap: "5px",
          marginTop: "20px"
        }}
      >
        {board.map((cell, index) => (
          <button
            key={index}
            style={{
              width: "100px",
              height: "100px",
              fontSize: "24px"
            }}
            onClick={() => handleClick(index)}
          >
            {cell}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;