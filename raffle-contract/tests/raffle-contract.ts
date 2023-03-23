import * as dotenv from "dotenv";

dotenv.config();
import * as anchor from "@project-serum/anchor";
import {Program} from "@project-serum/anchor";
import {RaffleContract} from "../target/types/raffle_contract";
import {
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAccount,
  getAssociatedTokenAddress,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";

function getProceedsPDA(rafflePDA: anchor.Address, program: anchor.Program<RaffleContract>) {
  return anchor.web3.PublicKey.findProgramAddressSync([
    anchor.utils.bytes.utf8.encode("proceeds"),
    new anchor.web3.PublicKey(rafflePDA).toBuffer()
  ], program.programId);
}

function getRafflePDA(entrants: anchor.Address, program: anchor.Program<RaffleContract>) {
  return anchor.web3.PublicKey.findProgramAddressSync([
    anchor.utils.bytes.utf8.encode("raffle"),
    new anchor.web3.PublicKey(entrants).toBuffer()
  ], program.programId)
}

async function createRaffle(
  program: anchor.Program<RaffleContract>,
  provider: anchor.web3.Keypair,
  max_entrants: number,
  end_raffle: number,
  entrants: anchor.web3.Keypair,
  token_mint: anchor.web3.PublicKey,
  ticket_price: number
) {
  const entrants_space = 8 + 4 + 4 + 32 * 600;

  const [rafflePDA] = getRafflePDA(entrants.publicKey, program);
  const [proceedsPDA] = getProceedsPDA(rafflePDA, program);

  const tx = await program.methods
    .createRaffle(max_entrants, new anchor.BN(end_raffle), new anchor.BN(ticket_price * 10 ** 9))
    .accounts({
      raffle: rafflePDA,
      entrants: entrants.publicKey,
      proceeds: proceedsPDA,
      proceedsMint: token_mint,
      creator: program.provider.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY
    })
    .preInstructions([
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: program.provider.publicKey,
        newAccountPubkey: entrants.publicKey,
        lamports: await program.provider.connection.getMinimumBalanceForRentExemption(entrants_space),
        space: entrants_space,
        programId: program.programId
      })
    ])
    .signers([provider, entrants])
    .rpc();
  console.log("Your transaction signature", tx);
}

async function buyTickets(
  rafflePDA: string,
  program: anchor.Program<RaffleContract>,
  user: anchor.web3.PublicKey,
  entrants: string,
  ticketPrize: number,
  nTickets: number
) {
  const [proceedsPDA] = getProceedsPDA(rafflePDA, program);
  const proceedsAccount = await getAccount(program.provider.connection, proceedsPDA);
  const userAta = await getAssociatedTokenAddress(proceedsAccount.mint, user);

  const buyTickets = program.methods.buyTickets(nTickets)
    .accounts({
      raffle: rafflePDA,
      entrants,
      proceeds: proceedsPDA,
      buyerTokenAccount: userAta,
      buyer: program.provider.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID
    });

  if (proceedsAccount.mint.equals(NATIVE_MINT)) {
    try {
      await getAccount(program.provider.connection, userAta);
      buyTickets.preInstructions([
        anchor.web3.SystemProgram.transfer({
          fromPubkey: program.provider.publicKey!,
          toPubkey: userAta,
          lamports: ticketPrize * anchor.web3.LAMPORTS_PER_SOL * nTickets
        }),
        createSyncNativeInstruction(userAta, TOKEN_PROGRAM_ID)
      ])
    } catch (err) {
      buyTickets.preInstructions([
        createAssociatedTokenAccountInstruction(user, userAta, user, proceedsAccount.mint, TOKEN_PROGRAM_ID),
        anchor.web3.SystemProgram.transfer({
          fromPubkey: program.provider.publicKey!,
          toPubkey: userAta,
          lamports: ticketPrize * anchor.web3.LAMPORTS_PER_SOL
        }),
        createSyncNativeInstruction(userAta, TOKEN_PROGRAM_ID)
      ])
    }
  }

  return buyTickets.rpc();
}

describe("raffle-contract", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.RaffleContract as Program<RaffleContract>;
  const provider = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.PROVIDER)));

  const entrantsPDA = "1tVzCoWnaaTm3miqzPQ1zWEjjsu1SAKLBtfoWEPgxe1";
  const [rafflePDA] = getRafflePDA(entrantsPDA, program);

  it("Is initialized!", async () => {
    const entrants = new anchor.web3.Keypair();
    console.log(`Entrants: ${entrants.publicKey.toBase58()}`);
    try {
      await createRaffle(program, provider, 100, 1679535000, entrants, NATIVE_MINT, 0.01);
    } catch (err) {
      console.log(err);
    }
  });

  it("buy tickets", async () => {
    try {
      await buyTickets(rafflePDA.toBase58(), program, program.provider.publicKey, entrantsPDA, 0.01, 10);
    } catch (err) {
      console.log(err);
    }
  });

  it('entrants', async () => {
    const entrants = await program.account.entrants.fetch(entrantsPDA);
    console.log(
      entrants.ticketPrice,
      (entrants.entrants as anchor.web3.PublicKey[]).filter(it => !it.equals(anchor.web3.PublicKey.default)),
      (entrants.winners).filter(it => !it.equals(anchor.web3.PublicKey.default))
    );
  });

  it('raffle', async () => {
    (await program.account.raffle.all()).forEach(r => console.log(r.account.ticketPrice.toNumber()))
  });

  it.only("reveal winners", async () => {

    try {
      await program.methods.revealWinners().accounts({
        raffle: rafflePDA,
        entrants: entrantsPDA,
        recentBlockhashes: anchor.web3.SYSVAR_RECENT_BLOCKHASHES_PUBKEY
      }).rpc();
    } catch (err) {
      console.log(err);
    }
  });
});
