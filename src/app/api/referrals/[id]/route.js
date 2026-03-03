import { NextResponse } from 'next/server'
import { getDb } from '../../../../utils/mongoDb'
import { ObjectId } from 'mongodb'

// GET: Get referral by id
export async function GET(req, { params }) {
  const db = await getDb()
  const referral = await db.collection('referrals').findOne({ _id: new ObjectId(params.id) })
  if (!referral) {
    return NextResponse.json({ error: 'Referral not found' }, { status: 404 })
  }
  return NextResponse.json(referral)
}

// PATCH: Update referral by id
export async function PATCH(req, { params }) {
  const db = await getDb()
  const updateFields = await req.json()
  const now = new Date()
  const result = await db.collection('referrals').updateOne(
    { _id: new ObjectId(params.id) },
    { $set: { ...updateFields, updatedAt: now } }
  )
  return NextResponse.json({ modifiedCount: result.modifiedCount })
}

// DELETE: Remove referral by id
export async function DELETE(req, { params }) {
  const db = await getDb()
  const result = await db.collection('referrals').deleteOne({ _id: new ObjectId(params.id) })
  return NextResponse.json({ deletedCount: result.deletedCount })
}
