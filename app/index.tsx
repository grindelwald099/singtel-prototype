import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page on app start
    router.replace('/login');
  }, []);

  return null;
}