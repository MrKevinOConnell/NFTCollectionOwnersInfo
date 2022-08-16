import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Button, CircularProgress, Grid, Link, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import { ethers } from "ethers";
// This script demonstrates access to the NFT API via the Alchemy SDK.
import {
  Network,
  Alchemy
} from "alchemy-sdk";
import { fetchAndRetryIfNecessary } from './utils/utils';
import TokenInfo from './TokenInfo/TokenInfo';

function App() {
  
  const [NFTs,setNFTs] = useState(null as any)
  const [isLoading,setIsLoading] = useState(false)
  const [owners,setOwners] = useState(null as any)
  const [error,setError] = useState(null as any)
  const [tokenInfo,setTokenInfo] = useState(null as any)
  const [contractMD, setContractMD] = useState(null as any)
  const [address,setAddress] = useState("")

const settings = {
  apiKey: `${process.env.REACT_APP_alchemyAPI}`, 
  network: Network.ETH_MAINNET, 
  maxRetries: 10,
};

const alchemy = new Alchemy(settings);
const getTokenNumber = (contract: string, array: any[], size: number) => {
  const finArray = array.filter(v => { 
  return v && v.address === contract}).map(v => v.balance)
return  {address: contract,['balance']: finArray.reduce((a,b)=> a + b)/size}
}
function sortNFTs(array: any[]) {
  let frequency = {} as any, value 

  // compute frequencies of each value
  for(var i = 0; i < array.length; i++) {
      value = array[i];
      if(value in frequency) {
          frequency[value]++;
      }
      else {
          frequency[value] = 1;
      }
  }

  // make array from the frequency object to de-duplicate
  var uniques = [];
  for(value in frequency) {
      uniques.push(value);
  }

  // sort the uniques array in descending order by frequency
  function compareFrequency(a: any , b: any) {
      return frequency[b] - frequency[a];
  }

  return uniques.sort(compareFrequency)
}


const getTokenInfo: (owners: string[]) => void = async (owners : string[]) => {
  try {
  
    const tokens = await Promise.all(owners.map(async (owner: string) => {
      try {
        const raw = JSON.stringify({
          "jsonrpc": "2.0",
          "method": "alchemy_getTokenBalances",
          "headers": {
            "Content-Type": "application/json"
          },
          "params": [
            `${owner}`,
           "DEFAULT_TOKENS"
          ],
        });
        const requestOptions = {
          method: 'POST',
          body: raw,
          redirect: 'follow' as RequestRedirect
        };
      const response = await fetchAndRetryIfNecessary (async () => (
        await fetch(`https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_alchemyAPI}`,requestOptions)
      ))
      if(response.ok) {
      const tokens = await response.json().then((res: any) => {
        const userTokens = res.result.tokenBalances.map((token: any) => {return { address: token.contractAddress,balance: parseInt(token.tokenBalance,16)}})
        return [...userTokens]
      })
     return tokens
      }
      else {
        return []
      }
      }
      catch(e){
        console.log(e)
      }
    }).flat())
    
    const ownerTokens = [].concat.apply([], tokens) as any[]
    const finishOwnerAddresses = Array.from(new Set(ownerTokens.filter(t => t).map(token =>  token.address).filter(e => e)))
    const finishOwnerTokens = finishOwnerAddresses.map(address => {
      return getTokenNumber(address, ownerTokens, owners.length)
    }).filter(a => a.balance > 0)
    let USDETHValue = null as any
    const ETHUSDConversion = `https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD&api_key=${process.env.REACT_APP_CRYPTO_COMPARE}`
    const USDtokenConversionRes = await fetchAndRetryIfNecessary (async () => (
      await fetch(ETHUSDConversion)
    ))
    if(USDtokenConversionRes.ok) {
      const json = await USDtokenConversionRes.json()
      USDETHValue = json.USD
    }
    const tokenMetadata = await Promise.all(finishOwnerTokens.map(async (token: any) => {
      try {
        const raw = JSON.stringify({
          "jsonrpc": "2.0",
          "method": "alchemy_getTokenMetadata",
          "headers": {
            "Content-Type": "application/json"
          },
          "params": [
            `${token.address}`,
          ],
        });
        const requestOptions = {
          method: 'POST',
          body: raw,
          redirect: 'follow' as RequestRedirect
        };
      
      const tokenRes = await fetchAndRetryIfNecessary (async () => (
        await fetch(`https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_alchemyAPI}`,requestOptions)
      ))
      if(tokenRes.ok) {
      const md = await tokenRes.json().then(async (res: any) => {
        const usertoken = res.result
       const conversion = `https://min-api.cryptocompare.com/data/price?fsym=${usertoken.symbol}&tsyms=ETH&api_key=${process.env.REACT_APP_CRYPTO_COMPARE}`
       const tokenConversionRes = await fetchAndRetryIfNecessary (async () => (
        await fetch(conversion)
      ))
      if(tokenConversionRes.ok) {
        const json = await tokenConversionRes.json()
        const ETHBalance = token.balance * json.ETH
        const balance = USDETHValue ? USDETHValue * ETHBalance : ETHBalance
        return {...token,balance,name: usertoken.name, symbol: usertoken.symbol}
      }
      })
     return md
      }
      else {
        return {...token}
      }
      }
      catch(e){
        console.log(e)
      }
    }))
    tokenMetadata.sort((a,b) => b.balance - a.balance)
    const finishedTokens = tokenMetadata.slice(0,10)
    return finishedTokens
    }
    catch(e){
      console.log(e)
    }
}

  const getNFTOwners: (address: string) => void = async (address: string) => {
    try {
      setIsLoading(true)
      let allUserNFTs  = []
    if(!ethers.utils.isAddress(address)) {
      setNFTs(null as any)
    }
    if(address) {
    const md = await alchemy.nft.getContractMetadata(address)
    setContractMD(md)
    const ownerRes = await alchemy.nft
    .getOwnersForContract(address)
  
    const owners = ownerRes.owners
    if(!owners.length) {
      setError("Nobody owns a NFT in this collection, please try another one!")
      setIsLoading(false)
      return
    }
   const tokens = await getTokenInfo(owners)
    setOwners(owners)
    const nfts = await Promise.all(owners.map(async (owner: string) => {
      try {
      const response = await fetchAndRetryIfNecessary (async () => (
        await fetch(`https://eth-mainnet.g.alchemy.com/nft/v2/${process.env.REACT_APP_alchemyAPI}/getNFTs?owner=${owner}&filters[]=SPAM`)
      ))
      if(response.ok) {
      const user = await response.json().then((res: any) => {
        const userNFTs = res.ownedNfts.map((nft: any) => nft.contract.address)
        return [...userNFTs]
      })
     return user
      }
      else {
        return []
      }
      }
      catch(e){
       console.log(e)
      }
    }))
    
    const newNfts = sortNFTs(nfts.filter(e => e).flat()).slice(0,30)
    const finalNfts = await Promise.all(newNfts.map(async nft => {
      const url = `https://eth-mainnet.g.alchemy.com/nft/v2/${process.env.REACT_APP_alchemyAPI}/getContractMetadata?contractAddress=${nft}`
      const response = await fetchAndRetryIfNecessary (async () => (
        await fetch(url)
      ))
      const json =  await response.json()
      const imageUrl = `https://api.opensea.io/api/v1/asset_contract/${nft}`
      const imageResponse = await fetchAndRetryIfNecessary (async () => (
        await fetch(imageUrl)
      ))

      const imagejson = await imageResponse.json()
      const imageurl = imagejson.collection ? (imagejson.collection.large_image_url ? imagejson.collection.large_image_url : imagejson.collection.image_url ? imagejson.collection.image_url : null) : null
      
      const imageSrc = imageurl ? await fetchAndRetryIfNecessary (async () => (
        await fetch(imageurl)
      )) : null as any
      const imageBlob: any = imageSrc ? await imageSrc.blob() : null as any
      const imagesrcURL = imageBlob ? URL.createObjectURL(imageBlob) : null
    

      return {contract: nft,image: imagesrcURL, name: json.contractMetadata.name, symbol: json.contractMetadata.symbol }
    }))
   
    setNFTs(finalNfts.filter(e => e).slice(0,10))
    setTokenInfo(tokens)
    setIsLoading(false)
  }
  }
  catch(e) {
    console.log(e)
    setIsLoading(false)
  }
  }
  
  function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Stack direction="column" justifyContent="center">
      <Stack direction="row" justifyContent="center" mt={2}>
    <TextField style={{paddingRight: "30px", width:"40%"}} placeholder="Enter in a NFT contracts address here" value={address} onChange={(a) => setAddress(a.target.value)} />
      <Button variant="contained" onClick ={( () => {
        setError(null as any)
        getNFTOwners(address.trim())
      })}>Find NFT contracts owners</Button>
      </Stack>
      {contractMD && !error && <Typography textAlign="center">{contractMD.name} {contractMD.symbol} </Typography> }
      {isLoading && <Stack direction="row" justifyContent="center"> <CircularProgress /> </Stack>}
      {!isLoading && owners && !error && <Tabs centered value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="Owners NFT info" {...a11yProps(0)} />
          <Tab label="Owners Token info" {...a11yProps(1)} />
        </Tabs>}
      {NFTs && value === 0 && !error && <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell><Typography >Name</Typography></TableCell>
            <TableCell>Symbol</TableCell>
            <TableCell>Contract Address</TableCell>
            <TableCell>OpenSea Collection image</TableCell>
          </TableRow>
        </TableHead><TableBody>{NFTs.map((nft: any) => {
        return <TableRow> <TableCell><Typography>{nft.name}</Typography></TableCell><TableCell><Typography>{nft.symbol} </Typography></TableCell> <TableCell> <Link href={`https://etherscan.io/token/${nft.contract}`} underline="hover">
       {nft.contract}
      </Link></TableCell> <TableCell><img width={100} height={100} src={nft.image}/> </TableCell></TableRow>
      } )}</TableBody>)</Table></TableContainer>}
      {value === 1 && tokenInfo && !error && <TokenInfo tokens={tokenInfo} nftName={contractMD} />}
      {error && <Typography mt={10} color="red" textAlign="center">{error}</Typography>}
    </Stack>
  );
}

export default App
