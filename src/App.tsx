import './App.css'
import Header from "../components/layout/Header";
import {SimpleGrid} from "@chakra-ui/react";
import MintInfo from "../components/layout/MintInfo";
import MintDetails from "../components/layout/MintDetails";

function App() {

  return (
    <>
      <Header/>
      <SimpleGrid columns={2} >
        <MintInfo/>
        <MintDetails/>
      </SimpleGrid>
    </>
  )
}

export default App
