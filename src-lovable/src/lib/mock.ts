// Mock data compartilhado para o AET Hub (sem backend).

export type TournamentStatus = "open" | "live" | "closed";

export type Tournament = {
  id: string;
  name: string;
  game: string;
  gameShort: string;
  cover: string;
  status: TournamentStatus;
  date: string;
  pot: string;
  slots: number;
  registered: number;
  format: string;
  location: string;
};

export type Match = {
  id: string;
  round: string;
  playerA: { tag: string; score: number; you?: boolean };
  playerB: { tag: string; score: number; you?: boolean };
  status: "scheduled" | "live" | "done";
  time?: string;
};

export type ShopItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
};

export const currentUser = {
  tag: "GAUCHO_SLAYER",
  name: "Lucas Almeida",
  level: 42,
  xp: 1250,
  xpMax: 2000,
  points: 8450,
  city: "Alegrete/RS",
  role: "player" as "player" | "admin",
};

export const tournaments: Tournament[] = [
  {
    id: "pampa-strike-2026",
    name: "Pampa Strike 2026",
    game: "Street Fighter 6",
    gameShort: "SF6",
    cover: "/covers/sf6.jpg",
    status: "open",
    date: "24 NOV — 20:00",
    pot: "R$ 2.500",
    slots: 64,
    registered: 47,
    format: "Double Elimination",
    location: "AET LAN — Alegrete/RS",
  },
  {
    id: "gaucho-cup-valorant",
    name: "Gaúcho Cup Valorant",
    game: "Valorant",
    gameShort: "VAL",
    cover: "/covers/val.jpg",
    status: "live",
    date: "HOJE — 19:00",
    pot: "R$ 1.800",
    slots: 32,
    registered: 32,
    format: "Single Elimination",
    location: "Online",
  },
  {
    id: "rocket-arena-2",
    name: "Rocket Arena II",
    game: "Rocket League",
    gameShort: "RL",
    cover: "/covers/rl.jpg",
    status: "open",
    date: "07 DEZ — 15:00",
    pot: "R$ 800",
    slots: 16,
    registered: 9,
    format: "Round Robin",
    location: "AET LAN — Alegrete/RS",
  },
  {
    id: "tekken-fronteira",
    name: "Tekken Fronteira Open",
    game: "Tekken 8",
    gameShort: "TK8",
    cover: "/covers/tk8.jpg",
    status: "closed",
    date: "12 OUT — Encerrado",
    pot: "R$ 1.200",
    slots: 48,
    registered: 48,
    format: "Double Elimination",
    location: "AET LAN — Alegrete/RS",
  },
  {
    id: "csgo-legado",
    name: "CS Legado Cup",
    game: "CS2",
    gameShort: "CS2",
    cover: "/covers/cs2.jpg",
    status: "open",
    date: "21 DEZ — 14:00",
    pot: "R$ 3.000",
    slots: 16,
    registered: 6,
    format: "Best of 3",
    location: "AET LAN — Alegrete/RS",
  },
];

export function getTournament(id: string) {
  return tournaments.find((t) => t.id === id) ?? tournaments[0];
}

export const bracket: Record<string, Match[]> = {
  winners: [
    { id: "w1", round: "WR2", playerA: { tag: "GAUCHO_SLAYER", score: 2, you: true }, playerB: { tag: "REI_DA_LAN_99", score: 1 }, status: "live", time: "20:15" },
    { id: "w2", round: "WR2", playerA: { tag: "SANHACO", score: 2 }, playerB: { tag: "PATRAO_XY", score: 0 }, status: "done" },
    { id: "w3", round: "WR2", playerA: { tag: "MAKO", score: 0 }, playerB: { tag: "BAGUAL_ZK", score: 0 }, status: "scheduled", time: "20:45" },
    { id: "w4", round: "WR2", playerA: { tag: "FRONTEIRA", score: 0 }, playerB: { tag: "TAURA_09", score: 0 }, status: "scheduled", time: "21:00" },
  ],
  losers: [
    { id: "l1", round: "LR1", playerA: { tag: "CATIVEIRO", score: 1 }, playerB: { tag: "NEBLINA", score: 2 }, status: "done" },
    { id: "l2", round: "LR1", playerA: { tag: "DELTA_RS", score: 2 }, playerB: { tag: "GARIBALDI", score: 0 }, status: "done" },
  ],
  grand: [
    { id: "g1", round: "GF", playerA: { tag: "TBD", score: 0 }, playerB: { tag: "TBD", score: 0 }, status: "scheduled", time: "22:30" },
  ],
};

export const participants = [
  { tag: "GAUCHO_SLAYER", checkin: true, seed: 3 },
  { tag: "REI_DA_LAN_99", checkin: true, seed: 1 },
  { tag: "SANHACO", checkin: true, seed: 2 },
  { tag: "PATRAO_XY", checkin: false, seed: 8 },
  { tag: "MAKO", checkin: true, seed: 4 },
  { tag: "BAGUAL_ZK", checkin: false, seed: 6 },
  { tag: "FRONTEIRA", checkin: true, seed: 5 },
  { tag: "TAURA_09", checkin: true, seed: 7 },
];

