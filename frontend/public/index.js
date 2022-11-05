import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress } from "./constants.js"

const connectButton = document.getElementById("connectButton")
const withdrawButton = document.getElementById("withdrawButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
const debug = document.getElementById("debug")
connectButton.onclick = connect
withdrawButton.onclick = withdraw
fundButton.onclick = fund
balanceButton.onclick = getBalance

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      await ethereum.request({ method: "eth_requestAccounts" })
    }
    catch (error) {
      console.log(error)
    }
    

    const accounts = await ethereum.request({ method: "eth_accounts" })
    connectButton.innerHTML = "Connected"
    debug.innerHTML += " <br> " + "What a genius you are fucking Connected"

    console.log(accounts)
    debug.innerHTML += " <br> " + accounts
  }
  else
    connectButton.innerHTML = "Please install MetaMask"

}

async function withdraw() {
  console.log(`Withdrawing...`)
  debug.innerHTML += " <br> " + "Withdrawing"


  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, abi, signer)
    try {
      const transactionResponse = await contract.withdraw()
      await listenForTransactionMine(transactionResponse, provider)
      // await transactionResponse.wait(1)
    }
    catch (error) {
      console.log(error)
      debug.innerHTML += " <br> " + error
    }
  }
  else {
    withdrawButton.innerHTML = "Please install MetaMask"
    debug.innerHTML += " <br> " + "Please install MetaMask"
  }
}

async function fund() {
  const ethAmount = document.getElementById("ethAmount").value
  console.log(`Funding with ${ethAmount}...`)


  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, abi, signer)
    try {
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      })
      await listenForTransactionMine(transactionResponse, provider)
    }
    catch (error) {
      console.log(error)
      debug.innerHTML += " <br> " + error
    }
  }
  else {
    fundButton.innerHTML = "Please install MetaMask"
    debug.innerHTML += " <br> " + "Please install MetaMask"
  }
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    try {
      const balance = await provider.getBalance(contractAddress)
      console.log(ethers.utils.formatEther(balance))
      debug.innerHTML += " <br> " + ethers.utils.formatEther(balance)
    }
    catch (error) {
      console.log(error)
      debug.innerHTML += " <br> " + error
    }
  }
  else {
    balanceButton.innerHTML = "Please install MetaMask"
    debug.innerHTML += " <br> " + "Please install MetaMask"
  }
}

function listenForTransactionMine(transactionResponse, provider) {
  console.log(`Mining ${transactionResponse.hash}`)
  return new Promise((resolve, reject) => {
    try {
      provider.once(transactionResponse.hash, (transactionReceipt) => {
        console.log(
          `Completed with ${transactionReceipt.confirmations} confirmations. `
        )
        debug.innerHTML += " <br> " + `Completed with ${transactionReceipt.confirmations} confirmations. `
        resolve()
      })
    }
    catch (error) {
      reject(error)
    }
  })
}
