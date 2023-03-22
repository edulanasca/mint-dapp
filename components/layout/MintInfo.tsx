import {Heading, Image, Text, VStack} from "@chakra-ui/react";
import projectInfo from "../../config/projectInfo";

const MintInfo = () => {
  return (
    <VStack>
      <Heading size="xl">{projectInfo.name}</Heading>
      <Image src={projectInfo.imageUrl}/>
      <Text>{projectInfo.description}</Text>
    </VStack>
  );
}

export default MintInfo;