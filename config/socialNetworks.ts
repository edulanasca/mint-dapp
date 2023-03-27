import {BsDiscord, BsTwitter, TbWorldWww} from "react-icons/all";
import type {IconType} from "react-icons";

const socialNetworks: Record<string, { logo: IconType, url: string }> = {
  twitter: {
    logo: BsTwitter,
    url: ""
  },
  discord: {
    logo: BsDiscord,
    url: ""
  },
  webpage: {
    logo: TbWorldWww,
    url: ""
  }
}

export default socialNetworks;