import MetamaskIcon from '../assets/images/wallets/metamask.svg'
import BSCIcon from '../assets/images/wallets/bsc.png'
import WalletConnectIcon from '../assets/images/wallets/walletconnect.svg'
import PhantomIcon from '../assets/images/wallets/phantom.png'
import { getChainId, getRpcUrl, setAccount, setSelectedWallet } from '../store/wallet'
import { providers } from 'ethers'
import { Dispatch } from 'redux'
import { MetamaskWeb3Provider } from './providers/Metamask'
import { WalletConnectWeb3Provider } from './providers/WalletConnect'
import WalletConnectProvider from '@walletconnect/web3-provider'
import { BscWeb3Provider } from './providers/BSC'
import { message } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { getPhantomProvider } from './providers/Phantom'

export type WalletNames = 'Metamask' | 'BSC' | 'WalletConnect' | 'Phantom'

export interface Wallet {
  name: string
  icon: string
  handleConnect: (_dispatch: Dispatch<any>, _chainId: number, _RPCUrl?: string) => void
  disable?: boolean
}

export async function getWeb3ProviderByWallet(
  // @ts-ignore
  { chainId, RPCUrl },
  walletName?: WalletNames
): Promise<providers.Web3Provider | undefined> {
  if (!walletName) {
    return undefined
  }

  return await new Map<WalletNames, any>([
    ['Metamask', MetamaskWeb3Provider],
    ['BSC', BscWeb3Provider],
    ['WalletConnect', WalletConnectWeb3Provider],
    ['Phantom', getPhantomProvider]
  ]).get(walletName)({
    chainId,
    RPCUrl
  })
}

const connectToMetamask = async (dispatch: Dispatch<any>, chainId: number, RPCUrl?: string): Promise<void> => {
  const web3Provider = (await getWeb3ProviderByWallet(
    {
      chainId,
      RPCUrl
    },
    'Metamask'
  )) as providers.Web3Provider

  await web3Provider.provider.request?.({ method: 'eth_requestAccounts' })
  dispatch(setSelectedWallet('Metamask'))
}

const connectToBSC = async (dispatch: Dispatch<any>, chainId: number, RPCUrl?: string): Promise<void> => {
  const web3Provider = (await getWeb3ProviderByWallet(
    {
      chainId,
      RPCUrl
    },
    'BSC'
  )) as providers.Web3Provider

  await web3Provider.provider.request?.({ method: 'eth_requestAccounts' })
  dispatch(setSelectedWallet('BSC'))
}

const connectToPhantom = async (dispatch: Dispatch<any>): Promise<void> => {
  const provider = await getPhantomProvider()
  if (!provider) {
    message.warn('Please install Phantom first.')
    setTimeout(() => {
      window.open('https://phantom.app/', '_blank')
    }, 1500)

    return
  }

  dispatch(setSelectedWallet('Phantom'))
}

const connectToWalletConnect = async (dispatch: Dispatch<any>, chainId: number, RPCUrl?: string): Promise<void> => {
  const web3Provider = (await getWeb3ProviderByWallet({
    chainId,
    RPCUrl
  }, 'WalletConnect')) as providers.Web3Provider

  const walletConnectProvider = web3Provider.provider as WalletConnectProvider

  console.log(`wc connected: ${walletConnectProvider.wc.connected}`)
  if (!walletConnectProvider.wc.connected) {
    walletConnectProvider.wc.connect({ chainId }).then(r => {
      console.log(r)
      const [account] = r.accounts
      dispatch(setAccount(account))
      dispatch(setSelectedWallet('WalletConnect'))
      const connectedChainId = r.chainId
      if (connectedChainId !== chainId) {
        message.warn('Not in correct network!')
      }
    })
  }

  // walletConnectProvider.enable()
  //   .then(accounts => {
  //     const [account] = accounts
  //     dispatch(setAccount(account))
  //     dispatch(setSelectedWallet('WalletConnect'))
  //   })
  //   .catch(error => {
  //     console.log(error)
  //   })
}

export const SUPPORT_WALLETS: Wallet[] = [
  {
    name: 'Metamask',
    icon: MetamaskIcon,
    handleConnect: connectToMetamask
  },
  {
    name: 'Wallet Connect',
    icon: WalletConnectIcon,
    handleConnect: connectToWalletConnect,
  },
  {
    name: 'Binance Chain Wallet',
    icon: BSCIcon,
    handleConnect: connectToBSC,
    disable: true
  },
  {
    name: 'Phantom',
    icon: PhantomIcon,
    handleConnect: connectToPhantom
  }
]

export const getIconByWalletName = (name?: string)  => {
  if (!name) {
    return undefined
  }

  return SUPPORT_WALLETS.filter(o => o.name === name)?.[0]?.icon
}

export const useConnectToWallet = () => {
  const dispatch = useDispatch()

  const chainId = useSelector(getChainId)
  const RPCUrl = useSelector(getRpcUrl)

  const connect = (wallet: Wallet) => chainId && RPCUrl && wallet.handleConnect(dispatch, chainId, RPCUrl)

  return {
    connect
  }
}


