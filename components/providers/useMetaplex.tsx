import { createContext, useContext } from 'react';
import type {Metaplex} from "@metaplex-foundation/js";

const DEFAULT_CONTEXT: { metaplex: null | Metaplex } = {
  metaplex: null,
};

export const MetaplexContext = createContext(DEFAULT_CONTEXT);

export function useMetaplex() {
  return useContext(MetaplexContext);
}