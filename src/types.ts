export type DailyRecap = {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  startLocation: string;
  endLocation: string;
  country: string;
  latitude?: number;
  longitude?: number;
  distanceKm: number;
  totalDistanceKm: number;
  shortText: string;
  fatigueRating: 1 | 2 | 3 | 4 | 5;
  highlightOfTheDay: string;
  problemOfTheDay: string;
  coverImage?: string;
  images: string[];
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
