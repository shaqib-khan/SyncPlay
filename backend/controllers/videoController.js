// Video Search Controller using native Node fetch
// Curated verified videos list as fallback
const CURATED_VIDEOS = [
  { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)', channel: 'Rick Astley', duration: '3:33', category: 'Music' },
  { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee', channel: 'Luis Fonsi', duration: '4:42', category: 'Music' },
  { id: 'JGwWNGJdvx8', title: 'Ed Sheeran - Shape of You (Official Music Video)', channel: 'Ed Sheeran', duration: '4:24', category: 'Music' },
  { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE(강남스타일) M/V', channel: 'officialpsy', duration: '4:13', category: 'Music' },
  { id: '09R8_2nJtjg', title: 'Maroon 5 - Sugar (Official Music Video)', channel: 'Maroon5VEVO', duration: '5:01', category: 'Music' },
  { id: 'hT_nvWreIhg', title: 'OneRepublic - Counting Stars', channel: 'OneRepublicVEVO', duration: '4:44', category: 'Music' },
  { id: '2Vv-BfVoq4g', title: 'Ed Sheeran - Perfect (Official Music Video)', channel: 'Ed Sheeran', duration: '4:40', category: 'Music' },
  { id: 'fRh_vgS2dFE', title: 'Justin Bieber - Sorry (PURPOSE : The Movement)', channel: 'JustinBieberVEVO', duration: '3:26', category: 'Music' },
  { id: 'fJ9rUzIMcZQ', title: 'Queen – Bohemian Rhapsody (Official Video Remastered)', channel: 'Queen Official', duration: '6:00', category: 'Music' },
  { id: '4NRXx6U8ABQ', title: 'The Weeknd - Blinding Lights (Official Video)', channel: 'TheWeekndVEVO', duration: '4:20', category: 'Music' },
  { id: 'CevxZvSJLk8', title: 'Katy Perry - Roar', channel: 'KatyPerryVEVO', duration: '4:30', category: 'Music' },
  { id: 'YqeW9_5kURI', title: 'Major Lazer & DJ Snake - Lean On (feat. MØ) [Official 4K Music Video]', channel: 'Major Lazer Official', duration: '2:58', category: 'Music' },
  { id: 'VQH8ZTgna3Q', title: 'Arctic Monkeys - R U Mine? (Official Video)', channel: 'Official Arctic Monkeys', duration: '3:44', category: 'Music' },
  { id: 'lTRiuFIWV54', title: '1 A.M Study Session 📚 [lofi hip hop]', channel: 'Lofi Girl', duration: 'Live', category: 'Music' },

  { id: 'uYPbbksJxIg', title: 'Oppenheimer | New Trailer', channel: 'Universal Pictures', duration: '3:07', category: 'Entertainment' },
  { id: 'Way9Dexny3w', title: 'Dune: Part Two | Official Trailer', channel: 'Warner Bros.', duration: '2:24', category: 'Entertainment' },
  { id: 'TcMBFSGVi1c', title: "Marvel Studios' Avengers: Endgame - Official Trailer", channel: 'Marvel Entertainment', duration: '2:27', category: 'Entertainment' },
  { id: 'JfVOs4VSpmA', title: 'SPIDER-MAN: NO WAY HOME - Official Trailer (HD)', channel: 'Sony Pictures Entertainment', duration: '3:04', category: 'Entertainment' },
  { id: 'b9EkMc79ZSU', title: 'Stranger Things | Official Final Trailer | Netflix', channel: 'Netflix', duration: '2:47', category: 'Entertainment' },
  { id: 'zSWdZVtXT7E', title: 'Interstellar - Trailer - Official Warner Bros. UK', channel: 'Warner Bros. UK', duration: '2:32', category: 'Entertainment' },
  { id: 'YoHD9XEInc0', title: 'Inception (2010) Official Trailer #1 - Christopher Nolan Movie HD', channel: 'Rotten Tomatoes Classic Trailers', duration: '2:29', category: 'Entertainment' },
  { id: '0e3GPea1Tyg', title: '$456,000 Squid Game In Real Life!', channel: 'MrBeast', duration: '25:42', category: 'Entertainment' },

  { id: 'eaW0tYpxyp0', title: 'Red Dead Redemption 2: Official Trailer #3', channel: 'Rockstar Games', duration: '2:09', category: 'Gaming' },
  { id: 'QkkoHAzjnUs', title: 'Grand Theft Auto V Trailer', channel: 'Rockstar Games', duration: '1:25', category: 'Gaming' },
  { id: 'MmB9b5njVbA', title: 'Official Minecraft Trailer', channel: 'TeamMojang', duration: '1:23', category: 'Gaming' },
  { id: '8X2kIfS6fb8', title: 'Cyberpunk 2077 — Official E3 2018 Trailer', channel: 'Cyberpunk 2077', duration: '1:41', category: 'Gaming' },

  { id: 'aircAruvnKk', title: 'But what is a neural network? | Deep learning chapter 1', channel: '3Blue1Brown', duration: '19:13', category: 'Technology' },
  { id: 'SqcY0GlETPk', title: 'React Tutorial for Beginners', channel: 'Programming with Mosh', duration: '1:19:15', category: 'Technology' },
  { id: 'B1J6Ou4q8vE', title: 'Animation vs. Math', channel: 'Alan Becker', duration: '14:26', category: 'Technology' },

  { id: 'LXb3EKWsInQ', title: 'COSTA RICA IN 4K 60fps HDR (ULTRA HD)', channel: 'Jacob + Katie Schwarz', duration: '5:14', category: 'Documentaries' },
  { id: '1La4QzGeaaQ', title: 'Peru 8K HDR 60FPS (FUHD)', channel: 'Jacob + Katie Schwarz', duration: '5:39', category: 'Documentaries' },
  { id: 'wTcNtgA6gHs', title: 'GoPro HERO4: The Adventure of Life in 4K', channel: 'GoPro', duration: '4:45', category: 'Documentaries' },
  { id: 'F1B9Fk_SgI0', title: 'Childish Gambino - Feels Like Summer (Official Video)', channel: 'ChildishGambinoVEVO', duration: '4:46', category: 'Documentaries' },
]

const extractVideoId = (input) => {
  if (!input) return null
  input = input.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*&v=([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = input.match(p)
    if (m) return m[1]
  }
  return null
}

const searchVideos = async (req, res) => {
  const query = (req.query.q || '').trim()
  if (!query) return res.json({ results: CURATED_VIDEOS.slice(0, 12), source: 'curated' })

  // Check if query is a direct video ID or YouTube URL
  const directId = extractVideoId(query)
  if (directId) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${directId}&format=json`)
      if (oembedRes.ok) {
        const oembed = await oembedRes.json()
        return res.json({
          results: [
            {
              id: directId,
              title: oembed.title,
              channel: oembed.author_name,
              duration: '',
              category: 'Direct URL',
              isDirect: true,
            },
          ],
          source: 'oembed',
        })
      }
    } catch {
      return res.json({
        results: [
          {
            id: directId,
            title: `YouTube Video (${directId})`,
            channel: 'YouTube',
            duration: '',
            category: 'Direct URL',
            isDirect: true,
          },
        ],
        source: 'direct',
      })
    }
  }

  // If YOUTUBE_API_KEY is configured in backend environment
  const apiKey = process.env.YOUTUBE_API_KEY
  if (apiKey && apiKey !== 'your_youtube_api_key_here') {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q=${encodeURIComponent(query)}&key=${apiKey}`
      const ytRes = await fetch(url)
      if (ytRes.ok) {
        const data = await ytRes.json()
        const results = (data.items || []).map(item => ({
          id: item.id?.videoId,
          title: item.snippet?.title,
          channel: item.snippet?.channelTitle,
          description: item.snippet?.description,
          publishedAt: item.snippet?.publishedAt,
          category: 'YouTube Search',
          thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url,
        })).filter(r => r.id)

        return res.json({ results, source: 'youtube_api' })
      }
    } catch (err) {
      console.warn('YouTube Data API search failed, falling back to curated:', err.message)
    }
  }

  // Fallback: search in verified curated list
  const qLower = query.toLowerCase()
  const matched = CURATED_VIDEOS.filter(v =>
    v.title.toLowerCase().includes(qLower) ||
    v.channel.toLowerCase().includes(qLower) ||
    v.category.toLowerCase().includes(qLower)
  )

  return res.json({
    results: matched.length > 0 ? matched : CURATED_VIDEOS.slice(0, 8),
    source: 'curated',
    hasKey: !!(apiKey && apiKey !== 'your_youtube_api_key_here'),
  })
}

module.exports = { searchVideos, CURATED_VIDEOS }
