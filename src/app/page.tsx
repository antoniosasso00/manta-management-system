import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-node'

export default async function Home() {
  const session = await auth()
  
  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login')
  }
  
  // Redirect authenticated users to the main dashboard
  redirect('/dashboard')
}