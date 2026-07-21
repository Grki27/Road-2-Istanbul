export type DailyRecap = {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  startLocation: string;
  endLocation: string;
  sleepingLocation?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  distanceKm: number;
  totalDistanceKm: number;
  shortText: string;
  fatigueRating: 1 | 2 | 3 | 4 | 5;
  marinFatigueRating?: 1 | 2 | 3 | 4 | 5;
  markoFatigueRating?: 1 | 2 | 3 | 4 | 5;
  highlightOfTheDay: string;
  problemOfTheDay: string;
  isRestDay: boolean;
  specialMilestoneType?: string;
  coverImage?: string;
  images: string[];
};

export type CurrentLocation = {
  id: string;
  latitude: number;
  longitude: number;
  note?: string;
  createdAt: string;
};

export type MapEvent = {
  id: string;
  emoji: string;
  title: string;
  description?: string;
  locationName?: string;
  country?: string;
  latitude: number;
  longitude: number;
  images: string[];
  createdAt: string;
};

export type TripSettings = {
  plannedTotalKm: number;
  currentCountry?: string;
  countriesVisited: number;
  borderCrossings: number;
  donationGoal: number;
  donationRaised: number;
  donationUrl?: string;
};

export type TripStats = {
  totalDistanceKm: number;
  kilometersToIstanbul: number;
  averageKmPerDay: number;
  longestDayKm: number;
  daysOnRoad: number;
  restDays: number;
  currentCountry: string;
  countriesVisited: number;
  borderCrossings: number;
};

export type StickyNote = {
  id: string;
  authorName: string;
  message: string;
  noteColor: string;
  xPosition: number;
  yPosition: number;
  rotation: number;
};
