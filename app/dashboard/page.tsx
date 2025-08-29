import { DashboardContainer } from '@/components/dashboard/DashboardContainer'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  // 서버 컴포넌트에서 인증 확인
  const cookieStore = await cookies()
  const supabase = await createServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/auth/login')
  }
  
  // TODO: 실제 팀 ID 가져오기
  // 현재는 임시로 하드코딩된 값 사용
  const teamId = 'default-team-id'
  
  return <DashboardContainer teamId={teamId} />
}
