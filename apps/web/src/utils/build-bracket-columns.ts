import type { Bracket, BracketSlot, Match, RegistrationSeat } from '@/types/bracket';

export interface BracketPairing {
  round: number;
  position: number;
  destinationSlotId: string;
  seatA: RegistrationSeat | null;
  seatB: RegistrationSeat | null;
  match: Match | null;
  isBye: boolean;
}

export interface BracketColumn {
  round: number;
  pairings: BracketPairing[];
}

export interface BracketChampion {
  slotId: string;
  registration: RegistrationSeat | null;
}

export interface BracketColumns {
  totalRounds: number;
  columns: BracketColumn[];
  champion: BracketChampion | null;
}

export function buildBracketColumns(bracket: Bracket): BracketColumns {
  const { slots, matches } = bracket;
  if (slots.length === 0) {
    return { totalRounds: 0, columns: [], champion: null };
  }

  const totalRounds = Math.max(...slots.map((slot) => slot.round));

  const slotByRoundPosition = new Map<string, BracketSlot>();
  for (const slot of slots) slotByRoundPosition.set(`${slot.round}-${slot.position}`, slot);

  const matchByDestinationSlotId = new Map<string, Match>();
  for (const match of matches) matchByDestinationSlotId.set(match.bracketSlotId, match);

  const columns: BracketColumn[] = [];
  for (let round = 1; round < totalRounds; round++) {
    const destRound = round + 1;
    const slotsInDestRound = slots.filter((slot) => slot.round === destRound).length;
    const pairings: BracketPairing[] = [];

    for (let position = 1; position <= slotsInDestRound; position++) {
      const destinationSlot = slotByRoundPosition.get(`${destRound}-${position}`);
      if (!destinationSlot) continue;

      const originA = slotByRoundPosition.get(`${round}-${2 * position - 1}`);
      const originB = slotByRoundPosition.get(`${round}-${2 * position}`);
      const match = matchByDestinationSlotId.get(destinationSlot.id) ?? null;
      const isBye = !match && destinationSlot.registrationId !== null;

      pairings.push({
        round,
        position,
        destinationSlotId: destinationSlot.id,
        seatA: match?.registrationA ?? originA?.registration ?? null,
        seatB: match?.registrationB ?? originB?.registration ?? null,
        match,
        isBye,
      });
    }

    columns.push({ round, pairings });
  }

  const championSlot = slotByRoundPosition.get(`${totalRounds}-1`) ?? null;
  const champion = championSlot
    ? { slotId: championSlot.id, registration: championSlot.registration }
    : null;

  return { totalRounds, columns, champion };
}
