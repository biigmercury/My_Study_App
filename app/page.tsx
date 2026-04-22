import HomeClient from '@/components/HomeClient'
import { COURSES } from '@/lib/courses'

export default function HomePage() {
  return <HomeClient courses={COURSES} />
}
