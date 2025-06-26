// Game logic helpers for Touchdown Bingo

function seededRandom(seed: number): number {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function generateValidCategories(
  players: any[],
  categories: string[],
  seed: number
): string[] {
  const NFL_TEAMS = [
    "Arizona Cardinals", "Atlanta Falcons", "Baltimore Ravens", "Buffalo Bills", "Carolina Panthers",
    "Chicago Bears", "Cincinnati Bengals", "Cleveland Browns", "Dallas Cowboys", "Denver Broncos",
    "Detroit Lions", "Green Bay Packers", "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars",
    "Kansas City Chiefs", "Las Vegas Raiders", "Los Angeles Chargers", "Los Angeles Rams",
    "Miami Dolphins", "Minnesota Vikings", "New England Patriots", "New Orleans Saints",
    "New York Giants", "New York Jets", "Philadelphia Eagles", "Pittsburgh Steelers",
    "San Francisco 49ers", "Seattle Seahawks", "Tampa Bay Buccaneers", "Tennessee Titans",
    "Washington Commanders"
  ];

  const MISC_CATEGORIES = [
    "Super Bowl Winner", "MVP", "DPOY", "Hall of Famer",
    "Coached by Bill Bellichick", "Coached by Andy Reid",
    "Coached by Pete Carroll", "Coached by Sean Payton",
    "Heisman Trophy Winner"
  ];

  const nflPool = categories.filter(c => NFL_TEAMS.includes(c));
  const collegePool = categories.filter(c => !NFL_TEAMS.includes(c) && !MISC_CATEGORIES.includes(c));
  const miscPool = categories.filter(c => MISC_CATEGORIES.includes(c));

  const map = new Map<string, Set<string>>();
  for (const p of players) {
    for (const cat of p.categories) {
      if (!map.has(cat)) map.set(cat, new Set());
      map.get(cat)!.add(p.name);
    }
  }

  let attempt = 0;
  while (attempt < 1000) {
    const nfl7 = seededShuffle(nflPool, seed + 1).filter(cat => (map.get(cat)?.size ?? 0) >= 2).slice(0, 7);
    const college6 = seededShuffle(collegePool, seed + 2).filter(cat => (map.get(cat)?.size ?? 0) >= 2).slice(0, 6);
    const misc3 = seededShuffle(miscPool, seed + 3).filter(cat => (map.get(cat)?.size ?? 0) >= 2).slice(0, 3);

    const combined = [...nfl7, ...college6, ...misc3];
    const uniqueBoard = Array.from(new Set(combined));
    if (uniqueBoard.length !== 16) {
      attempt++;
      continue;
    }

    const board = seededShuffle(uniqueBoard, seed + 4);
    const fourPlus = board.filter(cat => (map.get(cat)?.size ?? 0) >= 4).length;

    if (fourPlus >= 4) return board;
    attempt++;
  }

  throw new Error("Could not build a valid 16-category board after 1000 tries");
}

function pickWinnablePlayers(
  players: any[],
  boardCategories: string[],
  seed: number,
  totalCount = 42,
  requiredMatchCount = 36
): any[] {
  const categoryToPlayers = new Map<string, Set<string>>();

  for (const player of players) {
    for (const cat of player.categories) {
      if (boardCategories.includes(cat)) {
        if (!categoryToPlayers.has(cat)) categoryToPlayers.set(cat, new Set());
        categoryToPlayers.get(cat)!.add(player.name);
      }
    }
  }

  const allCategoriesHaveTwo = boardCategories.every(
    cat => (categoryToPlayers.get(cat)?.size ?? 0) >= 2
  );
  const categoriesWithFourOrMore = boardCategories.filter(
    cat => (categoryToPlayers.get(cat)?.size ?? 0) >= 4
  ).length;
  if (!allCategoriesHaveTwo || categoriesWithFourOrMore < 4)
    throw new Error("Insufficient player coverage");

  const usedPlayers = new Set<string>();
  const selectedMatchingPlayers: string[] = [];

  for (const cat of seededShuffle(boardCategories, seed + 10)) {
    const eligible = Array.from(categoryToPlayers.get(cat)!);
    const unused = shuffle(eligible.filter(p => !usedPlayers.has(p)));
    const pickCount = selectedMatchingPlayers.length <= 32 ? 2 : 1;
    for (const p of unused.slice(0, pickCount)) {
      usedPlayers.add(p);
      selectedMatchingPlayers.push(p);
    }
  }

  const eligiblePool = players.filter(
    p => p.categories.some(cat => boardCategories.includes(cat)) && !usedPlayers.has(p.name)
  );
  for (const p of seededShuffle(eligiblePool, seed + 20)) {
    if (selectedMatchingPlayers.length >= requiredMatchCount) break;
    usedPlayers.add(p.name);
    selectedMatchingPlayers.push(p.name);
  }

  const nonMatchingPool = players.filter(
    p => !p.categories.some(cat => boardCategories.includes(cat)) && !usedPlayers.has(p.name)
  );
  const selectedNonMatchingPlayers = seededShuffle(nonMatchingPool, seed + 30).slice(
    0,
    totalCount - requiredMatchCount
  );

  const finalPlayerNames = [...selectedMatchingPlayers, ...selectedNonMatchingPlayers.map(p => p.name)];
  return seededShuffle(
    finalPlayerNames.map(name => players.find(p => p.name === name)!),
    seed + 40
  );
}

export { generateValidCategories, pickWinnablePlayers, seededShuffle };
