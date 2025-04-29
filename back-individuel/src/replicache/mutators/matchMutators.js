import { Match } from "@/replicache/models/Match";

const matchMutators = {
  createMatch: async (tx, { idMatch, idMatchType, idRound, idPool, idPlayer1, idPlayer2, idPreviousMatch1, idPreviousMatch2, ipponsPlayer1, ipponsPlayer2, keikokusPlayer1, keikokusPlayer2, idWinner }) => {
    await tx.set(`match/${idMatch}`, new Match(
      idMatch,
      idMatchType,
      idRound,
      idPool,
      idPlayer1,
      idPlayer2,
      idPreviousMatch1,
      idPreviousMatch2,
      ipponsPlayer1 || 0,
      ipponsPlayer2 || 0,
      keikokusPlayer1 || 0,
      keikokusPlayer2 || 0,
      idWinner || null,
    ));
  },

  updateMatch: async (tx, { idMatch, ...updates }) => {
    const match = await tx.get(`match/${idMatch}`);
    if (!match) return;

    const updatedMatch = {
      ...match,
      ...updates,
      idWinner: updates.idWinner ?? match.idWinner,
    };

    await tx.set(`match/${idMatch}`, updatedMatch);
  },

  switchPlayers: async (tx, { idMatch }) => {
    const match = await tx.get(`match/${idMatch}`);
    if (!match) return;

    const updatedMatch = {
      ...match,
      idPlayer1: match.idPlayer2,
      idPlayer2: match.idPlayer1,
    };

    await tx.set(`match/${idMatch}`, updatedMatch);
  },

  deleteMatch: async (tx, { idMatch }) => {
    await tx.del(`match/${idMatch}`);
  },

  updateTimer: async (tx, { idMatch, isRunning, currentTime, additionalTime }) => {
    const match = await tx.get(`match/${idMatch}`);
    if (!match) return;

    const updatedMatch = {
      ...match,
      timer: {
        ...match.timer,
        isRunning: isRunning ?? match.timer.isRunning,
        currentTime: currentTime ?? match.timer.currentTime,
        additionalTime: additionalTime ?? match.timer.additionalTime,
      },
    };

    await tx.set(`match/${idMatch}`, updatedMatch);
  },
};
export default matchMutators;
