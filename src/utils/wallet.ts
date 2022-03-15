import Web3 from "web3";
import Toastify from "toastify-js";
import detectEthereumProvider from "@metamask/detect-provider";
import { AbiItem } from "web3-utils";
import { abi, chain } from "./constants";

// import contracts from "~~/contracts/src/contracts";
declare let window: any;

window.web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");

const defineNuxtPlugin = () => {
  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = await detectEthereumProvider();
      if (provider) {
        const accounts = await window.ethereum?.request({
          method: "eth_requestAccounts",
        });
        // window.web3 = new Web3(window.ethereum.currentProvider);
        await addChain(chain);
        await addToken();
        const address = accounts[0];
        const bnbBalance = await getBalance(accounts[0], null);
        const dnaBalance = await getBalance(accounts[0], {
          address: "0x4278e4b754f0d311d8c4d1bc86263b53c5f6ea82",
          symbol: "ERIK",
        });
        const balances = [bnbBalance, dnaBalance];
        return { address, balances };
      } else {
        console.log("please install metamask to use this dApp!");
        Toastify({
          text: "Please install metamask to use this dApp!",
          className: "toast error",
          duration: -1,
          close: true,
          gravity: "top",
          position: "right",
          stopOnFocus: true,
        }).showToast();
        return false;
      }
    }
  };

  const addChain = async (chain: {
    chainName?: string;
    chainId: any;
    nativeCurrency?: { symbol: string; name: string; decimals: number };
    rpcUrls?: string[];
    blockExplorerUrls?: string[];
  }) => {
    try {
      await window.ethereum?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chain.chainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum?.request({
          method: "wallet_addEthereumChain",
          params: [chain],
        });
      }
    }
  };

  const addToken = async () => {
    try {
      await addChain(chain);
      await window.ethereum?.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: "0x4278e4b754f0d311d8c4d1bc86263b53c5f6ea82",
            symbol: "ERIK",
            decimals: 18,
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const getBalance = async (
    wallet: string,
    token: { address: any; symbol?: any } | null | undefined
  ) => {
    const balance = { token: "", balance: "" };
    if (window.web3) {
      if (token) {
        const instance = new window.web3.eth.Contract(
          abi as AbiItem[],
          token.address
        );
        const wei = await instance.methods.balanceOf(wallet).call();
        balance.balance = window.web3.utils.fromWei(wei, "ether");
        balance.token = token.symbol;
      } else {
        const wei = await window.web3.eth.getBalance(wallet);
        balance.balance = window.web3.utils.fromWei(wei, "ether");
        balance.token = "BNB";
      }
      return balance;
    }
  };

  const mintNFT = async (NFT: string | number, to: any) => {
    if (window.web3) {
      const contractData = {
        abi: abi as AbiItem[],
        address: "0x4278e4b754f0d311d8c4d1bc86263b53c5f6ea82",
      };
      let contract = new window.web3.eth.Contract(
        contractData.abi,
        contractData.address
      );
      await contract.methods.mint(to).send({ from: to });
    }
  };
  const getAddress = async () => {
    try {
      let accounts = await window.ethereum?.request({
        method: "eth_accounts",
      });
      if (!accounts.length) {
        accounts = await window.ethereum?.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      }
      if (accounts.length) {
        await addChain(chain);
      }
      return {
        account: accounts[0],
        balance: await getBalance(accounts[0], {
          address: "0x4278e4b754f0d311d8c4d1bc86263b53c5f6ea82",
          symbol: "ERIK",
        }),
      };
    } catch (error) {
      console.log(error);
    }
  };
  const getWallet = async () => {
    try {
      let accounts = await window.ethereum?.request({
        method: "eth_accounts",
      });
      if (accounts[0])
        return {
          account: accounts[0],
          balance: await getBalance(accounts[0], {
            address: "0x4278e4b754f0d311d8c4d1bc86263b53c5f6ea82",
            symbol: "ERIK",
          }),
        };
      else return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  };
  return {
    connectWallet: () => connectWallet(),
    addChain: (chain: any) => addChain(chain),
    getBalance: (address: any, token: any) => getBalance(address, token),
    addToken: () => addToken(),
    getAddress: () => getAddress(),
    mintNFT: (NFT: any, to: any) => mintNFT(NFT, to),
    getWallet,
  };
};
export default defineNuxtPlugin();
