import { Redirect } from 'expo-router';
import { useSession } from '@/store/session';
export default function Index() {
  const { user, hydrated } = useSession();
  if (!hydrated) return null;
  return <Redirect href={user ? '/(tabs)' : '/(auth)/login'} />;
}
