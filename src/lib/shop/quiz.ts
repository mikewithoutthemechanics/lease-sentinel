export type QuizOption = {
  id: string;
  label: string;
  detail: string;
  value: number;
};

export type QuizQuestion = {
  id: "light" | "water" | "vibe" | "experience";
  step: string;
  title: string;
  help: string;
  options: QuizOption[];
};

export const QUESTIONS: QuizQuestion[] = [
  {
    id: "light",
    step: "The room",
    title: "How much light does the spot actually get?",
    help: "Stand there at 10am. If you can read comfortably without a lamp, it is bright.",
    options: [
      { id: "low", label: "Low", detail: "A dim corner, no direct sun at all", value: 1.5 },
      { id: "bright", label: "Bright, indirect", detail: "Bright all day, no sun on the leaves", value: 3.5 },
      { id: "morning", label: "Direct morning sun", detail: "An east windowsill, a few hours", value: 4.5 },
      { id: "allday", label: "All-day sun", detail: "West or north facing, blazing", value: 5 },
    ],
  },
  {
    id: "water",
    step: "Your habits",
    title: "How often will you honestly water it?",
    help: "Be unkind to yourself here. It is the single biggest killer of houseplants.",
    options: [
      { id: "forget", label: "Whenever I remember", detail: "Every three weeks, if that", value: 1 },
      { id: "weekly", label: "Once a week", detail: "Sunday morning, with the coffee", value: 2.5 },
      { id: "often", label: "Twice a week", detail: "I enjoy it, maybe too much", value: 4 },
    ],
  },
  {
    id: "vibe",
    step: "The look",
    title: "What are you after?",
    help: "There is no wrong answer — only a wrong plant for the wrong room.",
    options: [
      { id: "statement", label: "A statement", detail: "Something that fills a dead corner", value: 0 },
      { id: "climber", label: "Something to climb", detail: "A totem, a pole, a wall", value: 0 },
      { id: "desk", label: "Desk-sized", detail: "Under 50 cm, sits on furniture", value: 0 },
      { id: "architectural", label: "Architectural", detail: "Big structural leaves, few of them", value: 0 },
    ],
  },
  {
    id: "experience",
    step: "Your history",
    title: "How many have you killed?",
    help: "We are not judging. We are calibrating.",
    options: [
      { id: "new", label: "This is my first", detail: "I would like something forgiving", value: 1.5 },
      { id: "some", label: "One or two", detail: "I know the basics", value: 3 },
      { id: "seasoned", label: "I have a system", detail: "Give me something with standards", value: 4.5 },
    ],
  },
];

export type PlantTrait = {
  slug: string;
  light: number;
  water: number;
  vibe: string;
  difficulty: number;
};

export const TRAITS: PlantTrait[] = [
  { slug: "monstera-albo", light: 3, water: 2, vibe: "climber", difficulty: 4 },
  { slug: "fiddle-leaf-fig", light: 5, water: 3, vibe: "statement", difficulty: 4 },
  { slug: "strelitzia-nicolai", light: 4, water: 3, vibe: "architectural", difficulty: 2 },
  { slug: "philodendron-pink-princess", light: 3, water: 2, vibe: "desk", difficulty: 3 },
  { slug: "zz-raven", light: 1, water: 1, vibe: "desk", difficulty: 1 },
];

export type QuizAnswer = { value: number; id: string };

export type Result = {
  slug: string;
  match: number;
  reasons: string[];
};

const MAX = 5 * 3 + 5 * 2 + 5 * 2 + 5 * 1.5;

export function score(answers: Record<string, QuizAnswer>): Result[] {
  const light = answers.light?.value ?? 3.5;
  const water = answers.water?.value ?? 2.5;
  const vibe = answers.vibe?.id ?? "";
  const exp = answers.experience?.value ?? 3;

  return TRAITS.map((t) => {
    const lightScore = Math.max(0, 5 - Math.abs(t.light - light));
    const waterScore = Math.max(0, 5 - Math.abs(t.water - water));
    const vibeScore = t.vibe === vibe ? 5 : 2;
    const expScore = Math.max(0, 5 - Math.abs(t.difficulty - exp));
    const total = lightScore * 3 + waterScore * 2 + vibeScore * 2 + expScore * 1.5;

    const reasons: string[] = [];
    if (lightScore >= 4) reasons.push("Thrives at the light level you described");
    else if (lightScore >= 3) reasons.push("Copes with your light, though it would take more");
    if (waterScore >= 4) reasons.push("Matches your watering rhythm exactly");
    if (t.vibe === vibe) reasons.push("Fits what you are picturing");
    if (expScore >= 4)
      reasons.push(
        t.difficulty <= 2 ? "Genuinely forgiving — a good first plant" : "Rewarding for someone with a system",
      );
    if (t.difficulty >= 4 && exp <= 2) reasons.push("Push yourself — it is worth the attention");

    return {
      slug: t.slug,
      match: Math.round((total / MAX) * 100),
      reasons: reasons.slice(0, 3),
    };
  }).sort((a, b) => b.match - a.match);
}
