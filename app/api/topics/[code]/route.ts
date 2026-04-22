import { getTopicSlugsForCourse } from '@/lib/content'

export async function GET(_request: Request, { params }: { params: { code: string } }) {
  const slugs = getTopicSlugsForCourse(params.code)
  return Response.json({ slugs })
}
