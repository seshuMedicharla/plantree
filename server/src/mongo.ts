import { MongoClient, type Collection, type Document, type Db } from 'mongodb'
import { config } from './config.js'
import type { BadgeDocument } from './models.js'

let client: MongoClient | null = null
let database: Db | null = null

export async function getMongoDb() {
  if (!config.mongoUri) {
    throw new Error('MONGODB_URI is required')
  }

  if (!client || !database) {
    const nextClient = new MongoClient(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    })

    try {
      await nextClient.connect()
      client = nextClient
      database = nextClient.db(config.mongoDbName)
    } catch (error) {
      await nextClient.close().catch(() => undefined)
      client = null
      database = null
      throw error
    }
  }

  return database as Db
}

export async function collection<T extends Document>(name: string): Promise<Collection<T>> {
  const db = await getMongoDb()
  return db.collection<T>(name)
}

export async function ensureMongoIndexes() {
  const db = await getMongoDb()

  await db.collection('users').dropIndex('phone_1').catch(() => undefined)

  await Promise.all([
    db.collection('users').createIndex({ username: 1 }, { unique: true }),
    db.collection('users').createIndex({ email: 1 }),
    db.collection('users').createIndex({ role: 1 }),
    db.collection('users').createIndex({ village: 1, impactScore: -1 }),
    db.collection('users').createIndex({ mandal: 1, impactScore: -1 }),
    db.collection('users').createIndex({ district: 1, impactScore: -1 }),
    db.collection('plantings').createIndex({ location: '2dsphere' }),
    db.collection('plantings').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('plantings').createIndex({ status: 1, createdAt: -1 }),
    db.collection('posts').createIndex({ createdAt: -1 }),
    db.collection('posts').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('comments').createIndex({ postId: 1, createdAt: -1 }),
    db.collection('comments').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('notifications').createIndex({ userId: 1, read: 1, createdAt: -1 }),
    db.collection('conversations').createIndex({ participantIds: 1, updatedAt: -1 }),
    db.collection('conversations').createIndex({ kind: 1, updatedAt: -1 }),
    db.collection('messages').createIndex({ conversationId: 1, createdAt: -1 }),
    db.collection('messages').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('zones').createIndex({ name: 1 }),
    db.collection('badges').createIndex({ ruleKey: 1 }, { unique: true }),
  ])

  await db.collection<BadgeDocument>('badges').updateOne(
    { _id: 'badge-first-tree' },
    {
      $setOnInsert: {
        _id: 'badge-first-tree',
        name: 'First Tree',
        description: 'Submitted your first planting proof.',
        level: 'Bronze',
        ruleKey: 'first_verified_tree',
        createdAt: new Date(),
      },
    },
    { upsert: true }
  )
}

export async function closeMongo() {
  await client?.close()
  client = null
  database = null
}
