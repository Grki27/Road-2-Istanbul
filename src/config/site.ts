export const siteConfig = {
  name: "Sedmo Nebo: Road to Istanbul",
  tagline:
    "Dva studenta, dvije bicikle, preko 1500 kilometara, 6 država i humanitarna priča za SOS Dječje selo.",
  startDate: "25.8.2026.",
  contactEmail: "sedmonebo27@gmail.com",
  plannedTotalKm: 1500,
  donationGoal: 1500,
  donationRaised: 0,
  donationUrl: "",
  socials: {
    instagram: "https://www.instagram.com/sedmo_nebo__/",
    tiktok: "https://www.tiktok.com/@sedmo_nebo_",
    youtube: "https://www.youtube.com/@sedmo_nebo",
    facebook: "https://www.facebook.com/share/1EAqH6LrCj/?mibextid=wwXlfr"
  },
  adminEmails: ["sedmonebo27@gmail.com", "marko.crepulja007@gmail.com"],
  partners: [
    {
      name: "Keindl Sport",
      logo: "/assets/partner-keindl.png",
      url: "https://keindl-sport.hr/"
    },
    {
      name: "SOS Dječje selo Hrvatska",
      logo: "/assets/partner-sos-djecje-selo.png",
      url: "https://sos-dsh.hr/"
    },
    {
      name: "Louder!",
      logo: "/assets/partner-louder.png",
      url: "https://louder.hr/"
    }
  ]
} as const;
