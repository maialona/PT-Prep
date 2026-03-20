import { prisma } from "@/lib/db";

// GET — get single image with full data
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const image = await prisma.image.findUnique({ where: { id } });

  if (!image) {
    return Response.json({ error: "Image not found" }, { status: 404 });
  }

  return Response.json(image);
}

// DELETE — delete image
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.image.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Image not found" }, { status: 404 });
  }
}
