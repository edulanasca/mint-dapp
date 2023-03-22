import {BsDiscord, BsTwitter, TbWorldWww} from "react-icons/all";
import type {IconType} from "react-icons";

const socialNetworks: Record<string, { logo: IconType, url: string }> = {
  twitter: {
    logo: BsTwitter,
    url: "/1"
  },
  discord: {
    logo: BsDiscord,
    url: "/2"
  },
  webpage: {
    logo: TbWorldWww,
    url: "/3"
  }
}

export default socialNetworks;