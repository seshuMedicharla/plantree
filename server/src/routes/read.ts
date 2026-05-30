import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { getRequestUser, getRequestUserId } from '../auth/jwt.js'
import { collection } from '../mongo.js'
import type {
  BadgeDocument,
  CommentDocument,
  ConversationDocument,
  MessageDocument,
  NotificationDocument,
  PlantingDocument,
  PostDocument,
  UserDocument,
  ZoneDocument,
} from '../models.js'

const router = Router()

const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(500),
})
const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(1000),
})
const directChatSchema = z.object({
  userId: z.string().trim().min(1),
})
const COMMUNITY_CONVERSATION_ID = 'community-global'

function requireUser(request: Request, response: Response) {
  const userId = getRequestUserId(request)

  if (!userId) {
    response.status(401).json({ message: 'Login required' })
    return null
  }

  return userId
}

function compactPlace(parts: Array<string | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(', ')
}

type LeaderboardScope = 'village' | 'mandal' | 'district' | 'state'

function placeForUser(user?: UserDocument | null, scope?: LeaderboardScope) {
  if (!user) return ''

  if (scope === 'village') {
    return compactPlace([user.village, user.district, user.state]) || user.place || ''
  }

  if (scope === 'mandal') {
    return compactPlace([user.mandal, user.district, user.state]) || user.place || ''
  }

  if (scope === 'district') {
    return compactPlace([user.district, user.state]) || user.place || ''
  }

  if (scope === 'state') {
    return user.state || user.place || ''
  }

  return user.place || compactPlace([user.village, user.district, user.state]) || compactPlace([user.mandal, user.state])
}

function leaderboardScope(value: unknown): LeaderboardScope {
  return value === 'mandal' || value === 'district' || value === 'state' ? value : 'village'
}

function scopeValueForUser(user: UserDocument, scope: LeaderboardScope) {
  if (scope === 'village') return user.village
  if (scope === 'mandal') return user.mandal
  if (scope === 'district') return user.district
  return user.state
}

