import { useColorScheme } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useSession } from '@/store/session';
import type { Preferences } from '@/types';

const light = {
  background: '#F8F9FD',
  surface: '#FFFFFF',
  ink: '#202138',
  muted: '#62657D',
  primary: '#7366F0',
  primaryInk: '#FFFFFF',
  soft: '#F0EDFF',
  border: '#EAEAF2',
  danger: '#B93D53',
  success: '#167D64',
  indigo: '#393276',
};
const dark: typeof light = {
  background: '#131425',
  surface: '#202139',
  ink: '#F4F2FF',
  muted: '#B3B4CB',
  primary: '#A99BFF',
  primaryInk: '#24203F',
  soft: '#302A50',
  border: '#36374E',
  danger: '#FF97A5',
  success: '#75D8B8',
  indigo: '#393276',
};

export function usePreferences() {
  const user = useSession((state) => state.user);
  return useQuery({
    queryKey: ['preferences', user?.id],
    queryFn: () => api<Preferences>('/users/me/preferences'),
    enabled: !!user,
  });
}

export function useTheme() {
  const system = useColorScheme();
  const { data } = usePreferences();
  const isDark =
    data?.theme === 'DARK' || (data?.theme !== 'LIGHT' && system === 'dark');
  return { ...(isDark ? dark : light), isDark };
}
