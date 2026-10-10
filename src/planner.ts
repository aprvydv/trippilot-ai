import { destinations, travelStyles, type DestinationGuide, type TripInput, type Trip } from './types';

export const guides: Record<TripInput['destination'], DestinationGuide> = {
  Jaipur: { nickname: 'the Pink City', daily: 2200, days: [
    ['Fort walls & old streets', 'Amber Fort', 'City Palace & Jantar Mantar', 'Old-city food walk'],
    ['The heart of Jaipur', 'Hawa Mahal exterior & market walk', 'Albert Hall Museum', 'Local Rajasthani dinner'],
    ['A slower side of the city', 'Jal Mahal viewpoint', 'Craft shopping', 'Nahargarh sunset viewpoint'],
  ] },
  Goa: { nickname: 'the coast', daily: 2800, days: [
    ['Salt air & sunshine', 'Candolim beach walk', 'Fort Aguada', 'Dinner near the coast'],
    ['History between the palms', 'Old Goa churches', 'Fontainhas walk', 'Panjim waterfront'],
    ['Take the scenic route', 'A quieter beach morning', 'Local market & café', 'Sunset by the sea'],
  ] },
  Manali: { nickname: 'the mountains', daily: 2500, days: [
    ['Meet the mountains', 'Old Manali walk', 'Hadimba Temple', 'Local café dinner'],
    ['A day outdoors', 'Solang Valley (weather permitting)', 'Riverside break', 'Return to town'],
    ['Slow down in the hills', 'Vashisht village', 'Local market', 'Quiet mountain evening'],
  ] },
  Rishikesh: { nickname: 'the Himalayan foothills', daily: 2200, days: [
    ['Riverbanks & old temples', 'Triveni Ghat riverside walk', 'Bharat Mandir', 'Local vegetarian dinner'],
    ['Art & ashrams', 'Beatles Ashram', 'Gita Bhawan', 'Parmarth Niketan riverside walk'],
    ['A quieter day by the Ganges', 'Tapovan café breakfast', 'Riverside walk on a marked local route', 'Rishikesh market stroll'],
  ] },
  Udaipur: { nickname: 'the City of Lakes', daily: 2600, days: [
    ['Palaces & old streets', 'City Palace Museum', 'Jagdish Temple', 'Gangaur Ghat sunset walk'],
    ['Gardens & lake views', 'Saheliyon Ki Bari', 'Fateh Sagar promenade', 'Local Mewari dinner'],
    ['Folk art & the lakeside', 'Bagore Ki Haveli Museum', 'Bharatiya Lok Kala Mandal', 'Lake Pichola lakeside walk'],
  ] },
  Pondicherry: { nickname: 'the French Quarter coast', daily: 2500, days: [
    ['Sea air & heritage streets', 'Promenade Beach walk', 'French Quarter heritage walk', 'Local Tamil dinner'],
    ['Museums & market life', 'Puducherry Museum', 'Bharathi Park', 'Goubert Market stroll'],
    ['Gardens & a slower afternoon', 'Puducherry Botanical Garden', 'Manakula Vinayagar Temple', 'French Quarter café meal'],
  ] },
};

// Validate at runtime as well as compile time: local storage and future API data are untrusted.
export function parseTripInput(value: unknown): TripInput {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid trip data.');
  const v = value as Record<string, unknown>;
  if (!destinations.includes(v.destination as TripInput['destination']) ||
      !travelStyles.includes(v.style as TripInput['style']) ||
      typeof v.days !== 'number' || !Number.isInteger(v.days) || v.days < 1 || v.days > 7 ||
      typeof v.travellers !== 'number' || !Number.isInteger(v.travellers) || v.travellers < 1 || v.travellers > 10 ||
      typeof v.budget !== 'number' || !Number.isFinite(v.budget) || v.budget < 1000 || v.budget > 1000000) {
    throw new Error('Enter a valid destination, 1–7 days, 1–10 travellers, and a budget between ₹1,000 and ₹10,00,000.');
  }
  return { destination: v.destination as TripInput['destination'], style: v.style as TripInput['style'], days: v.days, travellers: v.travellers, budget: v.budget };
}

export function plan(value: unknown): Trip {
  const input = parseTripInput(value);
  const guide = guides[input.destination];
  const estimate = guide.daily * input.days * input.travellers;
  return { ...input, estimate, nickname: guide.nickname, withinBudget: estimate <= input.budget,
    itinerary: Array.from({ length: input.days }, (_, i) => {
      const base = guide.days[i % guide.days.length];
      return { day: i + 1, title: i >= 3 ? 'Revisit favourites & explore at your pace' : base[0],
        morning: input.style === 'slow' ? 'A slow breakfast and free morning' : input.style === 'food' ? 'Local breakfast and tea' : input.style === 'nature' ? 'A relaxed scenic walk; confirm a safe local route' : base[1],
        afternoon: input.style === 'slow' ? 'Unhurried café break and time to explore' : input.style === 'food' ? 'Local market and regional lunch' : input.style === 'culture' ? 'Explore local heritage and crafts' : base[2], evening: input.style === 'food' ? base[3].toLowerCase().match(/food|dinner|café/) ? base[3] : 'Regional dinner; ask locally about dietary requirements' : input.style === 'slow' ? 'An easy evening close to your stay' : base[3] };
    }),
  };
}

export const defaultInput: TripInput = { destination: 'Jaipur', days: 3, travellers: 2, budget: 18000, style: 'balanced' };
export const rupees = (amount: number): string => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const moods = [
  { value: 'balanced', label: 'Balanced' }, { value: 'slow', label: 'Slow weekend' },
  { value: 'food', label: 'Food trail' }, { value: 'nature', label: 'Outdoors' },
  { value: 'culture', label: 'Culture' },
] as const;
export const slots = ['morning', 'afternoon', 'evening'] as const;
export function activityOptions(destination: TripInput['destination']): string[] {
  return [...new Set([...guides[destination].days.flatMap(day => day.slice(1)),
    ...travelStyles.flatMap(style => plan({ ...defaultInput, destination, style }).itinerary.flatMap(day => slots.map(slot => day[slot]))),
  ])];
}
// Only catalog-backed choices are accepted. Costs and day numbers are always recomputed.
export function applySchedule(input: TripInput, value: unknown): Trip {
  const trip = plan(input);
  const allowed = new Set(activityOptions(trip.destination));
  if (!Array.isArray(value) || value.length !== trip.days || value.some(day => !Array.isArray(day) || day.length !== 3 || day.some(activity => typeof activity !== 'string' || !allowed.has(activity)))) {
    throw new Error('Choose three curated activities for each trip day.');
  }
  return { ...trip, itinerary: trip.itinerary.map((day, i) => ({ ...day, morning: value[i][0], afternoon: value[i][1], evening: value[i][2] })) };
}