async function ensureCommunityConversation() {
  const conversations = await collection<ConversationDocument>('conversations')
  const now = new Date()
  await conversations.updateOne(
    { _id: COMMUNITY_CONVERSATION_ID },
    {
      $setOnInsert: {
        _id: COMMUNITY_CONVERSATION_ID,
        title: 'Community Chat',
        kind: 'COMMUNITY',
        participantIds: [],
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true }
  )

  return conversations.findOne({ _id: COMMUNITY_CONVERSATION_ID })
}

function canAccessConversation(conversation: ConversationDocument, userId: string) {
  return conversation.kind === 'COMMUNITY' || conversation._id === COMMUNITY_CONVERSATION_ID || conversation.participantIds.includes(userId)
}

function directConversationId(userId: string, otherUserId: string) {
  return `direct-${[userId, otherUserId].sort().join('-')}`
}

function canDeleteCommentForPost(post: PostDocument | null, user: ReturnType<typeof getRequestUser>) {
  return !!user && (user.role === 'ADMIN' || post?.userId === user.sub)
}

async function toFeedPost(post: PostDocument, currentUserId: string | null) {
  const users = await collection<UserDocument>('users')
  const plantings = await collection<PlantingDocument>('plantings')
  const user = await users.findOne({ _id: post.userId })
  const planting = post.plantingId ? await plantings.findOne({ _id: post.plantingId }) : null
  const media = planting?.media ?? []
  const photoUrls = media.filter((item) => item.type === 'photo').map((item) => item.url)
  const videoUrl = media.find((item) => item.type === 'video')?.url

  return {
    id: post._id,
    user: {
      id: post.userId,
      name: user?.name ?? 'PlanTree User',
      place: placeForUser(user),
    },
    caption: post.caption,
    likes: post.likesCount,
    comments: post.commentsCount,
    shares: post.shareCount ?? 0,
    trees: planting?.count ?? 0,
    zoneTag: undefined,
    createdAt: post.createdAt.toISOString(),
    saved: currentUserId ? post.savedBy.includes(currentUserId) : false,
    photoUrls,
    videoUrl,
  }
}

async function fetchPost(postId: string, userId: string) {
  const posts = await collection<PostDocument>('posts')
  const post = await posts.findOne({ _id: postId })

  return post ? toFeedPost(post, userId) : null
}

router.get('/posts', async (request, response, next) => {
  try {
    const userId = getRequestUserId(request)
    const posts = await collection<PostDocument>('posts')
    const rows = await posts.find().sort({ createdAt: -1 }).limit(50).toArray()

    response.json({ posts: await Promise.all(rows.map((post) => toFeedPost(post, userId))) })
  } catch (error) {
    next(error)
  }
})

router.post('/posts/:id/like', async (request, response, next) => {
  try {
    const userId = requireUser(request, response)
    if (!userId) return

    const posts = await collection<PostDocument>('posts')
    await posts.updateOne(
      { _id: request.params.id },
      {
        $addToSet: { likedBy: userId },
        $set: { updatedAt: new Date() },
      }
    )
    const post = await posts.findOne({ _id: request.params.id })

    if (post) {
      await posts.updateOne(
        { _id: post._id },
        { $set: { likesCount: post.likedBy.includes(userId) ? post.likedBy.length : post.likedBy.length + 1 } }
      )
    }

    response.json({ message: 'Post liked', post: await fetchPost(request.params.id, userId) })
  } catch (error) {
    next(error)
  }
})

router.post('/posts/:id/save', async (request, response, next) => {
  try {
    const userId = requireUser(request, response)
    if (!userId) return

    const posts = await collection<PostDocument>('posts')
    await posts.updateOne(
      { _id: request.params.id },
      {
        $addToSet: { savedBy: userId },
        $set: { updatedAt: new Date() },
      }
    )
    const post = await posts.findOne({ _id: request.params.id })

    if (post) {
      await posts.updateOne(
        { _id: post._id },
        { $set: { savedCount: post.savedBy.includes(userId) ? post.savedBy.length : post.savedBy.length + 1 } }
      )
    }

    response.json({ message: 'Post saved', post: await fetchPost(request.params.id, userId) })
  } catch (error) {
    next(error)
  }
})

router.get('/posts/:id/comments', async (request, response, next) => {
  try {
    const currentUser = getRequestUser(request)
    const comments = await collection<CommentDocument>('comments')
    const users = await collection<UserDocument>('users')
    const posts = await collection<PostDocument>('posts')
    const post = await posts.findOne({ _id: request.params.id })
    const rows = await comments
      .find({ postId: request.params.id })
      .sort({ createdAt: 1 })
      .limit(100)
      .toArray()
    const userIds = [...new Set(rows.map((comment) => comment.userId))]
    const userRows = await users.find({ _id: { $in: userIds } }).toArray()
    const usersById = new Map(userRows.map((user) => [user._id, user]))

    response.json({
      comments: rows.map((comment) => {
        const user = usersById.get(comment.userId)

        return {
          id: comment._id,
          postId: comment.postId,
          body: comment.body,
          createdAt: comment.createdAt.toISOString(),
          canDelete: canDeleteCommentForPost(post, currentUser),
          user: {
            id: comment.userId,
            name: user?.name ?? 'PlanTree User',
            username: user?.username ?? '',
          },
        }
      }),
    })
  } catch (error) {
    next(error)
  }
})

router.post('/posts/:id/comments', async (request, response, next) => {
  try {
    const userId = requireUser(request, response)
    if (!userId) return

    const payload = createCommentSchema.parse(request.body)
    const posts = await collection<PostDocument>('posts')
    const post = await posts.findOne({ _id: request.params.id })

    if (!post) {
      response.status(404).json({ message: 'Post not found' })
      return
    }

    const now = new Date()
    const comment: CommentDocument = {
      _id: randomUUID(),
      postId: request.params.id,
      userId,
      body: payload.body,
      createdAt: now,
      updatedAt: now,
    }
    const comments = await collection<CommentDocument>('comments')
    const users = await collection<UserDocument>('users')

    await comments.insertOne(comment)
    const commentsCount = await comments.countDocuments({ postId: request.params.id })
    await posts.updateOne(
      { _id: request.params.id },
      { $set: { commentsCount, updatedAt: now } }
    )
    const user = await users.findOne({ _id: userId })

    response.status(201).json({
      message: 'Comment added',
      comment: {
        id: comment._id,
        postId: comment.postId,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        canDelete: canDeleteCommentForPost(post, getRequestUser(request)),
        user: {
          id: userId,
          name: user?.name ?? 'PlanTree User',
          username: user?.username ?? '',
        },
      },
      post: await fetchPost(request.params.id, userId),
    })
  } catch (error) {
    next(error)
  }
})

router.delete('/posts/:postId/comments/:commentId', async (request, response, next) => {
  try {
    const currentUser = getRequestUser(request)

    if (!currentUser) {
      response.status(401).json({ message: 'Login required' })
      return
    }

    const posts = await collection<PostDocument>('posts')
    const comments = await collection<CommentDocument>('comments')
    const post = await posts.findOne({ _id: request.params.postId })

    if (!post) {
      response.status(404).json({ message: 'Post not found' })
      return
    }

    if (currentUser.role !== 'ADMIN' && post.userId !== currentUser.sub) {
      response.status(403).json({ message: 'Only admin or post author can delete comments' })
      return
    }

    const result = await comments.deleteOne({
      _id: request.params.commentId,
      postId: request.params.postId,
    })

    if (result.deletedCount === 0) {
      response.status(404).json({ message: 'Comment not found' })
      return
    }

    const commentsCount = await comments.countDocuments({ postId: request.params.postId })
    await posts.updateOne(
      { _id: request.params.postId },
      { $set: { commentsCount, updatedAt: new Date() } }
    )

    response.json({
      message: 'Comment deleted',
      post: await fetchPost(request.params.postId, currentUser.sub),
    })
  } catch (error) {
    next(error)
  }
})

router.post('/posts/:id/share', async (request, response, next) => {
  try {
    const userId = requireUser(request, response)
    if (!userId) return

    const posts = await collection<PostDocument>('posts')
    await posts.updateOne(
      { _id: request.params.id },
      {
        $inc: { shareCount: 1 },
        $set: { updatedAt: new Date() },
      }
    )

    response.json({ message: 'Post shared', post: await fetchPost(request.params.id, userId) })
  } catch (error) {
    next(error)
  }
})

router.get('/notifications', async (request, response, next) => {
  try {
    const userId = requireUser(request, response)
    if (!userId) return

    const notifications = await collection<NotificationDocument>('notifications')
    const rows = await notifications
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    response.json({
      notifications: rows.map((item) => ({
        id: item._id,
        title: item.title,
        body: item.body,
        read: item.read,
        createdAt: item.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    next(error)
  }
})

router.post('/notifications/:id/read', async (request, response, next) => {
  try {
    const userId = requireUser(request, response)
    if (!userId) return

    const notifications = await collection<NotificationDocument>('notifications')
    const result = await notifications.findOneAndUpdate(
      { _id: request.params.id, userId },
      { $set: { read: true } },
      { returnDocument: 'after' }
    )

    if (!result) {
      response.status(404).json({ message: 'Notification not found' })
      return
    }

    response.json({
      message: 'Notification marked read',
      notification: {
        id: result._id,
        title: result.title,
        body: result.body,
        read: result.read,
        createdAt: result.createdAt.toISOString(),
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/search', async (request, response, next) => {
  try {
    const searchTerm = String(request.query.q ?? '').trim()

    if (!searchTerm) {
      response.json({ results: [] })
      return
    }

    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const users = await collection<UserDocument>('users')
    const posts = await collection<PostDocument>('posts')
    const matchedUsers = await users.find({ name: regex }).limit(10).toArray()
    const matchedPosts = await posts.find({ caption: regex }).sort({ createdAt: -1 }).limit(10).toArray()

    response.json({
      results: [
        ...matchedUsers.map((user) => ({
          id: user._id,
          type: 'profile',
          title: user.name,
          subtitle: placeForUser(user),
        })),
        ...matchedPosts.map((post) => ({
          id: post._id,
          type: 'post',
          title: post.caption || 'Post',
          subtitle: '',
        })),
      ],
    })
  } catch (error) {
    next(error)
  }
})

router.get('/reels', async (_request, response, next) => {
  try {
    const posts = await collection<PostDocument>('posts')
    const rows = await posts.find().sort({ createdAt: -1 }).limit(30).toArray()
    const feedPosts = await Promise.all(rows.map((post) => toFeedPost(post, null)))

    response.json({
      reels: feedPosts.map((post) => ({
        id: post.id,
        user: { name: post.user.name, place: post.user.place },
        caption: post.caption,
        likes: post.likes,
        comments: post.comments,
        trees: post.trees,
        zoneTag: post.zoneTag,
        videoUrl: post.videoUrl,
      })),
    })
  } catch (error) {
    next(error)
  }
})

router.get('/badges', async (_request, response, next) => {
  try {
    const badges = await collection<BadgeDocument>('badges')
    const rows = await badges.find().sort({ name: 1 }).toArray()

    response.json({
      badges: rows.map((badge) => ({
        id: badge._id,
        name: badge.name,
        desc: badge.description,
        level: badge.level,
      })),
    })
  } catch (error) {
    next(error)
  }
})

router.get('/zones', async (_request, response, next) => {
  try {
    const zones = await collection<ZoneDocument>('zones')
    const rows = await zones.find().sort({ name: 1 }).toArray()

    response.json({
      zones: rows.map((zone) => ({
        id: zone._id,
        name: zone.name,
        type: zone.type,
        multiplier: zone.multiplier,
      })),
    })
  } catch (error) {
    next(error)
  }
})

router.get('/chats', async (request, response, next) => {
  try {
    const userId = requireUser(request, response)
    if (!userId) return

    await ensureCommunityConversation()
    const conversations = await collection<ConversationDocument>('conversations')
    const rows = await conversations
      .find({
        $or: [
          { _id: COMMUNITY_CONVERSATION_ID },
          { kind: 'COMMUNITY' },
          { participantIds: userId },
        ],
      })
      .sort({ updatedAt: -1 })
      .limit(30)
      .toArray()
    const directParticipantIds = [
      ...new Set(
        rows
          .filter((chat) => (chat.kind ?? 'DIRECT') === 'DIRECT')
          .flatMap((chat) => chat.participantIds.filter((participantId) => participantId !== userId))
      ),
    ]
    const users = await collection<UserDocument>('users')
    const directUsers = await users.find({ _id: { $in: directParticipantIds } }).toArray()
    const usersById = new Map(directUsers.map((user) => [user._id, user]))

    response.json({
      chats: rows.map((chat) => {
        const kind = chat.kind ?? 'DIRECT'
        const otherUserId = chat.participantIds.find((participantId) => participantId !== userId)
        const otherUser = otherUserId ? usersById.get(otherUserId) : null

        return {
          id: chat._id,
          name: kind === 'DIRECT' ? otherUser?.name ?? chat.title ?? 'Conversation' : chat.title ?? 'Conversation',
          message: chat.lastMessage?.body ?? '',
          time: chat.lastMessage?.createdAt.toISOString() ?? chat.updatedAt.toISOString(),
          kind,
        }
      }),
    })
  } catch (error) {
    next(error)
  }
})

router.post('/chats/direct', async (request, response, next) => {
  try {
    const userId = requireUser(request, response)
    if (!userId) return

    const payload = directChatSchema.parse(request.body)

    if (payload.userId === userId) {
      response.status(400).json({ message: 'You cannot start a chat with yourself' })
      return
    }

    const users = await collection<UserDocument>('users')
    const otherUser = await users.findOne({ _id: payload.userId })

    if (!otherUser) {
      response.status(404).json({ message: 'User not found' })
      return
    }

    const currentUser = await users.findOne({ _id: userId })
    const conversations = await collection<ConversationDocument>('conversations')
    const now = new Date()
    const conversationId = directConversationId(userId, payload.userId)
    const title = otherUser.name

    await conversations.updateOne(
      { _id: conversationId },
      {
        $setOnInsert: {
          _id: conversationId,
          title,
          kind: 'DIRECT',
          participantIds: [userId, payload.userId],
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    )

    const conversation = await conversations.findOne({ _id: conversationId })

    response.status(201).json({
      chat: {
        id: conversationId,
        name: conversation?.title ?? otherUser.name,
        message: conversation?.lastMessage?.body ?? '',
        time: conversation?.lastMessage?.createdAt.toISOString() ?? conversation?.updatedAt.toISOString() ?? now.toISOString(),
        kind: 'DIRECT',
        participant: {
          id: otherUser._id,
          name: otherUser.name,
          username: otherUser.username,
        },
        startedBy: currentUser?.name ?? 'PlanTree User',
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/chats/:id/messages', async (request, response, next) => {
  try {
    const userId = requireUser(request, response)
    if (!userId) return

    if (request.params.id === COMMUNITY_CONVERSATION_ID) {
      await ensureCommunityConversation()
    }

    const conversations = await collection<ConversationDocument>('conversations')
    const conversation = await conversations.findOne({ _id: request.params.id })

    if (!conversation || !canAccessConversation(conversation, userId)) {
      response.status(404).json({ message: 'Conversation not found' })
      return
    }

    const messages = await collection<MessageDocument>('messages')
    const users = await collection<UserDocument>('users')
    const directOtherUserId = conversation.participantIds.find((participantId) => participantId !== userId)
    const directOtherUser = directOtherUserId ? await users.findOne({ _id: directOtherUserId }) : null
    const rows = await messages
      .find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()
    const orderedRows = rows.reverse()
    const userIds = [...new Set(orderedRows.map((message) => message.userId))]
    const userRows = await users.find({ _id: { $in: userIds } }).toArray()
    const usersById = new Map(userRows.map((user) => [user._id, user]))

    response.json({
      conversation: {
        id: conversation._id,
        name:
          (conversation.kind ?? 'DIRECT') === 'DIRECT'
            ? directOtherUser?.name ?? conversation.title ?? 'Conversation'
            : conversation.title ?? 'Conversation',
        kind: conversation.kind ?? 'DIRECT',
      },
      messages: orderedRows.map((message) => {
        const user = usersById.get(message.userId)

        return {
          id: message._id,
          conversationId: message.conversationId,
          body: message.body,
          createdAt: message.createdAt.toISOString(),
          mine: message.userId === userId,
          user: {
            id: message.userId,
            name: user?.name ?? 'PlanTree User',
            username: user?.username ?? '',
          },
        }
      }),
    })
  } catch (error) {
    next(error)
  }
})

router.post('/chats/:id/messages', async (request, response, next) => {
  try {
    const userId = requireUser(request, response)
    if (!userId) return

    const payload = sendMessageSchema.parse(request.body)

    if (request.params.id === COMMUNITY_CONVERSATION_ID) {
      await ensureCommunityConversation()
    }

    const conversations = await collection<ConversationDocument>('conversations')
    const conversation = await conversations.findOne({ _id: request.params.id })

    if (!conversation || !canAccessConversation(conversation, userId)) {
      response.status(404).json({ message: 'Conversation not found' })
      return
    }

    const now = new Date()
    const message: MessageDocument = {
      _id: randomUUID(),
      conversationId: conversation._id,
      userId,
      body: payload.body,
      createdAt: now,
      updatedAt: now,
    }
    const messages = await collection<MessageDocument>('messages')
    const users = await collection<UserDocument>('users')

    await messages.insertOne(message)
    await conversations.updateOne(
      { _id: conversation._id },
      {
        $addToSet: { participantIds: userId },
        $set: {
          lastMessage: {
            body: message.body,
            userId,
            createdAt: now,
          },
          updatedAt: now,
        },
      }
    )
    const user = await users.findOne({ _id: userId })

    response.status(201).json({
      message: {
        id: message._id,
        conversationId: message.conversationId,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
        mine: true,
        user: {
          id: userId,
          name: user?.name ?? 'PlanTree User',
          username: user?.username ?? '',
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/leaderboard', async (request, response, next) => {
  try {
    const scope = leaderboardScope(request.query.scope)
    const currentUserId = getRequestUserId(request)
    const users = await collection<UserDocument>('users')
    const currentUser = currentUserId ? await users.findOne({ _id: currentUserId }) : null
    const currentScopeValue = currentUser ? scopeValueForUser(currentUser, scope)?.trim() : ''
    const filter = currentScopeValue ? { [scope]: currentScopeValue } : {}
    const rows = await users
      .find(filter)
      .sort({ impactScore: -1, plantedTreesCount: -1, createdAt: 1 })
      .limit(100)
      .toArray()
    const allRankedRows = await users
      .find(filter)
      .sort({ impactScore: -1, plantedTreesCount: -1, createdAt: 1 })
      .toArray()
    const myIndex = currentUserId ? allRankedRows.findIndex((user) => user._id === currentUserId) : -1

    const toLeaderRow = (user: UserDocument, index: number) => ({
      id: user._id,
      rank: index + 1,
      name: user.name,
      place: placeForUser(user, scope),
      score: user.impactScore,
      trees: user.plantedTreesCount,
      bio: user.bio,
      impact: user.impactScore,
      joined: user.createdAt.toISOString().slice(0, 10),
      isMe: user._id === currentUserId,
    })

    response.json({
      scope,
      rows: rows.map(toLeaderRow),
      myRank: myIndex >= 0 ? myIndex + 1 : undefined,
      myRow: myIndex >= 0 ? toLeaderRow(allRankedRows[myIndex], myIndex) : undefined,
    })
  } catch (error) {
    next(error)
  }
})

router.get('/profile/me', async (request, response, next) => {
  try {
    const userId = requireUser(request, response)
    if (!userId) return

    const users = await collection<UserDocument>('users')
    const badges = await collection<BadgeDocument>('badges')
    const plantings = await collection<PlantingDocument>('plantings')
    const user = await users.findOne({ _id: userId })

    if (!user) {
      response.status(404).json({ message: 'Profile not found' })
      return
    }

    const userBadgeIds = user.badges ?? []
    const badgeRows = await badges.find({ _id: { $in: userBadgeIds } }).toArray()
    const plantingRows = await plantings
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray()
    const total = await plantings.countDocuments({ userId })
    const verified = await plantings.countDocuments({ userId, status: 'VERIFIED' })
    const verificationRate = total > 0 ? Math.round((verified / total) * 100) : 0

    response.json({
      profile: {
        id: user._id,
        name: user.name,
        place: placeForUser(user),
        followers: user.followersCount,
        following: user.followingCount,
        plantedTrees: user.plantedTreesCount,
        donatedTrees: user.donatedTreesCount,
        impact: user.impactScore,
        streak: user.streakDays,
        bio: user.bio,
        joined: user.createdAt.toISOString().slice(0, 10),
      },
      badges: badgeRows.map((badge) => ({
        id: badge._id,
        name: badge.name,
        desc: badge.description,
        level: badge.level,
      })),
      plantings: plantingRows.map((planting) => ({
        id: planting._id,
        date: planting.createdAt.toISOString().slice(0, 10),
        place: placeForUser(user),
        trees: planting.count,
        status: planting.status,
      })),
      verificationRate,
    })
  } catch (error) {
    next(error)
  }
})

export default router
