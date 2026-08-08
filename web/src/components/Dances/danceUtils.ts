type DanceLike = {
  dance_type?: { name: string } | null;
  formation?: { name: string } | null;
  progression?: { name: string } | null;
};

type ChoreographedDanceLike = {
  dances_choreographers: { choreographer: { name: string } }[];
};

export const makeChoreographerNames = (dance: ChoreographedDanceLike) =>
  dance.dances_choreographers.map(dc => dc.choreographer.name).join(', ');

export const makeFiguresLabel = (dance: DanceLike) => [
  dance.dance_type?.name?.toLowerCase() !== 'contra' ? dance.dance_type?.name : null,
  dance.formation?.name
    ?.replace('Duple Minor - Improper', 'Improper')
    .replace('Duple Minor - Becket', 'Becket')
    .replace('Duple Minor - Becket CCW', 'Becket CCW'),
  dance.progression?.name && dance.progression.name.toLowerCase() !== 'single'
    ? `${dance.progression.name} progression`
    : null,
].filter(Boolean).join(' · ');
