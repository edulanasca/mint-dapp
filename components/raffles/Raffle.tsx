import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Grid,
  GridItem,
  Heading,
  Text,
  useDisclosure
} from "@chakra-ui/react";
import Countdown from "./Countdown";
import dayjs from "dayjs";
import projectInfo from "../../config/projectInfo";
import type {CandyMachine} from "@metaplex-foundation/js";
import {FC, useEffect, useState} from "react";
import {useMetaplex} from "../providers/useMetaplex";
import {RAFFLE_CM} from "../../config/candyMachine";
import BuyTickets from "./BuyTickets";

interface RaffleProps {
  candyMachine: CandyMachine | undefined
}

const Raffle: FC<RaffleProps> = ({ candyMachine }) => {
  const raffleEnd = dayjs(projectInfo.raffle.endDate);
  const [isEnded, setIsEnded] = useState(raffleEnd.isBefore(dayjs()));
  const publicGuard = candyMachine?.candyGuard?.groups.find(it => it.label == "public")?.guards;
  const price = publicGuard?.freezeSolPayment ? publicGuard.freezeSolPayment.amount.basisPoints.toNumber() / (10 ** 9) : 0;

  const { metaplex } = useMetaplex();
  const [raffleCM, setRaffleCM] = useState<CandyMachine | undefined>(undefined);

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const id = setInterval(()=> {
      setIsEnded(raffleEnd.isBefore(dayjs()));

      if (isEnded) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!raffleCM) (async () => setRaffleCM(await metaplex?.candyMachines().findByAddress({ address: RAFFLE_CM })))();
    metaplex?.connection.onAccountChange(RAFFLE_CM, async () => {
      setRaffleCM(await metaplex.candyMachines().findByAddress({ address: RAFFLE_CM }))
    })
  }, []);

  return (
    <Card width="90%">
      {
        isEnded ?
          null
          :
          <CardHeader display="flex" justifyContent="center" p={2}>
            <Countdown endTime={raffleEnd.unix()} fontWeight="bold" fontSize="xl"/>
          </CardHeader>
      }
      <CardBody>
        <Grid templateColumns={["50% 50%"]} templateRows={["repeat(2, 1fr)"]} alignItems="stretch" justifyItems="center">
          <GridItem>
            <Text>{`Public Raffle (${candyMachine?.itemsAvailable.sub(candyMachine.itemsMinted).toNumber()} NFTs)`}</Text>
          </GridItem>
          <GridItem>
            {isEnded ? <Badge colorScheme="red">Offline</Badge> : <Badge colorScheme="green">Live</Badge>}
          </GridItem>
          <GridItem>
            <Heading>Public</Heading>
            <Heading size="xs">{`Total tickets bought ${raffleCM?.itemsMinted ?? 0}`}</Heading>
          </GridItem>
          <GridItem display="flex" flexDirection="column" justifyContent="flex-end" alignItems="center">
            <Text>Price</Text>
            <Heading>{`${price} SOL`}</Heading>
          </GridItem>
        </Grid>
      </CardBody>
      <CardFooter justifyContent="center">
        <Button isDisabled={isEnded} onClick={onOpen}>Buy Tickets</Button>
        <BuyTickets isOpen={isOpen} onClose={onClose} price={price} raffleCM={raffleCM!}/>
      </CardFooter>
    </Card>
  );
}

export default Raffle;