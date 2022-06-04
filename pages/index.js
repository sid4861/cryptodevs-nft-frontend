import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ABI, NFT_CONTRACT_ADDRESS } from "../constants";

export default function Home() {

  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");

  async function connectWallet() {
    try {
      const { ethereum } = window;
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        setWalletConnected(accounts[0]);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function checkIfWalletIsConnected() {
    try {
      const { ethereum } = window;
      const accounts = await ethereum.request({ method: "eth_accounts" });
      console.log({accounts});
      if (accounts.length > 0) {
        setWalletConnected(accounts[0]);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getProviderOrSigner(needSigner = false) {
    try {
      const { ethereum } = window;
      const web3Provider = new ethers.providers.Web3Provider(ethereum);
      const network = await web3Provider.getNetwork();
      if (network.chainId !== 4) {
        alert("please connect with rinkeby");
      } else {
        if (needSigner) {
          const signer = web3Provider.getSigner();
          return signer;
        } else {
          return web3Provider;
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * mints an nft during presale
   */

  async function presaleMint() {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        ABI,
        signer
      )
      const tx = await nftContract.presaleMint({
        value: ethers.utils.parseEther("0.01")
      })
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("you successfully minted crypto devs NFT");
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * mints an NFT during public sale
   */

  async function mint() {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        ABI,
        signer
      );
      const tx = await nftContract.mint({
        value: ethers.utils.parseEther("0.01")
      })
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("you successfully minted crypto devs NFT");

    } catch (error) {
      console.log(error);
    }
  }
  async function startPresale() {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        ABI,
        signer
      )
      const tx = await nftContract.startPresale();
      setLoading(true);
      await tx.wait();
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  }
  async function checkIfPresaleStarted() {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        ABI,
        provider
      )
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        console.log("calling getowner");
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  /**
   * checkIfPresaleEnded: checks if the presale has ended by quering the `presaleEnded`
   * variable in the contract
   */
  async function checkIfPresaleEnded() {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        ABI,
        provider
      );
      const _presaleEnded = await nftContract.presaleEnded();
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }

      return hasEnded;

    } catch (error) {
      console.log(error);
    }
  }
  /**
   * returns owner address
   */
  async function getOwner() {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        ABI,
        provider
      );
      const _owner = await nftContract.owner();
      console.log("contract owner", _owner);
      const signer = await getProviderOrSigner(true);
      const signerAddress = await signer.getAddress();
      console.log("signer address", signerAddress);
      if (_owner.toLowerCase() === signerAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * getTokenIdsMinted: gets the number of tokenIds that have been minted
   */

  async function getTokenIdsMinted() {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        ABI,
        provider
      );
      const _tokenIdsMinted = await nftContract.tokenIds();
      setTokenIdsMinted(_tokenIdsMinted.toString());
    } catch (error) {
      console.log(error);
    }
  }
  //use effects
  useEffect(() => {
    if (!walletConnected) {
      console.log("not connected");
      checkIfWalletIsConnected();
    }
  }, []);


  useEffect(() => {
    const _presaleStarted = checkIfPresaleStarted();
    // if (_presaleStarted) {
      checkIfPresaleEnded();
    // }

    getTokenIdsMinted();

    const presaleEndedInterval = setInterval(async () => {
      const _presaleStarted = await checkIfPresaleStarted();
      // if (_presaleStarted) {
        const _presaleEnded = await checkIfPresaleEnded();
        if (_presaleEnded) {
          clearInterval(presaleEndedInterval);
        }
      // }
    }, 5000)

    // set an interval to get the number of token Ids minted every 5 seconds
    setInterval(async function () {
      await getTokenIdsMinted();
    }, 5 * 1000);

  }, [])

  /*
    renderButton: Returns a button based on the state of the dapp
  */
  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wllet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    // If connected user is the owner, and presale hasnt started yet, allow them to start the presale
    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      );
    }

    // If connected user is not the owner but presale hasn't started yet, tell them that
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasnt started!</div>
        </div>
      );
    }

    // If presale started, but hasn't ended yet, allow for minting during the presale period
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a
            Crypto Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    // If presale started and has ended, its time for public minting
    if (presaleEnded) {
      return (
        <button className={styles.button} onClick={mint}>
          Public Mint 🚀
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  )
}
