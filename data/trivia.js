const CONFEDERATION_OPTIONS = ["AFC", "CAF", "Concacaf", "CONMEBOL", "OFC", "UEFA"];
const QUALIFICATION_OPTIONS = ["Host Nation", "Direct Qualifier", "Play-Off Winner", "Defending Champion"];

function hashSeed(input) {
  return [...input].reduce((total, character, index) => total + character.charCodeAt(0) * (index + 7), 0);
}

function rotateList(items, seed) {
  if (items.length <= 1) {
    return [...items];
  }

  const offset = seed % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function buildOptionSet(correct, pool, seed, size = 4) {
  const uniquePool = [...new Set(pool.filter((item) => item !== correct))];
  const distractors = rotateList(uniquePool, seed).slice(0, Math.max(0, size - 1));
  return rotateList([correct, ...distractors], seed + 3);
}

function findPeers(team, teams) {
  return teams.filter(
    (candidate) =>
      candidate.id !== team.id &&
      candidate.qualificationStatus !== "playoff" &&
      candidate.confederation === team.confederation
  );
}

export function getQuestionsForTeam(team, teams) {
  if (!team || team.qualificationStatus === "playoff") {
    return [];
  }

  const seed = hashSeed(team.id);
  const peers = findPeers(team, teams);
  const allConfirmed = teams.filter((candidate) => candidate.qualificationStatus !== "playoff");

  const codeOptions = buildOptionSet(
    team.code,
    allConfirmed.map((candidate) => candidate.code),
    seed + 11
  );

  const factOptions = buildOptionSet(
    team.triviaFact,
    allConfirmed.map((candidate) => candidate.triviaFact),
    seed + 19
  );

  const regionOptions = buildOptionSet(
    team.regionLabel,
    allConfirmed.map((candidate) => candidate.regionLabel),
    seed + 23
  );

  const confederationQuestion = {
    id: `${team.id}-confederation`,
    prompt: `Which confederation does ${team.displayName} represent?`,
    options: buildOptionSet(team.confederation, CONFEDERATION_OPTIONS, seed + 5),
    correctAnswer: team.confederation,
    explanation: `${team.displayName} qualifies through ${team.confederation}.`,
    category: "Confederation"
  };

  const codeQuestion = {
    id: `${team.id}-code`,
    prompt: `What is the FIFA team code for ${team.displayName}?`,
    options: codeOptions,
    correctAnswer: team.code,
    explanation: `${team.displayName} uses the code ${team.code}.`,
    category: "Team Code"
  };

  const routeQuestion = {
    id: `${team.id}-route`,
    prompt:
      team.qualificationStatus === "host"
        ? `How did ${team.displayName} reach the tournament field?`
        : `What best describes ${team.displayName}'s path into the tournament?`,
    options: QUALIFICATION_OPTIONS,
    correctAnswer: team.qualificationStatus === "host" ? "Host Nation" : "Direct Qualifier",
    explanation:
      team.qualificationStatus === "host"
        ? `${team.displayName} is one of the 2026 co-hosts.`
        : `${team.displayName} earned a direct qualification place through ${team.confederation}.`,
    category: "Qualification"
  };

  const factQuestion = {
    id: `${team.id}-fact`,
    prompt: `Which statement correctly matches ${team.displayName}?`,
    options: factOptions,
    correctAnswer: team.triviaFact,
    explanation: team.quickFact,
    category: "History"
  };

  const peerQuestion =
    peers.length > 0
      ? {
          id: `${team.id}-peer`,
          prompt: `Which team shares ${team.displayName}'s confederation?`,
          options: buildOptionSet(
            peers[seed % peers.length].displayName,
            allConfirmed.map((candidate) => candidate.displayName),
            seed + 31
          ),
          correctAnswer: peers[seed % peers.length].displayName,
          explanation: `${team.displayName} and ${peers[seed % peers.length].displayName} both compete in ${team.confederation}.`,
          category: "Rivals"
        }
      : {
          id: `${team.id}-region`,
          prompt: `Which region label matches ${team.displayName} in this app?`,
          options: regionOptions,
          correctAnswer: team.regionLabel,
          explanation: `${team.displayName} is grouped under ${team.regionLabel}.`,
          category: "Region"
        };

  return [confederationQuestion, codeQuestion, routeQuestion, factQuestion, peerQuestion];
}