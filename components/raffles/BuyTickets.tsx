import {
  Button,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text, useToast
} from "@chakra-ui/react";
import {FC, useState} from "react";
import type {CandyMachine} from "@metaplex-foundation/js";
import {useMetaplex} from "../providers/useMetaplex";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {Keypair, Signer, Transaction} from "@solana/web3.js";
import {handleError} from "../utils";

interface BuyTicketsProps {
  isOpen: boolean,
  onClose: () => void,
  price: number,
  raffleCM: CandyMachine
}

const BuyTickets: FC<BuyTicketsProps> = ({ isOpen, onClose, raffleCM }) => {
  const { metaplex } = useMetaplex();
  const { connection } = useConnection();
  const [nOfNfts, setNOfNfts] = useState(1);
  const [buyingTickets, setBuyingTickets] = useState(false);
  const wallet = useWallet();
  const toast = useToast();

  const mintNNftsHandler: (valueAsString: string, valueAsNumber: number) => void = (_, valueAsNumber) => {
    setNOfNfts(valueAsNumber);
  }

  const buyTicketsHandler = async () => {
    setBuyingTickets(true);
    const txsInfo: { tx: Transaction, signer: Signer }[] = []

    for (let i = 0; i < nOfNfts; i++) {
      try {
        const mint = new Keypair();
        let mintTx = (await metaplex?.candyMachines().builders().mint({
          candyMachine: { ...raffleCM },
          collectionUpdateAuthority: raffleCM.authorityAddress,
          mint,
          guards: undefined,
        }));

        if (mintTx != undefined) {
          const blockhash = await connection.getLatestBlockhash();
          txsInfo.push({ tx: mintTx.toTransaction(blockhash), signer: mint });
        }
      } catch (err) {
        handleError("Error while minting", err, toast);
        setBuyingTickets(false);
      }
    }

    if (txsInfo.length !== 0 && wallet.signAllTransactions) {
      const signedTxs = await wallet.signAllTransactions(txsInfo.map(it => {
        it.tx.sign(it.signer);
        return it.tx;
      }));

      signedTxs.forEach(tx => {
        try {
          connection.sendRawTransaction(tx.serialize())
            .then(res => console.log(res))
            .catch(err => handleError("Error while sending Tx", err, toast))
            .finally(() => setBuyingTickets(false))
        } catch (err) {
          handleError("Error while sending Tx", err, toast);
          setBuyingTickets(false);
        }
      });
    }

    setBuyingTickets(false);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay/>
      <ModalContent>
        <ModalHeader>Raffle Tickets</ModalHeader>
        <ModalCloseButton/>
        <ModalBody>
          <Text>By entering this raffle you get the chance to win one or more NFT's on a single wallet.</Text>
          <Text>The tickets you don't win will be refunded to you once the raffle ends.</Text>
          <Text>How many tickets you want to buy?</Text>

          <FormControl>
            <NumberInput defaultValue={1} min={1} max={20000} onChange={mintNNftsHandler}>
              <NumberInputField/>
              <NumberInputStepper>
                <NumberIncrementStepper/>
                <NumberDecrementStepper/>
              </NumberInputStepper>
            </NumberInput>
            <FormLabel>
              {`Price ${(raffleCM?.candyGuard?.guards?.solPayment?.amount.basisPoints.toNumber() ?? 0) / (10 ** 9)} SOL`}
            </FormLabel>
          </FormControl>

        </ModalBody>
        <ModalFooter>
          <Button onClick={buyTicketsHandler} isLoading={buyingTickets}>Buy Tickets</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default BuyTickets;