import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import {CandyMachine, getMerkleRoot, keypairIdentity, Metaplex} from '@metaplex-foundation/js';
import AllowList from "./allowList.js";
import {clusterApiUrl, Connection, Keypair} from "@solana/web3.js";
import {CANDY_MACHINE} from "./candyMachine.js";

switch (process.argv[2]) {
  case "merkle":
    console.log(Array.from(getMerkleRoot(AllowList)).map((b) => b.toString(16).padStart(2, "0")).join(""));
    break;
  case "freeze":
    const freezeRoute = (group: string, metaplex: Metaplex, candyMachine: CandyMachine) =>
      metaplex.candyMachines().callGuardRoute({
        candyMachine: { ...candyMachine },
        guard: 'freezeSolPayment',
        group,
        settings: {
          path: 'initialize',
          period: 5 * 60 * 60, // 5 hours.
          candyGuardAuthority: metaplex.identity(),
        }
      });

    (async () => {
      const metaplex = Metaplex.make(new Connection(clusterApiUrl('devnet')))
        .use(keypairIdentity(Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.AUTHORITY as string)))));
      try {
        const candyMachine = await metaplex.candyMachines().findByAddress({ address: CANDY_MACHINE });
        console.log('Initialize the Freeze Escrow account');
        //await freezeRoute('wl', metaplex, candyMachine);
        await freezeRoute('public', metaplex, candyMachine);
      } catch (err) {
        console.log(err);
      }
    })();
    break;
  default:
    console.log("Invalid command.");
}

//process.exit(0);