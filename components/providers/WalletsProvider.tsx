import {FC, PropsWithChildren} from "react";
import {ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react";
import {WalletModalProvider} from "@solana/wallet-adapter-react-ui";
import {SlopeWalletAdapter, SolflareWalletAdapter} from "@solana/wallet-adapter-wallets";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

const WalletsProvider: FC<PropsWithChildren> = ({ children }) => {
  const endpoint = import.meta.env.VITE_SOLANA_RPC_HOST;
  const wallets = [
    new SolflareWalletAdapter({ network: import.meta.env.MODE === "development" ?
        WalletAdapterNetwork.Devnet : WalletAdapterNetwork.Mainnet }),
    new SlopeWalletAdapter()
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default WalletsProvider;