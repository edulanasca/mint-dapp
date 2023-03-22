import React from 'react'
import ReactDOM from 'react-dom/client'
import { Buffer } from 'buffer';
import App from './App'
import './index.css'
import WalletsProvider from "../components/providers/WalletsProvider";
import {ChakraProvider} from "@chakra-ui/react";
import {MetaplexProvider} from "../components/providers/MetaplexProvider";

window.Buffer = Buffer;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider>
      <WalletsProvider>
        <MetaplexProvider>
          <App/>
        </MetaplexProvider>
      </WalletsProvider>
    </ChakraProvider>
  </React.StrictMode>,
)
