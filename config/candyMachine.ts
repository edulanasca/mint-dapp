import {PublicKey} from "@solana/web3.js";
import candyMachine from "../nfts/cache.json" assert {type: "json"};
import raffleCM from "../raffle/cache.json" assert {type: "json"};

export const CANDY_MACHINE = new PublicKey(candyMachine.program.candyMachine);
export const CANDY_CREATOR = new PublicKey(candyMachine.program.candyMachineCreator);
export const CANDY_GUARD = new PublicKey(candyMachine.program.candyGuard);
export const RAFFLE_CM = new PublicKey(raffleCM.program.candyMachine);
export const RAFFLE_CREATOR = new PublicKey(raffleCM.program.candyMachineCreator);