export type Reel = {
  id: string
  user: { name: string; place: string }
  caption: string
  likes: number
  comments: number
  trees: number
  zoneTag?: 'NEGATIVE' | 'NORMAL'
  videoUrl?: string
}

export type Badge = {
  id: string
  name: string
  desc: string
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
}

export type LeaderRow = {
  id?: string
  rank: number
  name: string
  place: string
  score: number
  trees: number
  bio: string
  impact: number
  joined: string
  isMe?: boolean
}

export type Zone = {
  id: string
  name: string
  type: 'NEGATIVE' | 'NORMAL'
  multiplier: number
}

export type PlantingStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

export type PlantingItem = {
  id: string
  date: string
  place: string
  trees: number
  status: PlantingStatus
}
