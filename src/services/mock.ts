import type { Badge, LeaderRow, PlantingItem, Reel, Zone } from './types'

export const me = {
  name: 'Seshu',
  place: 'Chennai, Tamil Nadu',
  followers: 18,
  following: 12,
  plantedTrees: 42,
  donatedTrees: 15,
  impact: 860,
  streak: 6,
}

export const reels: Reel[] = [
  {
    id: 'r1',
    user: { name: 'Seshu', place: 'Vizag' },
    caption: 'Planted native saplings near the school boundary today.',
    likes: 214,
    comments: 36,
    trees: 12,
    zoneTag: 'NEGATIVE',
  },
  {
    id: 'r2',
    user: { name: 'Priya', place: 'Kakinada' },
    caption: 'Weekend drive: cleaned plot and added compost around new trees.',
    likes: 178,
    comments: 19,
    trees: 8,
    zoneTag: 'NORMAL',
  },
  {
    id: 'r3',
    user: { name: 'Rahul', place: 'Rajahmundry' },
    caption: 'Tree guards installed in a high-risk roadside patch.',
    likes: 256,
    comments: 41,
    trees: 15,
    zoneTag: 'NEGATIVE',
  },
]

export const badges: Badge[] = [
  { id: 'b1', name: 'First Roots', desc: 'Completed your first verified plantation.', level: 'Bronze' },
  { id: 'b2', name: 'Soil Saver', desc: 'Contributed in two negative impact zones.', level: 'Silver' },
  { id: 'b3', name: 'Eco Mentor', desc: 'Helped five members complete their first activity.', level: 'Gold' },
  { id: 'b4', name: 'Canopy Legend', desc: 'Top contributor for the monthly city challenge.', level: 'Platinum' },
]

export const leadersVillage: LeaderRow[] = [
  {
    rank: 1,
    name: 'Ravi',
    place: 'Perumbakkam',
    score: 1450,
    trees: 80,
    bio: 'Community tree planter and eco volunteer.',
    impact: 1200,
    joined: '2023',
  },
  {
    rank: 2,
    name: 'Seshu',
    place: 'Sholinganallur',
    score: 1320,
    trees: 74,
    bio: 'Neighborhood planting lead and youth mentor.',
    impact: 1080,
    joined: '2022',
  },
  {
    rank: 3,
    name: 'Anu',
    place: 'Medavakkam',
    score: 1210,
    trees: 63,
    bio: 'Weekend volunteer focused on school green drives.',
    impact: 960,
    joined: '2024',
  },
]

export const leadersCity: LeaderRow[] = [
  {
    rank: 1,
    name: 'Niharika',
    place: 'Chennai City',
    score: 1760,
    trees: 69,
    bio: 'Urban forestry advocate and city campaign organizer.',
    impact: 1490,
    joined: '2021',
  },
  {
    rank: 2,
    name: 'Seshu',
    place: 'Chennai City',
    score: 1685,
    trees: 64,
    bio: 'Grassroots tree planter with verified zone contributions.',
    impact: 1410,
    joined: '2022',
  },
  {
    rank: 3,
    name: 'Tarun',
    place: 'Chennai City',
    score: 1622,
    trees: 58,
    bio: 'Coordinates roadside plantation and maintenance teams.',
    impact: 1335,
    joined: '2023',
  },
]

export const zones: Zone[] = [
  { id: 'z1', name: 'Old Dump Yard Edge', type: 'NEGATIVE', multiplier: 1.8 },
  { id: 'z2', name: 'Highway Median Stretch', type: 'NEGATIVE', multiplier: 1.5 },
  { id: 'z3', name: 'Community Park Belt', type: 'NORMAL', multiplier: 1.0 },
]

export const topVillage = [
  { rank: 1, name: 'Ravi', trees: 120 },
  { rank: 2, name: 'Seshu', trees: 90 },
  { rank: 3, name: 'Anu', trees: 70 },
]

export const topMandal = [
  { rank: 1, name: 'Karthik', trees: 340 },
  { rank: 2, name: 'Meena', trees: 280 },
  { rank: 3, name: 'Arjun', trees: 210 },
]

export const topDistrict = [
  { rank: 1, name: 'Suresh', trees: 510 },
  { rank: 2, name: 'Divya', trees: 460 },
  { rank: 3, name: 'Rohit', trees: 410 },
]

export const topState = [
  { rank: 1, name: 'Harish', trees: 1200 },
  { rank: 2, name: 'Nisha', trees: 1100 },
  { rank: 3, name: 'Kiran', trees: 1020 },
]

export const chats = [
  { name: 'Village Green Group', message: 'Planting event tomorrow', time: '10:45' },
  { name: 'Ravi', message: 'Great work planting trees!', time: '09:12' },
  { name: 'District Volunteers', message: 'Need help for plantation drive', time: 'Yesterday' },
]

export const myPlantings: PlantingItem[] = [
  {
    id: 'p1',
    date: '2026-02-18',
    place: 'Old Dump Yard Edge',
    trees: 6,
    status: 'VERIFIED',
  },
  {
    id: 'p2',
    date: '2026-02-20',
    place: 'Highway Median Stretch',
    trees: 4,
    status: 'PENDING',
  },
  {
    id: 'p3',
    date: '2026-02-22',
    place: 'Community Park Belt',
    trees: 3,
    status: 'REJECTED',
  },
]

export const verificationRate = 74
