const express = require("express");
const router = express.Router();
const matchController = require("../controllers/matchController");
const authMiddleware = require("../middleware/auth");

router.get("/history", authMiddleware, matchController.getMatches);
router.get("/leaderboard", matchController.getLeaderboard);
router.get("/stats", matchController.getStats);

module.exports = router;
