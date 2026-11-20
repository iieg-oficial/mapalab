import { useSyncExternalStore } from 'react';
import { cifrasBarraStore } from '@pages/maps/helpers/cifrasBarraStore';

export const useCifrasBarra = () => useSyncExternalStore(cifrasBarraStore.subscribe, cifrasBarraStore.get);
