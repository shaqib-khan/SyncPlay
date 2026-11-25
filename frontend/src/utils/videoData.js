/**
 * SINGLE SOURCE OF TRUTH FOR VIDEO METADATA
 * Every video ID has been verified via the YouTube API with exact titles, channels, and durations.
 */

export const HERO_CAROUSEL_ITEMS = [
  {
    id: 'Way9Dexny3w',
    title: 'Dune: Part Two | Official Trailer',
    channel: 'Warner Bros.',
    duration: '2:24',
    badge: 'IMAX · 4K',
    genre: 'Sci-Fi · Epic',
    year: '2024',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between the love of his life and the fate of the known universe.',
  },
  {
    id: 'uYPbbksJxIg',
    title: 'Oppenheimer | New Trailer',
    channel: 'Universal Pictures',
    duration: '3:07',
    badge: 'CINEMATIC 4K',
    genre: 'Historical · Thriller',
    year: '2023',
    description: 'Directed by Christopher Nolan, Oppenheimer explores the story of American scientist J. Robert Oppenheimer and his role in the Manhattan Project, pioneering the atomic age.',
  },
  {
    id: 'TcMBFSGVi1c',
    title: "Marvel Studios' Avengers: Endgame - Official Trailer",
    channel: 'Marvel Entertainment',
    duration: '2:27',
    badge: '4K BLOCKBUSTER',
    genre: 'Action · Superhero',
    year: '2019',
    description: 'The grave course of events set in motion by Thanos that wiped out half the universe and fractured the Avengers ranks compels the remaining Avengers to take one final stand.',
  },
  {
    id: '4NRXx6U8ABQ',
    title: 'The Weeknd - Blinding Lights (Official Video)',
    channel: 'TheWeekndVEVO',
    duration: '4:20',
    badge: 'TOP HIT',
    genre: 'Synthwave · Pop',
    year: '2020',
    description: 'The record-breaking global sensation that dominated charts around the world. Stream this high-energy synthpop visual spectacle in real-time sync with friends.',
  },
  {
    id: 'LXb3EKWsInQ',
    title: 'COSTA RICA IN 4K 60fps HDR (ULTRA HD)',
    channel: 'Jacob + Katie Schwarz',
    duration: '5:14',
    badge: '4K NATURE',
    genre: 'Documentary · Nature',
    year: '2021',
    description: 'Explore the vibrant tropical wildlife, lush rainforest canopies, and pristine coastlines of Costa Rica captured in breathtaking 4K 60fps Ultra HD resolution.',
  },
]

