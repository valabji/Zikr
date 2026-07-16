import { createContext, useContext } from 'react';

export const NavModeContext = createContext({ navMode: 'drawer', setNavMode: () => {} });
export const useNavMode = () => useContext(NavModeContext);
