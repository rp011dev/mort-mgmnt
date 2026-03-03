import { NextResponse } from 'next/server'
import { getDb } from '../../../utils/mongoDb'

// GET: List all referrals
export async function GET(req) {
  const db = await getDb()
  const { searchParams } = new URL(req.url)
  const query = {}

  // Search fields (partial match, case-insensitive)
  const searchText = searchParams.get('search')?.trim()
  if (searchText) {
    query['$or'] = [
      { referralName: { $regex: searchText, $options: 'i' } },
      { address: { $regex: searchText, $options: 'i' } },
      { customerName: { $regex: searchText, $options: 'i' } }
    ]
  }

  // Filters (exact match)
  const type = searchParams.get('type')
  if (type) query.type = type
  const feeStatus = searchParams.get('feeStatus')
  if (feeStatus) query.feeStatus = feeStatus
  const status = searchParams.get('status')
  if (status) query.status = status

  // Pagination
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
  const skip = (page - 1) * pageSize

  const total = await db.collection('referrals').countDocuments(query)
  const referrals = await db.collection('referrals')
    .find(query)
    .skip(skip)
    .limit(pageSize)
    .toArray()
  return NextResponse.json({ data: referrals, total, page, pageSize })
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
