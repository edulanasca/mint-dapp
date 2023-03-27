import {HStack, Icon, IconButton} from "@chakra-ui/react";
import socials from "../../config/socialNetworks";

const SocialNetworks = () => {
  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <HStack>
      {
        Object.keys(socials)
          .filter(key => socials[key].url !== "")
          .map(key => {
            const {logo, url} = socials[key];
            return <IconButton key={key} aria-label={key} icon={<Icon as={logo}/>} onClick={() => openInNewTab(url)}/>;
          })
      }
    </HStack>
  );
}

export default SocialNetworks;