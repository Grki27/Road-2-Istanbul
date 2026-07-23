import type {
  CurrentLocation,
  DailyRecap,
  MapEvent,
  StickyNote
} from "@/types";

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
    isRestDay: false,
    marinFatigueRating: 4,
    markoFatigueRating: 4,
    coverImage: "/assets/journey-support-1.jpg",
    images: ["/assets/journey-support-1.jpg", "/assets/journey-support-2.jpg"],
    comments: [
      {
        id: "preview-comment-1",
        recapId: "preview-1",
        authorName: "Ana",
        message: "Ajmo jako, ovo vec izgleda kao film.",
        status: "approved",
        reactions: [],
        createdAt: "2026-08-25T12:00:00.000Z"
      },
      {
        id: "preview-comment-2",
        recapId: "preview-1",
        authorName: "Luka",
        message: "Pratim svaki kilometar, samo nemojte zaboravit jest.",
        status: "approved",
        reactions: [],
        createdAt: "2026-08-25T13:15:00.000Z"
      }
    ],
    commentCount: 2
  }
];

export const previewCurrentLocation: CurrentLocation = {
  id: "preview-location",
  latitude: 42.6507,
  longitude: 18.0944,
  note: "Demo zadnje lokacije prije početka puta.",
  createdAt: "2026-08-25T08:00:00.000Z"
};

export const previewMapEvents: MapEvent[] = [
  {
    id: "preview-event",
    emoji: "🥐",
    title: "Prvi burek checkpoint",
    description: "Primjer kako će izgledati kratki događaji, kvarovi i sidequestovi s ceste.",
    locationName: "Dubrovnik",
    country: "Hrvatska",
    latitude: 42.641,
    longitude: 18.108,
    images: [],
    createdAt: "2026-08-25T09:00:00.000Z"
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
  1: { emoji: "💀", label: "mrtvi" },
  2: { emoji: "😵", label: "umiremo" },
  3: { emoji: "😐", label: "neloša" },
  4: { emoji: "🙂", label: "odmorni" },
  5: { emoji: "🚀", label: "letimoo" }
} as const;
