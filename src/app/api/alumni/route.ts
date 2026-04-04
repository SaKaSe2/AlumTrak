import { NextResponse } from "next/server";
import { getAlumniList, addAlumni } from "@/lib/db";

export async function GET() {
  const list = await getAlumniList();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newAlumni = await addAlumni(body);
    return NextResponse.json(newAlumni, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add alumni" }, { status: 500 });
  }
}
