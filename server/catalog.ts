import { activityOptions } from '../src/planner';
import type { Destination } from '../src/types';

export type ActivityTag = 'balanced' | 'culture' | 'nature';
export interface Activity {
  id: string;
  name: string;
  tags: ActivityTag[];
  estimatedCostInr: number;
}
type ActivityDetails = [tags: ActivityTag[], estimatedCostInr: number];
// Illustrative per-person activity/meal allowances, not verified tariffs. Excludes
// transport, lodging, shopping and optional guides. These do not alter trip totals.
export const destinationActivities: Record<Destination, Record<string, ActivityDetails>> = {
  Jaipur: {
    'Amber Fort': [['balanced', 'culture'], 200],
    'City Palace & Jantar Mantar': [['culture'], 700],
    'Old-city food walk': [['balanced', 'culture'], 400],
    'Hawa Mahal exterior & market walk': [['culture'], 0],
    'Albert Hall Museum': [['culture'], 100],
    'Local Rajasthani dinner': [['balanced', 'culture'], 450],
    'Jal Mahal viewpoint': [['nature'], 0],
    'Craft shopping': [['culture'], 0],
    'Nahargarh sunset viewpoint': [['balanced', 'nature'], 100],
  },
  Goa: {
    'Candolim beach walk': [['balanced', 'nature'], 0],
    'Fort Aguada': [['culture'], 50],
    'Dinner near the coast': [['balanced'], 600],
    'Old Goa churches': [['culture'], 0],
    'Fontainhas walk': [['culture'], 0],
    'Panjim waterfront': [['nature'], 0],
    'A quieter beach morning': [['nature'], 0],
    'Local market & café': [['balanced', 'culture'], 350],
    'Sunset by the sea': [['nature'], 0],
  },
  Manali: {
    'Old Manali walk': [['balanced', 'culture'], 0],
    'Hadimba Temple': [['culture'], 0],
    'Local café dinner': [['balanced'], 450],
    'Solang Valley (weather permitting)': [['nature'], 0],
    'Riverside break': [['nature'], 0],
    'Return to town': [['balanced'], 0],
    'Vashisht village': [['culture'], 0],
    'Local market': [['balanced', 'culture'], 0],
    'Quiet mountain evening': [['nature'], 0],
  },
  Rishikesh: {
    'Triveni Ghat riverside walk': [['balanced', 'nature'], 0],
    'Bharat Mandir': [['culture'], 0],
    'Local vegetarian dinner': [['balanced', 'culture'], 300],
    'Beatles Ashram': [['culture', 'nature'], 200],
    'Gita Bhawan': [['culture'], 0],
    'Parmarth Niketan riverside walk': [['culture', 'nature'], 0],
    'Tapovan café breakfast': [['balanced'], 350],
    'Riverside walk on a marked local route': [['nature'], 0],
    'Rishikesh market stroll': [['balanced', 'culture'], 0],
  },
  Udaipur: {
    'City Palace Museum': [['balanced', 'culture'], 450],
    'Jagdish Temple': [['culture'], 0],
    'Gangaur Ghat sunset walk': [['culture', 'nature'], 0],
    'Saheliyon Ki Bari': [['culture', 'nature'], 50],
    'Fateh Sagar promenade': [['nature'], 0],
    'Local Mewari dinner': [['balanced', 'culture'], 450],
    'Bagore Ki Haveli Museum': [['culture'], 100],
    'Bharatiya Lok Kala Mandal': [['culture'], 100],
    'Lake Pichola lakeside walk': [['balanced', 'nature'], 0],
  },
  Pondicherry: {
    'Promenade Beach walk': [['balanced', 'nature'], 0],
    'French Quarter heritage walk': [['culture'], 0],
    'Local Tamil dinner': [['balanced', 'culture'], 300],
    'Puducherry Museum': [['culture'], 50],
    'Bharathi Park': [['nature'], 0],
    'Goubert Market stroll': [['balanced', 'culture'], 0],
    'Puducherry Botanical Garden': [['nature'], 50],
    'Manakula Vinayagar Temple': [['culture'], 0],
    'French Quarter café meal': [['balanced', 'culture'], 500],
  },
};
const sharedActivities: Record<string, ActivityDetails> = {
  'A slow breakfast and free morning': [['balanced'], 250],
  'Unhurried café break and time to explore': [['balanced'], 300],
  'An easy evening close to your stay': [['balanced'], 0],
  'Local breakfast and tea': [['balanced', 'culture'], 150],
  'Local market and regional lunch': [['balanced', 'culture'], 300],
  'Regional dinner; ask locally about dietary requirements': [['balanced', 'culture'], 400],
  'A relaxed scenic walk; confirm a safe local route': [['nature'], 0],
  'Explore local heritage and crafts': [['culture'], 0],
};
// This versioned, curated catalog grounds generated schedules. It is not live availability data.
export const catalogVersion = '2026-10-10-v3';
export function activities(destination: Destination): Activity[] {
  return activityOptions(destination).map((name, index) => {
    const [tags, estimatedCostInr] = destinationActivities[destination][name] ?? sharedActivities[name];
    return { id: `${destination.toLowerCase()}-${index + 1}`, name, tags: [...tags], estimatedCostInr };
  });
}
