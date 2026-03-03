import { NextResponse } from 'next/server'
import { getDb } from '../../../utils/mongoDb'

// GET: List all referrals
export async function GET() {
  const db = await getDb()
  const referrals = await db.collection('referrals').find({}).toArray()
  return NextResponse.json(referrals)
}

// POST: Add a new referral
export async function POST(req) {
  const db = await getDb()
  const data = await req.json()
  // Basic validation
  if (!data.referralName || !data.type || !data.address || !data.customerName || !data.amount || !data.status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const result = await db.collection('referrals').insertOne({
    ...data,
    notes: data.notes || ''
  })
  return NextResponse.json({ insertedId: result.insertedId })
}

// PATCH: Amend a referral (by _id)
export async function PATCH(req) {
  const db = await getDb()
  const data = await req.json()
  if (!data._id) {
    return NextResponse.json({ error: 'Missing referral _id' }, { status: 400 })
  }
  const { _id, ...updateFields } = data
  const result = await db.collection('referrals').updateOne(
    { _id: typeof _id === 'string' ? new (await import('mongodb')).ObjectId(_id) : _id },
    { $set: updateFields }
  )
  return NextResponse.json({ modifiedCount: result.modifiedCount })
}
