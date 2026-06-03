const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Problem = require("../models/Problem");
const Match = require("../models/Match");
const { evaluateCode } = require("../utils/judge0");

// Matchmaking Queue
// Array of { socket, user: { id, username, elo }, mode, language, joinedAt }
let matchmakingQueue = [];

// Active Battles State
// Map of roomId -> { roomId, mode, problem, players: [{ socketId, userId, username, elo, passed: 0 }], timeRemaining, timerInterval, status }
const activeRooms = new Map();

// Helper to compute ELO change
function calculateElo(playerElo, opponentElo, score) {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const K = 32;
  return Math.round(K * (score - expected));
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    let socketUser = null;

    // Helper to authenticate socket
    const authenticateSocket = (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "code_duel_secret_key");
        return decoded.id;
      } catch (err) {
        return null;
      }
    };

    console.log(`Socket connected: ${socket.id}`);

    // Join Matchmaking Queue
    socket.on("joinQueue", async (data) => {
      const { token, mode, language } = data;
      const userId = authenticateSocket(token);
      
      if (!userId) {
        return socket.emit("queueError", { message: "Authentication failed" });
      }

      try {
        const user = await User.findById(userId);
        if (!user) {
          return socket.emit("queueError", { message: "User not found" });
        }

        // Check if user is already in queue
        matchmakingQueue = matchmakingQueue.filter(item => item.user.id !== userId);

        const queueItem = {
          socket,
          user: {
            id: user._id.toString(),
            username: user.username,
            elo: user.elo
          },
          mode: mode || "ranked",
          language: language || "c",
          joinedAt: new Date()
        };

        // Attempt Matchmaking
        // Search for players in queue matching same mode
        const opponentIndex = matchmakingQueue.findIndex(item => {
          if (item.mode !== queueItem.mode) return false;
          // Simple ELO pairing: within 300 points (casual allows any pairing)
          if (queueItem.mode === "ranked") {
            return Math.abs(item.user.elo - queueItem.user.elo) <= 300;
          }
          return true; // Casual pairs immediately
        });

        if (opponentIndex !== -1) {
          const opponent = matchmakingQueue[opponentIndex];
          matchmakingQueue.splice(opponentIndex, 1); // remove opponent

          // Select a random Problem
          const problems = await Problem.find();
          if (problems.length === 0) {
            return socket.emit("queueError", { message: "No problems loaded in database." });
          }
          const randomProblem = problems[Math.floor(Math.random() * problems.length)];

          // Setup unique Room ID
          const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Create active room state
          activeRooms.set(roomId, {
            roomId,
            mode: queueItem.mode,
            problem: randomProblem,
            players: [
              {
                socketId: socket.id,
                userId: queueItem.user.id,
                username: queueItem.user.username,
                elo: queueItem.user.elo,
                passed: 0,
                codeLength: 0,
                submissions: 0
              },
              {
                socketId: opponent.socket.id,
                userId: opponent.user.id,
                username: opponent.user.username,
                elo: opponent.user.elo,
                passed: 0,
                codeLength: 0,
                submissions: 0
              }
            ],
            timeRemaining: 600, // 10 minutes in seconds
            status: "active",
            timerInterval: null
          });

          // Notify players
          socket.emit("matchFound", {
            roomId,
            opponent: opponent.user,
            problemId: randomProblem._id,
            mode: queueItem.mode
          });

          opponent.socket.emit("matchFound", {
            roomId,
            opponent: queueItem.user,
            problemId: randomProblem._id,
            mode: queueItem.mode
          });

          console.log(`Match Created: ${roomId} between ${user.username} and ${opponent.user.username}`);
        } else {
          // Push to queue
          matchmakingQueue.push(queueItem);
          socket.emit("queueJoined", { message: "Searching for opponent..." });
          console.log(`User joined queue: ${user.username} (Queue Size: ${matchmakingQueue.length})`);
        }
      } catch (err) {
        console.error("Queue join error", err);
        socket.emit("queueError", { message: "Internal server error" });
      }
    });

    // Leave Queue
    socket.on("leaveQueue", () => {
      matchmakingQueue = matchmakingQueue.filter(item => item.socket.id !== socket.id);
      socket.emit("queueLeft");
      console.log(`User left queue: ${socket.id} (Queue Size: ${matchmakingQueue.length})`);
    });

    // Create Custom Room
    socket.on("createCustomRoom", async (data) => {
      const { token } = data;
      const userId = authenticateSocket(token);

      if (!userId) {
        return socket.emit("queueError", { message: "Authentication failed" });
      }

      try {
        const user = await User.findById(userId);
        if (!user) {
          return socket.emit("queueError", { message: "User not found" });
        }

        // Generate unique 6-character uppercase code
        let roomCode = "";
        let codeExists = true;
        while (codeExists) {
          roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          codeExists = false;
          for (const room of activeRooms.values()) {
            if (room.roomCode === roomCode) {
              codeExists = true;
              break;
            }
          }
        }

        const roomId = `room_custom_${roomCode}`;

        // Select a random Problem
        const problems = await Problem.find();
        if (problems.length === 0) {
          return socket.emit("queueError", { message: "No problems loaded in database." });
        }
        const randomProblem = problems[Math.floor(Math.random() * problems.length)];

        activeRooms.set(roomId, {
          roomId,
          roomCode,
          mode: "casual",
          problem: randomProblem,
          players: [
            {
              socketId: socket.id,
              userId: user._id.toString(),
              username: user.username,
              elo: user.elo,
              passed: 0,
              codeLength: 0,
              submissions: 0,
              isHost: true
            }
          ],
          timeRemaining: 600,
          status: "waiting",
          timerInterval: null
        });

        socket.join(roomId);
        socket.emit("customRoomCreated", { roomId, roomCode });
        console.log(`Custom Room Created: ${roomId} (Code: ${roomCode}) by host ${user.username}`);
      } catch (err) {
        console.error("Create custom room error", err);
        socket.emit("queueError", { message: "Internal server error" });
      }
    });

    // Join Custom Room
    socket.on("joinCustomRoom", async (data) => {
      const { token, roomCode } = data;
      const userId = authenticateSocket(token);

      if (!userId) {
        return socket.emit("queueError", { message: "Authentication failed" });
      }

      if (!roomCode) {
        return socket.emit("queueError", { message: "Room code is required" });
      }

      try {
        const user = await User.findById(userId);
        if (!user) {
          return socket.emit("queueError", { message: "User not found" });
        }

        // Find waiting room with matching code
        let targetRoom = null;
        for (const room of activeRooms.values()) {
          if (room.roomCode === roomCode.trim().toUpperCase() && room.status === "waiting") {
            targetRoom = room;
            break;
          }
        }

        if (!targetRoom) {
          return socket.emit("queueError", { message: "Invalid or expired room code" });
        }

        // Prevent joining own room
        if (targetRoom.players[0].userId === user._id.toString()) {
          return socket.emit("queueError", { message: "You cannot join your own room" });
        }

        const host = targetRoom.players[0];

        // Update room state
        targetRoom.players.push({
          socketId: socket.id,
          userId: user._id.toString(),
          username: user.username,
          elo: user.elo,
          passed: 0,
          codeLength: 0,
          submissions: 0,
          isHost: false
        });
        targetRoom.status = "active";

        socket.join(targetRoom.roomId);

        // Notify both players of match found
        io.to(host.socketId).emit("matchFound", {
          roomId: targetRoom.roomId,
          opponent: { id: user._id.toString(), username: user.username, elo: user.elo },
          problemId: targetRoom.problem._id,
          mode: targetRoom.mode
        });

        socket.emit("matchFound", {
          roomId: targetRoom.roomId,
          opponent: { id: host.userId, username: host.username, elo: host.elo },
          problemId: targetRoom.problem._id,
          mode: targetRoom.mode
        });

        console.log(`Custom Match Started: ${targetRoom.roomId} between ${host.username} and ${user.username}`);
      } catch (err) {
        console.error("Join custom room error", err);
        socket.emit("queueError", { message: "Internal server error" });
      }
    });

    // Join Battle Room
    socket.on("joinRoom", async (data) => {
      const { roomId, token } = data;
      const userId = authenticateSocket(token);

      if (!userId) {
        return socket.emit("roomError", { message: "Authentication failed" });
      }

      const room = activeRooms.get(roomId);
      if (!room) {
        return socket.emit("roomError", { message: "Match room not found or expired" });
      }

      const player = room.players.find(p => p.userId === userId);
      if (!player) {
        return socket.emit("roomError", { message: "You are not a participant in this room" });
      }

      // Re-assign socket ID if they reconnected
      player.socketId = socket.id;
      socket.join(roomId);

      // Fetch fresh problem data
      try {
        const fullProblem = await Problem.findById(room.problem._id);
        const opponent = room.players.find(p => p.userId !== userId);

        socket.emit("roomInfo", {
          problem: fullProblem,
          timeRemaining: room.timeRemaining,
          opponent: {
            username: opponent.username,
            elo: opponent.elo,
            passed: opponent.passed,
            codeLength: opponent.codeLength,
            submissions: opponent.submissions
          },
          self: {
            username: player.username,
            elo: player.elo,
            passed: player.passed,
            codeLength: player.codeLength,
            submissions: player.submissions
          },
          status: room.status,
          mode: room.mode
        });

        // If timer hasn't started yet and both are connected, start countdown timer
        const allConnected = room.players.every(p => io.sockets.adapter.rooms.get(roomId)?.has(p.socketId));
        if (allConnected && !room.timerInterval && room.status === "active") {
          room.timerInterval = setInterval(() => {
            room.timeRemaining--;
            io.to(roomId).emit("timerUpdate", { timeRemaining: room.timeRemaining });

            if (room.timeRemaining <= 0) {
              clearInterval(room.timerInterval);
              endMatchDueToTimeout(roomId);
            }
          }, 1000);
        }
      } catch (err) {
        console.error("Room join error", err);
      }
    });

    // Code changes (real-time typing indicator and code length tracker)
    socket.on("codeChange", (data) => {
      const { roomId, codeLength } = data;
      const room = activeRooms.get(roomId);
      if (!room || room.status !== "active") return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      player.codeLength = codeLength;
      
      // Notify opponent
      socket.to(roomId).emit("opponentTyping", {
        codeLength,
        typing: true
      });
    });

    // Run custom/public test cases
    socket.on("runCode", async (data) => {
      const { roomId, code, language } = data;
      const room = activeRooms.get(roomId);
      if (!room || room.status !== "active") {
        return socket.emit("runResult", { success: false, message: "Room not active" });
      }

      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      socket.emit("compiling", { message: "Running code against public test cases..." });

      try {
        const fullProblem = await Problem.findById(room.problem._id);
        const publicCases = fullProblem.testCases.filter(tc => tc.isPublic);

        const evaluation = await evaluateCode(code, language, fullProblem, publicCases);
        
        socket.emit("runResult", {
          success: true,
          totalCases: evaluation.totalCases,
          passedCases: evaluation.passedCases,
          results: evaluation.results
        });
      } catch (err) {
        socket.emit("runResult", { success: false, message: err.message });
      }
    });

    // Submit final solution
    socket.on("submitCode", async (data) => {
      const { roomId, code, language } = data;
      const room = activeRooms.get(roomId);
      
      if (!room || room.status !== "active") {
        return socket.emit("submitResult", { success: false, message: "Match is not active" });
      }

      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      player.submissions++;
      socket.emit("compiling", { message: "Submitting solution to battle server..." });

      try {
        const fullProblem = await Problem.findById(room.problem._id);
        const allCases = fullProblem.testCases;

        const evaluation = await evaluateCode(code, language, fullProblem, allCases);

        player.passed = evaluation.passedCases;
        
        // Notify opponent of player's updated test case score
        io.to(roomId).emit("playerProgressUpdate", {
          userId: player.userId,
          passed: player.passed,
          total: evaluation.totalCases
        });

        // Determine if player has solved 100% of the test cases
        const solvedAll = evaluation.passedCases === evaluation.totalCases;

        socket.emit("submitResult", {
          success: true,
          totalCases: evaluation.totalCases,
          passedCases: evaluation.passedCases,
          results: evaluation.results,
          solvedAll
        });

        if (solvedAll) {
          // Player won by solving all test cases first!
          clearInterval(room.timerInterval);
          await finishMatch(room, player.userId);
        }
      } catch (err) {
        socket.emit("submitResult", { success: false, message: err.message });
      }
    });

    // Player quits/leaves room
    socket.on("leaveRoom", async (data) => {
      const { roomId } = data;
      const room = activeRooms.get(roomId);
      if (!room) return;

      if (room.status === "waiting") {
        activeRooms.delete(roomId);
        socket.leave(roomId);
        console.log(`Waiting room ${roomId} deleted by host leaving.`);
        return;
      }

      if (room.status !== "active") return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      // Abandon match, remaining player wins
      clearInterval(room.timerInterval);
      const opponent = room.players.find(p => p.userId !== player.userId);
      await finishMatch(room, opponent.userId, true); // Win due to forfeit
    });

    // Rematch System
    socket.on("requestRematch", (data) => {
      const { roomId } = data;
      const room = activeRooms.get(roomId);
      if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      player.wantsRematch = true;
      socket.to(roomId).emit("opponentRematchRequested");

      // Check if both players want rematch
      const bothWant = room.players.every(p => p.wantsRematch);
      if (bothWant) {
        // Trigger rematch! Setup new room.
        setupRematch(room);
      }
    });

    // Cleanup on disconnect
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Remove from matchmaking queue
      matchmakingQueue = matchmakingQueue.filter(item => item.socket.id !== socket.id);

      // Handle active rooms they might have been in
      for (const [roomId, room] of activeRooms.entries()) {
        // If host disconnects while waiting, clean up custom room
        if (room.status === "waiting" && room.players[0].socketId === socket.id) {
          activeRooms.delete(roomId);
          console.log(`Waiting room ${roomId} deleted due to host disconnect.`);
          continue;
        }

        if (room.status !== "active") continue;
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
          // Give player 20 seconds to reconnect, otherwise forfeit.
          setTimeout(async () => {
            const currentRoom = activeRooms.get(roomId);
            if (currentRoom && currentRoom.status === "active") {
              const stillMissing = !io.sockets.adapter.rooms.get(roomId)?.has(player.socketId);
              if (stillMissing) {
                clearInterval(currentRoom.timerInterval);
                const opponent = currentRoom.players.find(p => p.userId !== player.userId);
                await finishMatch(currentRoom, opponent.userId, true); // opponent wins by disconnect forfeit
              }
            }
          }, 20000);
        }
      }
    });
  });

  // End match due to 10m timeout
  async function endMatchDueToTimeout(roomId) {
    const room = activeRooms.get(roomId);
    if (!room) return;

    const [p1, p2] = room.players;
    let winnerId = null;

    if (p1.passed > p2.passed) {
      winnerId = p1.userId;
    } else if (p2.passed > p1.passed) {
      winnerId = p2.userId;
    } else {
      // Tie: whoever had fewer submissions wins. If same, draw.
      if (p1.submissions < p2.submissions && p1.passed > 0) {
        winnerId = p1.userId;
      } else if (p2.submissions < p1.submissions && p2.passed > 0) {
        winnerId = p2.userId;
      }
    }

    await finishMatch(room, winnerId, false);
  }

  // Setup Rematch
  async function setupRematch(oldRoom) {
    try {
      const problems = await Problem.find();
      const randomProblem = problems[Math.floor(Math.random() * problems.length)];
      const newRoomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create new room layout
      const newRoom = {
        roomId: newRoomId,
        mode: oldRoom.mode,
        problem: randomProblem,
        players: oldRoom.players.map(p => ({
          socketId: p.socketId,
          userId: p.userId,
          username: p.username,
          elo: p.elo, // Ideally load fresh ELO
          passed: 0,
          codeLength: 0,
          submissions: 0
        })),
        timeRemaining: 600,
        status: "active",
        timerInterval: null
      };

      activeRooms.set(newRoomId, newRoom);

      // Emit rematchStarted with new details
      io.to(oldRoom.roomId).emit("rematchStarted", {
        newRoomId,
        problemId: randomProblem._id
      });

      console.log(`Rematch started: ${newRoomId} from old room ${oldRoom.roomId}`);
    } catch (err) {
      console.error("Error setting up rematch", err);
    }
  }

  // Declare Match Completion & update database
  async function finishMatch(room, winnerId, isForfeit = false) {
    room.status = "completed";
    
    const [p1, p2] = room.players;
    const isDraw = winnerId === null;

    let p1EloDiff = 0;
    let p2EloDiff = 0;

    try {
      // Fetch users from database
      const u1 = await User.findById(p1.userId);
      const u2 = await User.findById(p2.userId);

      if (u1 && u2 && room.mode === "ranked") {
        let u1Score = 0.5;
        let u2Score = 0.5;

        if (!isDraw) {
          u1Score = winnerId === p1.userId ? 1 : 0;
          u2Score = winnerId === p2.userId ? 1 : 0;
        }

        p1EloDiff = calculateElo(u1.elo, u2.elo, u1Score);
        p2EloDiff = calculateElo(u2.elo, u1.elo, u2Score);

        // Update profiles in DB
        u1.elo = Math.max(100, u1.elo + p1EloDiff);
        u2.elo = Math.max(100, u2.elo + p2EloDiff);

        u1.totalMatches++;
        u2.totalMatches++;

        if (!isDraw) {
          if (winnerId === p1.userId) {
            u1.wins++;
            u2.losses++;
            u1.winStreak++;
            u1.maxWinStreak = Math.max(u1.maxWinStreak, u1.winStreak);
            u2.winStreak = 0;

            // Add problem to solved problems if not already present
            if (!u1.solvedProblems.includes(room.problem._id)) {
              u1.solvedProblems.push(room.problem._id);
            }
          } else {
            u2.wins++;
            u1.losses++;
            u2.winStreak++;
            u2.maxWinStreak = Math.max(u2.maxWinStreak, u2.winStreak);
            u1.winStreak = 0;

            if (!u2.solvedProblems.includes(room.problem._id)) {
              u2.solvedProblems.push(room.problem._id);
            }
          }
        } else {
          u1.winStreak = 0;
          u2.winStreak = 0;
        }

        await u1.save();
        await u2.save();
      }

      // Save match logs to Database
      const matchDoc = new Match({
        roomId: room.roomId,
        player1: p1.userId,
        player2: p2.userId,
        problem: room.problem._id,
        winner: winnerId,
        player1Score: p1EloDiff,
        player2Score: p2EloDiff,
        player1PassedCases: p1.passed,
        player2PassedCases: p2.passed,
        status: "completed",
        mode: room.mode,
        duration: 600 - room.timeRemaining
      });

      await matchDoc.save();

      // Emit matchOver to clients
      io.to(room.roomId).emit("matchOver", {
        winnerId,
        isForfeit,
        results: {
          [p1.userId]: {
            username: p1.username,
            passed: p1.passed,
            submissions: p1.submissions,
            eloChange: p1EloDiff,
            newElo: u1 ? u1.elo : p1.elo
          },
          [p2.userId]: {
            username: p2.username,
            passed: p2.passed,
            submissions: p2.submissions,
            eloChange: p2EloDiff,
            newElo: u2 ? u2.elo : p2.elo
          }
        }
      });

      console.log(`Match Ended: ${room.roomId}. Winner: ${winnerId || "Draw"}`);
    } catch (err) {
      console.error("Error finalizing match:", err);
    }
  }
};
