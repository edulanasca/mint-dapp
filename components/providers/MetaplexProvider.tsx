import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {FC, PropsWithChildren, useMemo} from "react";
import { MetaplexContext } from './useMetaplex';
import {Metaplex, walletAdapterIdentity} from "@metaplex-foundation/js";

export const MetaplexProvider: FC<PropsWithChildren> = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const metaplex = useMemo(
    () => Metaplex.make(connection).use(walletAdapterIdentity(wallet)),
    [connection, wallet]
  );

  return (
    <MetaplexContext.Provider value={{ metaplex }}>
      {children}
    </MetaplexContext.Provider>
  )
}