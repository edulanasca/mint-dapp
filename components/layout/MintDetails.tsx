import {Button, Card, CardBody, CardFooter, Heading, HStack, Progress, Spacer, Text, VStack} from "@chakra-ui/react";
import SocialNetworks from "./SocialNetworks";
import {useMetaplex} from "../providers/useMetaplex";
import {useWallet} from "@solana/wallet-adapter-react";
import {useEffect, useState} from "react";
import {CANDY_GUARD, CANDY_MACHINE} from "../../config/candyMachine";
import type {CandyMachine, DefaultCandyGuardSettings} from "@metaplex-foundation/js";
import allowList from "../../config/allowList";
import {getMerkleProof} from "@metaplex-foundation/js";
import Raffle from "../raffles/Raffle";
import {Transaction} from "@solana/web3.js";

const MintDetails = () => {
  const { metaplex } = useMetaplex();
  const wallet = useWallet();
  const [disableMint, setDisableMint] = useState(true);
  const [candyMachine, setCandyMachine] = useState<CandyMachine | undefined>(undefined);
  const [percentage, setPercentage] = useState(0);

  const isWl = () => allowList.includes(wallet.publicKey!.toBase58());
  const getGuard = (candy: CandyMachine): DefaultCandyGuardSettings | undefined => {
    return candy.candyGuard?.groups.find(it => it.label === (isWl() ? "wl" : "public"))?.guards;
  }

  useEffect(() => {
    metaplex?.connection.onAccountChange(CANDY_MACHINE, async () => {
      setCandyMachine(await metaplex.candyMachines().findByAddress({ address: CANDY_MACHINE }))
    })
  }, []);

  useEffect(() => {
    if (candyMachine) {
      setPercentage((candyMachine.itemsMinted.toNumber() / candyMachine.itemsAvailable.toNumber()) * 100);
    }
  }, [candyMachine?.itemsMinted, candyMachine?.itemsAvailable]);

  useEffect(() => {
    if (wallet.publicKey !== null && candyMachine == undefined) {
      checkEligibility()
        .then((candy) => addListener(candy).then())
        .catch(err => console.error(err));
    }
  }, [metaplex, wallet.publicKey]);

  // read candy machine data to get the candy guards address
  async function checkEligibility() {
    if (!wallet.connected || metaplex == null) {
      setDisableMint(true);
      return;
    }

    let candy = await metaplex
      .candyMachines()
      .findByAddress({ address: CANDY_MACHINE });

    // read candy machine state from chain
    setCandyMachine(candy);

    // enough items available?
    if (candy && candy.itemsMinted.sub(candy.itemsAvailable).gtn(0)) {
      console.error("not enough items available");
      setDisableMint(true);
      return;
    }

    const guard = getGuard(candy)
    const slot = await metaplex.connection.getSlot();
    const solanaTime = await metaplex.connection.getBlockTime(slot);
    if (guard?.startDate != null && solanaTime != null) {
      if (solanaTime < guard.startDate.date.toNumber()) {
        console.error("startDate: CM not live yet");
        setDisableMint(true);
        return;
      }
    }

    if (guard?.endDate != null && solanaTime != null) {
      if (solanaTime > guard.endDate.date.toNumber()) {
        console.error("endDate: CM not live anymore");
        setDisableMint(true);
        return;
      }
    }

    if (guard?.allowList != null) {
      try {
        await metaplex.candyMachines().callGuardRoute({
          candyMachine: { address: candy.address, candyGuard: candy.candyGuard },
          guard: "allowList",
          group: "wl",
          settings: {
            path: "proof",
            merkleProof: getMerkleProof(allowList, wallet.publicKey!.toBase58())
          }
        });
      } catch (err) {
        console.error(err);
        setDisableMint(true);
        return;
      }
    }

    setDisableMint(false);
    return candy;
  }

  // Add listeners to refresh CM data to reevaluate if minting is allowed after the candy guard updates or startDate is reached
  async function addListener(candy?: CandyMachine) {
    if (metaplex == null) return;
    if (candy == null) {
      candy = await metaplex
        .candyMachines()
        .findByAddress({ address: CANDY_MACHINE });
    }

    // add a listener to monitor changes to the candy guard
    metaplex.connection.onAccountChange(CANDY_GUARD, () => checkEligibility());

    // add a listener to monitor changes to the user's wallet
    metaplex.connection.onAccountChange(metaplex.identity().publicKey, () => checkEligibility());

    const guard = getGuard(candy!);

    // add a listener to reevaluate if the user is allowed to mint if startDate is reached
    const slot = await metaplex.connection.getSlot();
    const solanaTime = await metaplex.connection.getBlockTime(slot);
    const startDateGuard = guard?.startDate;
    if (startDateGuard != null) {
      const candyStartDate = startDateGuard.date;
      const refreshTime = candyStartDate.toNumber() - (solanaTime ?? 0);
      if (refreshTime > 0) {
        setTimeout(() => checkEligibility(), refreshTime * 1000);
      }
    }

    // also reevaluate eligibility after endDate is reached
    const endDateGuard = guard?.endDate;
    if (endDateGuard != null) {
      const candyEndDate = endDateGuard.date;
      const refreshTime = solanaTime! - candyEndDate.toNumber();
      if (refreshTime > 0) {
        setTimeout(() => checkEligibility(), refreshTime * 1000);
      }
    }
  }

  const onMint = async () => {
    if (metaplex == null || candyMachine == null) return;
    //const tx = new Transaction();
    //tx.add((await metaplex.candyMachines().builders().mint()));

    await metaplex.candyMachines().mint({
      candyMachine: {...candyMachine},
      collectionUpdateAuthority: candyMachine.authorityAddress,
      group: isWl() ? "wl" : "public"
    });
  }

  return (
    <VStack>
      <HStack>
        <Heading size="md">{candyMachine?.itemsAvailable.toString() ?? 0}</Heading>
        <Text>Total Items</Text>
        <Spacer/>
        <SocialNetworks/>
      </HStack>
      <Card>
        <CardBody>
          <HStack>
            <Text>Total Minted</Text>
            <Spacer/>
            <Text>{`${percentage.toFixed(2)} %`}</Text>
            <Text>{`${candyMachine?.itemsMinted ?? 0}/${candyMachine?.itemsAvailable ?? 0}`}</Text>
          </HStack>
          <Progress value={percentage}/>
        </CardBody>
        <CardFooter>
          {
            percentage >= 90 ? <Raffle/> :
              <Button isDisabled={disableMint} onClick={onMint}>Mint</Button>
          }
        </CardFooter>
      </Card>
    </VStack>
  );
}

export default MintDetails;