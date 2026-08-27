import { MOBILE_MEDIA_QUERY } from '@constants/sider';
import { useMediaQuery } from '@hooks/useMediaQuery';

export const useIsMobile = () => useMediaQuery(MOBILE_MEDIA_QUERY);
