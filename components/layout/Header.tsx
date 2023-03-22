import {Flex, Heading, Image, Spacer} from "@chakra-ui/react";
import viteLogo from "/vite.svg";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";

const Header = () => {
  return (
    <Flex direction="row">
      <Flex direction="row" alignItems="center">
        <Image src={viteLogo}/>
        <Heading size="xl">Project name</Heading>
      </Flex>
      <Spacer/>
      <WalletMultiButton/>
    </Flex>
  )
}

export default Header;