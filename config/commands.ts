import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import * as path from "path";
import {type CandyMachine, getMerkleRoot, keypairIdentity, Metaplex, toPublicKey} from '@metaplex-foundation/js';
import AllowList from "./allowList.js";
import {clusterApiUrl, Connection, Keypair} from "@solana/web3.js";
import {CANDY_CREATOR, CANDY_MACHINE, RAFFLE_CREATOR} from "./candyMachine.js";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";
import projectInfo from "./projectInfo.js";
import {TokenStandard} from "@metaplex-foundation/mpl-token-metadata";
import util from "util";
import {exec as ex} from "child_process";
import allowList from "./allowList.js";

const exec = util.promisify(ex);

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

dayjs.extend(duration);

type Holder = { owner_wallet: string, mint_account: string, metadata_account: string, associated_token_address: string };
const metaplex = Metaplex.make(new Connection(clusterApiUrl('devnet')))
  .use(keypairIdentity(Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.AUTHORITY as string)))));
const getHolders = async (path: string) => (await import(path, { assert: { type: "json" } })).default as Holder[];
const snapshotHolders = async (creator: string) => {
  try {
    const cmd = await exec(`metaboss snapshot holders --creator ${creator} -p 0 --output ${path.resolve(process.cwd(), 'raffle')}`);
    console.log(`Command output: ${cmd.stdout}`);
  } catch (err) {
    console.error(err);
  }
}

switch (process.argv[2]) {
  case "merkle":
    console.log(Array.from(getMerkleRoot(AllowList)).map((b) => b.toString(16).padStart(2, "0")).join(""));
    break;
  case "freeze":
    const hours = process.argv[3] ? parseInt(process.argv[3]) : 5;
    const freezeRoute = (group: string, metaplex: Metaplex, candyMachine: CandyMachine) =>
      metaplex.candyMachines().callGuardRoute({
        candyMachine: { ...candyMachine },
        guard: 'freezeSolPayment',
        group,
        settings: {
          path: 'initialize',
          period: hours * 60 * 60,
          candyGuardAuthority: metaplex.identity(),
        }
      });

    (async () => {
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
  case "raffle":
    /*
    This will mint all nfts left and unfreeze all the collection. Then it will transfer the NFTs to the winners
    and finally will unlock the funds to the destination address.
     */
    const selectRaffleWinnersAndAirdropNfts = async () => {
      await snapshotHolders(RAFFLE_CREATOR.toBase58());

      try {
        const holders = await getHolders(path.resolve(process.cwd(), 'raffle', `${RAFFLE_CREATOR.toBase58()}_holders.json`));
        const mint = await metaplex.candyMachines().findByAddress({ address: CANDY_MACHINE });
        const mintsLeft = mint.itemsAvailable.toNumber() * ((100 - projectInfo.raffle.afterNMints) / 100);

        const nfts = [];
        for (let i = 0; i < mintsLeft; i++) {
          nfts.push(await metaplex.candyMachines().mint({
            candyMachine: { ...mint },
            collectionUpdateAuthority: mint.authorityAddress,
            group: "public"
          }, { commitment: "confirmed" }));
          console.log('Minted ', i + 1);
        }

        await unfreezeMint(mint);

        for (let i = 0; i < mintsLeft; i++) {
          const winnerIx = Math.floor(Math.random() * holders.length);
          const winner = holders[winnerIx];
          console.log('Selected winner ', winner.owner_wallet, ' transferring mint');

          await metaplex.nfts().transfer({
            nftOrSft: { address: nfts[i].nft.address, tokenStandard: TokenStandard.NonFungible },
            toOwner: toPublicKey(winner.owner_wallet)
          });

          console.log('Transferred', nfts[i].nft.mint);
        }

        await unlockFunds(mint);
      } catch (err) {
        console.log('An error occurred', err);
      }
    }

    const unfreezeMint = async (mint: CandyMachine) => {
      await snapshotHolders(CANDY_CREATOR.toBase58());
      const holders = await getHolders(path.resolve(process.cwd(), 'raffle', `${CANDY_CREATOR.toBase58()}_holders.json`));

      try {
        console.log("Unfreezing collection...");
        await Promise.all(
          holders.map(holder => (
            metaplex.candyMachines().callGuardRoute({
              candyMachine: { ...mint },
              guard: "freezeSolPayment",
              group: allowList.includes(holder.owner_wallet) ? "wl" : "public",
              settings: {
                path: "thaw",
                nftMint: toPublicKey(holder.mint_account),
                nftOwner: toPublicKey(holder.owner_wallet)
              }
            })
          ))
        );

        console.log('Done.');
      } catch (err) {
        console.log(err);
      }
    }

    const unlockFunds = async (mint: CandyMachine) => {
      try {
        console.log("Unlocking funds...");
        await metaplex.candyMachines().callGuardRoute({
          candyMachine: { ...mint },
          guard: "freezeSolPayment",
          group: "wl",
          settings: {
            path: "unlockFunds",
            candyGuardAuthority: metaplex.identity(),
          }
        });
        console.log('Funds unlocked.')
      } catch (err) {
        console.log(err);
      }
    }

    const currentTime = dayjs();
    const diffTime = dayjs(projectInfo.raffle.endDate).unix() - currentTime.unix();

    setTimeout(async () => {
      await selectRaffleWinnersAndAirdropNfts();
    }, dayjs.duration(diffTime * 1000, "milliseconds").asMilliseconds());
    break;
  default:
    console.log("Invalid command.");
}