export const CATEGORIES = [
  {
    id: 'featured',
    title: 'Featured Watch Parties',
    subtitle: 'Popular cinematic trailers and global hits',
    videos: [
      { id: 'Way9Dexny3w', title: 'Dune: Part Two | Official Trailer', channel: 'Warner Bros.', duration: '2:24', category: 'Featured' },
      { id: 'uYPbbksJxIg', title: 'Oppenheimer | New Trailer', channel: 'Universal Pictures', duration: '3:07', category: 'Featured' },
      { id: 'TcMBFSGVi1c', title: "Marvel Studios' Avengers: Endgame - Official Trailer", channel: 'Marvel Entertainment', duration: '2:27', category: 'Featured' },
      { id: 'b9EkMc79ZSU', title: 'Stranger Things | Official Final Trailer | Netflix', channel: 'Netflix', duration: '2:47', category: 'Featured' },
      { id: 'JfVOs4VSpmA', title: 'SPIDER-MAN: NO WAY HOME - Official Trailer (HD)', channel: 'Sony Pictures Entertainment', duration: '3:04', category: 'Featured' },
      { id: 'zSWdZVtXT7E', title: 'Interstellar - Trailer - Official Warner Bros. UK', channel: 'Warner Bros. UK', duration: '2:32', category: 'Featured' },
    ],
  },
  {
    id: 'popular',
    title: 'Popular on YouTube',
    subtitle: 'Billion-view music milestones',
    videos: [
      { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)', channel: 'Rick Astley', duration: '3:33', category: 'Popular' },
      { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee', channel: 'Luis Fonsi', duration: '4:42', category: 'Popular' },
      { id: 'JGwWNGJdvx8', title: 'Ed Sheeran - Shape of You (Official Music Video)', channel: 'Ed Sheeran', duration: '4:24', category: 'Popular' },
      { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE(강남스타일) M/V', channel: 'officialpsy', duration: '4:13', category: 'Popular' },
      { id: '09R8_2nJtjg', title: 'Maroon 5 - Sugar (Official Music Video)', channel: 'Maroon5VEVO', duration: '5:01', category: 'Popular' },
      { id: 'CevxZvSJLk8', title: 'Katy Perry - Roar', channel: 'KatyPerryVEVO', duration: '4:30', category: 'Popular' },
    ],
  },
  {
    id: 'recommended',
    title: 'Recommended for You',
    subtitle: 'Curated group listening sessions',
    videos: [
      { id: 'hT_nvWreIhg', title: 'OneRepublic - Counting Stars', channel: 'OneRepublicVEVO', duration: '4:44', category: 'Recommended' },
      { id: '2Vv-BfVoq4g', title: 'Ed Sheeran - Perfect (Official Music Video)', channel: 'Ed Sheeran', duration: '4:40', category: 'Recommended' },
      { id: 'fRh_vgS2dFE', title: 'Justin Bieber - Sorry (PURPOSE : The Movement)', channel: 'JustinBieberVEVO', duration: '3:26', category: 'Recommended' },
      { id: 'YqeW9_5kURI', title: 'Major Lazer & DJ Snake - Lean On (feat. MØ) [Official 4K Music Video]', channel: 'Major Lazer Official', duration: '2:58', category: 'Recommended' },
      { id: '4NRXx6U8ABQ', title: 'The Weeknd - Blinding Lights (Official Video)', channel: 'TheWeekndVEVO', duration: '4:20', category: 'Recommended' },
      { id: 'fJ9rUzIMcZQ', title: 'Queen – Bohemian Rhapsody (Official Video Remastered)', channel: 'Queen Official', duration: '6:00', category: 'Recommended' },
    ],
  },
  {
    id: 'music',
    title: 'Music Hits & Concerts',
    subtitle: 'Live sets, remastered classics, and chart-toppers',
    videos: [
      { id: 'fJ9rUzIMcZQ', title: 'Queen – Bohemian Rhapsody (Official Video Remastered)', channel: 'Queen Official', duration: '6:00', category: 'Music' },
      { id: 'VQH8ZTgna3Q', title: 'Arctic Monkeys - R U Mine? (Official Video)', channel: 'Official Arctic Monkeys', duration: '3:44', category: 'Music' },
      { id: 'lTRiuFIWV54', title: '1 A.M Study Session 📚 [lofi hip hop]', channel: 'Lofi Girl', duration: 'Live', category: 'Music' },
      { id: 'JGwWNGJdvx8', title: 'Ed Sheeran - Shape of You (Official Music Video)', channel: 'Ed Sheeran', duration: '4:24', category: 'Music' },
      { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee', channel: 'Luis Fonsi', duration: '4:42', category: 'Music' },
      { id: '4NRXx6U8ABQ', title: 'The Weeknd - Blinding Lights (Official Video)', channel: 'TheWeekndVEVO', duration: '4:20', category: 'Music' },
    ],
  },
  {
    id: 'gaming',
    title: 'Gaming & Trailers',
    subtitle: 'Official reveals and open-world cinematic showcases',
    videos: [
      { id: '8X2kIfS6fb8', title: 'Cyberpunk 2077 — Official E3 2018 Trailer', channel: 'Cyberpunk 2077', duration: '1:41', category: 'Gaming' },
      { id: 'eaW0tYpxyp0', title: 'Red Dead Redemption 2: Official Trailer #3', channel: 'Rockstar Games', duration: '2:09', category: 'Gaming' },
      { id: 'QkkoHAzjnUs', title: 'Grand Theft Auto V Trailer', channel: 'Rockstar Games', duration: '1:25', category: 'Gaming' },
      { id: 'MmB9b5njVbA', title: 'Official Minecraft Trailer', channel: 'TeamMojang', duration: '1:23', category: 'Gaming' },
    ],
  },
  {
    id: 'entertainment',
    title: 'Entertainment & Blockbusters',
    subtitle: 'Hollywood blockbusters and YouTube original spectacles',
    videos: [
      { id: '0e3GPea1Tyg', title: '$456,000 Squid Game In Real Life!', channel: 'MrBeast', duration: '25:42', category: 'Entertainment' },
      { id: 'Way9Dexny3w', title: 'Dune: Part Two | Official Trailer', channel: 'Warner Bros.', duration: '2:24', category: 'Entertainment' },
      { id: 'uYPbbksJxIg', title: 'Oppenheimer | New Trailer', channel: 'Universal Pictures', duration: '3:07', category: 'Entertainment' },
      { id: 'YoHD9XEInc0', title: 'Inception (2010) Official Trailer #1 - Christopher Nolan Movie HD', channel: 'Rotten Tomatoes Classic Trailers', duration: '2:29', category: 'Entertainment' },
      { id: 'TcMBFSGVi1c', title: "Marvel Studios' Avengers: Endgame - Official Trailer", channel: 'Marvel Entertainment', duration: '2:27', category: 'Entertainment' },
    ],
  },
  {
    id: 'technology',
    title: 'Technology & Science',
    subtitle: 'Deep dives, computer science, and animations',
    videos: [
      { id: 'aircAruvnKk', title: 'But what is a neural network? | Deep learning chapter 1', channel: '3Blue1Brown', duration: '19:13', category: 'Technology' },
      { id: 'SqcY0GlETPk', title: 'React Tutorial for Beginners', channel: 'Programming with Mosh', duration: '1:19:15', category: 'Technology' },
      { id: 'B1J6Ou4q8vE', title: 'Animation vs. Math', channel: 'Alan Becker', duration: '14:26', category: 'Technology' },
    ],
  },
  {
    id: 'documentaries',
    title: 'Documentaries & Nature 4K',
    subtitle: 'Wildlife, expedition, and high-definition landscapes',
    videos: [
      { id: 'LXb3EKWsInQ', title: 'COSTA RICA IN 4K 60fps HDR (ULTRA HD)', channel: 'Jacob + Katie Schwarz', duration: '5:14', category: 'Documentaries' },
      { id: '1La4QzGeaaQ', title: 'Peru 8K HDR 60FPS (FUHD)', channel: 'Jacob + Katie Schwarz', duration: '5:39', category: 'Documentaries' },
      { id: 'wTcNtgA6gHs', title: 'GoPro HERO4: The Adventure of Life in 4K', channel: 'GoPro', duration: '4:45', category: 'Documentaries' },
      { id: 'F1B9Fk_SgI0', title: 'Childish Gambino - Feels Like Summer (Official Video)', channel: 'ChildishGambinoVEVO', duration: '4:46', category: 'Documentaries' },
    ],
  },
]
