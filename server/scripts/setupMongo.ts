import { closeMongo, ensureMongoIndexes } from '../src/mongo.js'

await ensureMongoIndexes()
await closeMongo()
console.log('MongoDB indexes are ready.')
