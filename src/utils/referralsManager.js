import { ObjectId } from 'mongodb'
import { getDb } from './mongoDb'

export async function getAllReferrals() {
  const db = await getDb()
  return db.collection('referrals').find({}).toArray()
}

export async function addReferral(data) {
  const db = await getDb()
  return db.collection('referrals').insertOne({
    ...data,
    notes: data.notes || ''
  })
}

export async function updateReferral(_id, updateFields) {
  const db = await getDb()
  return db.collection('referrals').updateOne(
    { _id: typeof _id === 'string' ? new ObjectId(_id) : _id },
    { $set: updateFields }
  )
}
