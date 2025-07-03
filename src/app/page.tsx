import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()
  
  // Redirect to dashboard if authenticated
  if (session?.user) {
    redirect('/dashboard')
  }
  
  // Redirect to login if not authenticated
  redirect('/auth/login')
}