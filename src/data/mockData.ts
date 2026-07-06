import type { DailyRecap, StickyNote } from "@/types";

export const dailyRecaps: DailyRecap[] = [];

export const previewRecaps: DailyRecap[] = [
  {
    id: "preview-1",
    dayNumber: 1,
    date: "2026-08-25",
    title: "Start iz Dubrovnika",
    startLocation: "Dubrovnik",
    endLocation: "Crna Gora",
    country: "Hrvatska / Crna Gora",
    latitude: 42.6507,
    longitude: 18.0944,
    distanceKm: 82,
    totalDistanceKm: 82,
    shortText:
      "Prvi dan, pune torbe i onaj dobar nemir prije ceste. Ovo je samo primjer kako će recap izgledati kad put krene.",
    fatigueRating: 4,
    highlightOfTheDay: "Spust prema moru i prvi osjećaj da je avantura stvarno krenula.",
    problemOfTheDay: "Previše stvari u torbama, premalo mjesta za burek.",
    coverImage: "/assets/journey-support-1.jpg",
    images: ["/assets/journey-support-1.jpg", "/assets/journey-support-2.jpg"]
  }
];

export const wallNotes: StickyNote[] = [
  {
    id: "note-1",
    authorName: "Ana",
    message: "Sretno ekipa, čuvajte noge i šaljite puno fotki!",
    noteColor: "#ffe08a",
    xPosition: 12,
    yPosition: 18,
    rotation: -4
  },
  {
    id: "note-2",
    authorName: "FER klupa",
    message: "Ako preživite Albaniju na biciklu, rokovi su lagani.",
    noteColor: "#c8f3d4",
    xPosition: 52,
    yPosition: 28,
    rotation: 5
  },
  {
    id: "note-3",
    authorName: "Netko s ceste",
    message: "Još samo 20 km, navodno.",
    noteColor: "#ffd0df",
    xPosition: 30,
    yPosition: 58,
    rotation: 3
  }
];

export const fatigueScale = {
  1: { emoji: "😭", label: "katastrofa" },
  2: { emoji: "😩", label: "teško" },
  3: { emoji: "😐", label: "okej" },
  4: { emoji: "🙂", label: "dobro" },
  5: { emoji: "🤩", label: "brutalno" }
} as const;
