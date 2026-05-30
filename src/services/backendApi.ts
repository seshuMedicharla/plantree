import { apiDelete, apiGet, apiPost } from './http'
import type { Badge, LeaderRow, Reel, Zone } from './types'
import type { PlantingItem } from './types'

export type FeedPost = {
  id: string
  user: { id?: string; name: string; place: string }
  caption: string
  likes: number
  comments: number
  shares?: number
  trees: number
  zoneTag?: 'NEGATIVE' | 'NORMAL'
  createdAt: string
  saved?: boolean
  photoUrls?: string[]
  videoUrl?: string
}

export type PostComment = {
  id: string
  postId: string
  body: string
  createdAt: string
  canDelete?: boolean
  user: { id?: string; name: string; username?: string }
}

export type NotificationItem = {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export type SearchResult = {
  id: string
  type: 'profile' | 'post' | 'badge'
  title: string
  subtitle: string
}

export type ProfilePayload = {
  profile: {
    id: string
    name: string
    place: string
    followers: number
    following: number
    plantedTrees: number
    donatedTrees: number
    impact: number
    streak: number
    bio: string
    joined: string
  }
  badges: Badge[]
  plantings: PlantingItem[]
  verificationRate: number
}

export async function fetchFeedPosts() {
  return apiGet<{ posts: FeedPost[] }>('/posts')
}

export async function likePost(postId: string) {
  return apiPost<{ message: string; post: FeedPost }>(`/posts/${postId}/like`)
}

export async function savePost(postId: string) {
  return apiPost<{ message: string; post: FeedPost }>(`/posts/${postId}/save`)
}

export async function fetchPostComments(postId: string) {
  return apiGet<{ comments: PostComment[] }>(`/posts/${postId}/comments`)
}

export async function addPostComment(postId: string, body: string) {
  return apiPost<{ message: string; comment: PostComment; post: FeedPost }>(
    `/posts/${postId}/comments`,
    { body }
  )
}

export async function deletePostComment(postId: string, commentId: string) {
  return apiDelete<{ message: string; post: FeedPost }>(`/posts/${postId}/comments/${commentId}`)
}

export async function sharePost(postId: string) {
  return apiPost<{ message: string; post: FeedPost }>(`/posts/${postId}/share`)
}

export async function fetchNotifications() {
  return apiGet<{ notifications: NotificationItem[] }>('/notifications')
}

export async function markNotificationRead(notificationId: string) {
  return apiPost<{ message: string; notification: NotificationItem }>(
    `/notifications/${notificationId}/read`
  )
}

export async function searchAll(query: string) {
  return apiGet<{ results: SearchResult[] }>(`/search?q=${encodeURIComponent(query)}`)
}

export async function fetchReels() {
  return apiGet<{ reels: Reel[] }>('/reels')
}

export async function fetchBadges() {
  return apiGet<{ badges: Badge[] }>('/badges')
}

export async function fetchZones() {
  return apiGet<{ zones: Zone[] }>('/zones')
}

export type ChatSummary = {
  id: string
  name: string
  message: string
  time: string
  kind: 'COMMUNITY' | 'DIRECT'
}

export type ChatMessage = {
  id: string
  conversationId: string
  body: string
  createdAt: string
  mine: boolean
  user: { id?: string; name: string; username?: string }
}

export async function fetchChats() {
  return apiGet<{ chats: ChatSummary[] }>('/chats')
}

export async function fetchChatMessages(conversationId: string) {
  return apiGet<{
    conversation: { id: string; name: string; kind: 'COMMUNITY' | 'DIRECT' }
    messages: ChatMessage[]
  }>(`/chats/${conversationId}/messages`)
}

export async function sendChatMessage(conversationId: string, body: string) {
  return apiPost<{ message: ChatMessage }>(`/chats/${conversationId}/messages`, { body })
}

export async function openDirectChat(userId: string) {
  return apiPost<{ chat: ChatSummary }>(`/chats/direct`, { userId })
}

export type LeaderboardScope = 'village' | 'mandal' | 'district' | 'state'

export async function fetchLeaderboard(scope: LeaderboardScope) {
  return apiGet<{
    scope: LeaderboardScope
    rows: LeaderRow[]
    myRank?: number
    myRow?: LeaderRow
  }>(`/leaderboard?scope=${scope}`)
}

export async function fetchProfile() {
  return apiGet<ProfilePayload>('/profile/me')
}
