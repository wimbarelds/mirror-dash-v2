import { createContext, useContext } from 'react';

/**
 * Ways to show how much precipitation is expected, next to the dotted line that shows the chance.
 * The mirror uses the default; the replay page can switch between them to compare.
 */
export type AmountStyle = 'none' | 'caps' | 'line';

export const AmountStyleContext = createContext<AmountStyle>('none');

export const useAmountStyle = () => useContext(AmountStyleContext);
