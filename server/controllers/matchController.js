const Match = require("../models/Match");
const User = require("../models/User");

exports.getMatches = async (req, res) => {
  try {
    const userId = req.user.id;
    const matches = await Match.find({
      $or: [{ player1: userId }, { player2: userId }],
      status: "completed"
    })
      .sort({ createdAt: -1 })
      .populate("player1", "username elo")
      .populate("player2", "username elo")
      .populate("problem", "title difficulty")
      .populate("winner", "username");

    res.json(matches);
  } catch (error) {
    console.error("Get Matches Error:", error);
    res.status(500).json({ message: "Server error occurred while fetching matches." });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find()
      .select("username elo wins losses winStreak maxWinStreak")
      .sort({ elo: -1 })
      .limit(50);
    res.json(leaderboard);
  } catch (error) {
    console.error("Get Leaderboard Error:", error);
    res.status(500).json({ message: "Server error occurred while fetching leaderboard." });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMatches = await Match.countDocuments({ status: "completed" });
    
    // Aggregate for average rating
    const avgRatingResult = await User.aggregate([
      { $group: { _id: null, avgElo: { $avg: "$elo" } } }
    ]);
    const averageElo = avgRatingResult.length > 0 ? Math.round(avgRatingResult[0].avgElo) : 1000;

    res.json({
      totalUsers,
      totalMatches,
      averageElo,
      activeBattles: 0 // Will be injected/overwritten by active socket count in real-time
    });
  } catch (error) {
    console.error("Get Stats Error:", error);
    res.status(500).json({ message: "Server error occurred while fetching stats." });
  }
};
