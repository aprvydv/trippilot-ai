export const destinations = ['Jaipur', 'Goa', 'Manali'] as const;
export type Destination = typeof destinations[number];
export const travelStyles = ['balanced', 'culture', 'nature'] as const;
export type TravelStyle = typeof travelStyles[number];

export interface TripInput {
  destination: Destination;
  days: number;
  travellers: number;
  budget: number;
  style: TravelStyle;
}

export interface ItineraryDay {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
}

export interface Trip extends TripInput {
  estimate: number;
  nickname: string;
  withinBudget: boolean;
  itinerary: ItineraryDay[];
}

export interface DestinationGuide {
  nickname: string;
  daily: number;
  days: [string, string, string, string][];
}
