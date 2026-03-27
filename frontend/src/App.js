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
    // UPDATED: Railway Production Settings
    const client = new Client(
      "defaultkey", 
      "tic-tac-toe-nakama-production.up.railway.app", 
      "443", 
      true
    );

    const authenticate = async () => {
      try {
        const session = await client.authenticateDevice(
          Math.random().toString()
        );

        // UPDATED: Use SSL for Railway (true)
        const newSocket = client.createSocket(true, false);
        await newSocket.connect(session, true);

        newSocket.onmatchdata = (matchState) => {
          try {
            const decoded = matchState.data
              ? new TextDecoder().decode(matchState.data)
              : "{}";
            const data = JSON.parse(decoded);
            updateBoard(data.index, data.symbol);
          } catch (e) {
            console.error("Decode error:", e);
          }
        };

        setSocket(newSocket);
      } catch (err) {
        console.error("Auth/Socket Error:", err);
      }
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
    console.log("Match Created ID:", match.match_id);
  };

  const joinMatch = async () => {
    if (!socket || !matchId) return;
    await socket.joinMatch(matchId);
    setSymbol("O");
    setBoard(Array(9).fill(""));
    setWinner(null);
  };

  const handleClick = async (index) => {
    if (!socket || !matchId || !symbol || winner || turn !== symbol || board[index] !== "") return;

    updateBoard(index, symbol);
    const message = { index, symbol };

    await socket.sendMatchState(
      matchId,
      1,
      JSON.stringify(message)
    );
  };

  return (
    <div style={{ padding: "20px", textAlign: "center", fontFamily: "Arial" }}>
      <h1>Tic Tac Toe Multiplayer</h1>
      <div style={{ marginBottom: "10px" }}>
        <p><strong>Status:</strong> {socket ? "✅ Connected" : "❌ Connecting..."}</p>
        <p>You are: <span style={{ color: "blue" }}>{symbol || "Waiting..."}</span></p>
        <p>Turn: <span style={{ fontWeight: "bold" }}>{turn}</span></p>
      </div>

      {winner && (
        <h2 style={{ color: "red" }}>
          {winner === "Draw" ? "It's a Draw!" : `Winner: ${winner}`}
        </h2>
      )}

      <button onClick={createMatch} style={{ padding: "10px 20px", cursor: "pointer" }}>Create Match</button>
      <br /><br />
      <input
        placeholder="Enter match id"
        value={matchId}
        onChange={(e) => setMatchId(e.target.value)}
        style={{ padding: "10px", width: "250px" }}
      />
      <button onClick={joinMatch} style={{ padding: "10px 20px", marginLeft: "5px", cursor: "pointer" }}>Join Match</button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 100px)",
          gap: "10px",
          justifyContent: "center",
          marginTop: "30px"
        }}
      >
        {board.map((cell, index) => (
          <button
            key={index}
            style={{
              width: "100px",
              height: "100px",
              fontSize: "32px",
              cursor: "pointer",
              backgroundColor: "#f0f0f0",
              border: "2px solid #333"
            }}
            onClick={() => handleClick(index)}
          >
            {cell}
          </button>
        ))}
      </div>
      {matchId && <p style={{ marginTop: "20px", fontSize: "12px" }}>Match ID: {matchId}</p>}
    </div>
  );
}

export default App;