export const ranking = [
  { pos: 1, tag: "REI_DA_LAN_99", pts: 12480, city: "Uruguaiana", trend: "+2" },
  { pos: 2, tag: "SANHACO", pts: 11220, city: "Alegrete", trend: "-1" },
  { pos: 3, tag: "NEBLINA", pts: 10870, city: "Rosário", trend: "+1" },
  { pos: 4, tag: "MAKO", pts: 9540, city: "Alegrete", trend: "0" },
  { pos: 5, tag: "GAUCHO_SLAYER", pts: 8450, city: "Alegrete", trend: "+3", you: true },
  { pos: 6, tag: "PATRAO_XY", pts: 8210, city: "São Gabriel", trend: "-2" },
  { pos: 7, tag: "DELTA_RS", pts: 7980, city: "Alegrete", trend: "+1" },
  { pos: 8, tag: "BAGUAL_ZK", pts: 7440, city: "Quaraí", trend: "-1" },
  { pos: 9, tag: "FRONTEIRA", pts: 7100, city: "Alegrete", trend: "0" },
  { pos: 10, tag: "TAURA_09", pts: 6890, city: "Livramento", trend: "+4" },
];

export const shop: ShopItem[] = [
  { id: "camiseta-aet", name: "Camiseta AET Oficial", category: "Vestuário", price: 3500, stock: 12 },
  { id: "mousepad-pampa", name: "Mousepad Pampa XL", category: "Periféricos", price: 4200, stock: 5 },
  { id: "voucher-lan-4h", name: "Voucher LAN — 4h", category: "Experiências", price: 1500, stock: 999 },
  { id: "chaveiro-metal", name: "Chaveiro Metal AET", category: "Colecionáveis", price: 800, stock: 40 },
  { id: "inscricao-free", name: "Inscrição Grátis Torneio", category: "Torneios", price: 5000, stock: 20 },
  { id: "hoodie-fronteira", name: "Hoodie Fronteira", category: "Vestuário", price: 7800, stock: 3 },
  { id: "skin-tag-neon", name: "Skin Tag Neon (perfil)", category: "Digital", price: 1200, stock: 999 },
  { id: "livepass", name: "LivePass Anual", category: "Assinatura", price: 6500, stock: 999 },
];

export function getShopItem(id: string) {
  return shop.find((s) => s.id === id) ?? shop[0];
}

export const feed = [
  { id: "f1", author: "aet_staff", time: "2min", body: "Sorteio da chave do Pampa Strike acontece em 30 min. Fique ligado!", pinned: true },
  { id: "f2", author: "dark_knight_pampa", time: "12min", body: "Procurando dupla pro Rocket Arena II. Chama no privado!" },
  { id: "f3", author: "rato_de_lan", time: "40min", body: "Alguém confirma se o lobby de SF6 tá liberado?" },
  { id: "f4", author: "sanhaco", time: "1h", body: "Bora treinar hoje 21h. Sala AET-04." },
  { id: "f5", author: "aet_staff", time: "3h", body: "Novas recompensas disponíveis na loja de pontos." },
];

export const communities = [
  { id: "sf6", name: "Fighting Games BR", members: 342 },
  { id: "val", name: "Valorant Fronteira", members: 218 },
  { id: "rl", name: "Rocket Alegrete", members: 96 },
  { id: "cs2", name: "CS Legado RS", members: 174 },
];

export const chats = [
  { id: "c1", name: "REI_DA_LAN_99", last: "bora rush b?", unread: 2, kind: "dm" as const },
  { id: "c2", name: "Time Pampa Strike", last: "MAKO: chegando 19h", unread: 0, kind: "team" as const },
  { id: "c3", name: "Sala — Gaúcho Cup", last: "aet_staff: chaves atualizadas", unread: 5, kind: "room" as const },
  { id: "c4", name: "SANHACO", last: "bom jogo!", unread: 0, kind: "dm" as const },
];

export const chatMessages = [
  { id: "m1", from: "REI_DA_LAN_99", body: "e aí, treinou hoje?", time: "20:01", mine: false },
  { id: "m2", from: "you", body: "treinei sim, tô afiado", time: "20:02", mine: true },
  { id: "m3", from: "REI_DA_LAN_99", body: "bora rush b?", time: "20:03", mine: false },
  { id: "m4", from: "you", body: "combinado. às 21h te chamo", time: "20:04", mine: true },
];

export const history = [
  { id: "h1", tournament: "Tekken Fronteira Open", place: "5º-8º", date: "12 OUT", xp: 120, pts: 400 },
  { id: "h2", tournament: "Rocket Arena I", place: "3º", date: "22 SET", xp: 220, pts: 900 },
  { id: "h3", tournament: "SF6 Regional", place: "9º-16º", date: "05 SET", xp: 60, pts: 200 },
  { id: "h4", tournament: "Gaúcho Cup Open", place: "2º", date: "18 AGO", xp: 380, pts: 1400 },
];

export const achievements = [
  { id: "a1", name: "Primeiro Strike", desc: "Primeira vitória oficial AET", rare: false },
  { id: "a2", name: "Maratona LAN", desc: "Jogou 8h seguidas em evento", rare: false },
  { id: "a3", name: "Finalista Regional x3", desc: "Chegou à final 3 vezes", rare: true },
  { id: "a4", name: "Duelista de Fronteira", desc: "Venceu 10 partidas em fighting games", rare: true },
  { id: "a5", name: "Voz da Comunidade", desc: "50 posts no feed", rare: false },
];

export const adminKpis = [
  { label: "Torneios ativos", value: "6", delta: "+2" },
  { label: "Inscritos mês", value: "312", delta: "+18%" },
  { label: "Checkins hoje", value: "47", delta: "89%" },
  { label: "Receita simulada", value: "R$ 8.4k", delta: "+12%" },
];

export const cepMock: Record<string, { city: string; uf: string; street: string }> = {
  "97542000": { city: "Alegrete", uf: "RS", street: "Rua dos Andradas" },
  "97500000": { city: "Uruguaiana", uf: "RS", street: "Av. Presidente Vargas" },
};