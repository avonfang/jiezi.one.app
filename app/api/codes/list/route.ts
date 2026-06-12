import { listCodes } from '@/lib/codes';

export async function GET() {
  try {
    const codes = await listCodes();
    return Response.json({ codes });
  } catch {
    return Response.json({ codes: [] });
  }
}
