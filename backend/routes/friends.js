const express = require("express");
const router = express.Router();
const { verificarToken } = require("../middlewares/auth.middleware");
const {
  getFriends, getPendingRequests, sendRequest,
  acceptRequest, rejectRequest, removeFriend,
  searchUsers, getFriendsLeaderboard, getPublicProfile,
} = require("../controllers/friends");

router.use(verificarToken);

router.get("/",                        getFriends);
router.get("/requests",                getPendingRequests);
router.get("/search",                  searchUsers);
router.get("/leaderboard",             getFriendsLeaderboard);
router.get("/profile/:username",       getPublicProfile);
router.post("/request",                sendRequest);
router.put("/request/:id/accept",      acceptRequest);
router.put("/request/:id/reject",      rejectRequest);
router.delete("/:userId",              removeFriend);

module.exports = router;