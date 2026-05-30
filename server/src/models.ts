import type { UserRole } from './auth/jwt.js'

export type UserDocument = {
  _id: string
  name: string
  username: string
  email?: string
  phone?: string
  passwordHash?: string
  role: UserRole
  avatarUrl?: string
  place?: string
  mandal?: string
  village?: string
  district?: string
  state?: string
  bio: string
  followersCount: number
  followingCount: number
  plantedTreesCount: number
  donatedTreesCount: number
  impactScore: number
  streakDays: number
  badges?: string[]
  createdAt: Date
  updatedAt: Date
}

export type PlantingStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

export type PlantingDocument = {
  _id: string
  userId: string
  zoneId?: string
  species: string
  count: number
  latitude: number
  longitude: number
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
  accuracy: number
  hasVideo: boolean
  photosCount: number
  status: PlantingStatus
  rejectionReason?: string
  verifiedBy?: string
  verifiedAt?: Date
  media?: Array<{ id: string; type: 'photo' | 'video'; url: string }>
  createdAt: Date
  updatedAt: Date
}

export type PostDocument = {
  _id: string
  userId: string
  plantingId?: string
  caption: string
  likesCount: number
  commentsCount: number
  shareCount?: number
  savedCount: number
  likedBy: string[]
  savedBy: string[]
  createdAt: Date
  updatedAt: Date
}

export type CommentDocument = {
  _id: string
  postId: string
  userId: string
  body: string
  createdAt: Date
  updatedAt: Date
}

export type NotificationDocument = {
  _id: string
  userId: string
  title: string
  body: string
  read: boolean
  createdAt: Date
}

export type BadgeDocument = {
  _id: string
  name: string
  description: string
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  ruleKey: string
  createdAt: Date
}

export type ZoneDocument = {
  _id: string
  name: string
  type: 'NEGATIVE' | 'NORMAL'
  multiplier: number
  mandal?: string
  village?: string
  createdAt: Date
  updatedAt: Date
}

export type ConversationDocument = {
  _id: string
  title?: string
  kind?: 'COMMUNITY' | 'DIRECT'
  participantIds: string[]
  lastMessage?: {
    body: string
    userId?: string
    createdAt: Date
  }
  createdAt: Date
  updatedAt: Date
}

export type MessageDocument = {
  _id: string
  conversationId: string
  userId: string
  body: string
  createdAt: Date
  updatedAt: Date
}
