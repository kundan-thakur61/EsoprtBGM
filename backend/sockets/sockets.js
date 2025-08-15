// Example: when user joins tournament
io.to(userId).emit("notification", {
  message: `You joined the tournament: ${tournament.name}`
});
