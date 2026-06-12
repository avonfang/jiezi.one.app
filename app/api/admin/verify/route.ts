export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const valid = process.env.ADMIN_PASSWORD || 'jiezi123';
    if (password === valid) {
      return Response.json({ success: true });
    }
    return Response.json({ success: false }, { status: 401 });
  } catch {
    return Response.json({ success: false }, { status: 400 });
  }
}
