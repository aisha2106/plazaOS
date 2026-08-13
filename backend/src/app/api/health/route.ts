import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { dbConnect } from '@/lib/db'

// Unauthenticated, no CORS/withErrorHandling wrapper — meant for a process
// manager/load balancer (e.g. Railway) to poll, not the browser app.
export async function GET() {
  try {
    await dbConnect()
    const dbOk = mongoose.connection.readyState === 1
    return NextResponse.json({ status: dbOk ? 'ok' : 'degraded', db: dbOk ? 'connected' : 'disconnected' }, { status: dbOk ? 200 : 503 })
  } catch {
    return NextResponse.json({ status: 'degraded', db: 'disconnected' }, { status: 503 })
  }
}
