import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const filePath = path.join(process.cwd(), "public", "global-status.json")

export async function GET() {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8")
      return NextResponse.json(JSON.parse(data))
    }
    return NextResponse.json({ timestamp: 0 })
  } catch (error) {
    return NextResponse.json({ timestamp: 0 })
  }
}

export async function POST() {
  try {
    const timestamp = Date.now()
    fs.writeFileSync(filePath, JSON.stringify({ timestamp }))
    return NextResponse.json({ success: true, timestamp })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 })
  }
}
