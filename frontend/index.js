import { ethers } from "./ethers-5.6.esm.min.js"
//合约abi address
import { abi, contractAddress } from "./constants.js"

//获取前端按钮
const _connect = document.getElementById("connect")
const _register = document.getElementById("reg")
const _vote = document.getElementById("vote")
const _pro = document.getElementById("pro")
const _update = document.getElementById("update")
const _getbalance = document.getElementById("getbalance")
const _proposals = document.getElementById("proposals")
const _zjucoin = document.getElementById("zjucoin")
const _query = document.getElementById("query")
//注册点击事件
_connect.onclick = connect
_register.onclick = reg
_query.onclick=query
_vote.onclick = vote
_pro.onclick = pro
_update.onclick = update
_getbalance.onclick = getbalance
//引入web3
const Web3 = require('web3');
//定义web3
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers
    .HttpProvider("http://localhost:7545"));
}

//创建合约实例
const myContract = new web3.eth.Contract(abi, contractAddress);

const addEventWatchTx = async () => {
  contractInstance.events.Created({
    filter: {},
    fromBlock: 0
  }, function (error, event) { })
    .on('data', function (event) {
      console.log("12");
      console.log(event); // same results as the optional callback above
    })
    .on('changed', function (event) {
      console.log('emove event from local database');
    })
    .on('error', console.error);
}
//连接metamask
async function connect() {//done
  //判断metamask是否安装Web3
  console.log(typeof web3 == 'undefined');
  if (typeof window.ethereum !== "undefined") {
    try {
      //调用登录
      await ethereum.request({ method: "eth_requestAccounts" })
    }
    catch (error) {
      console.log(error)
    }
    //查看当前登录账号
    const accounts = await ethereum.request({ method: "eth_accounts" })
    //输出
    debug.innerHTML = "Connected with: " + accounts
  }
  else
    debug.innerHTML = "Please install MetaMask"
}
//注册，新用户可领取空投
async function reg() {//done
  //判断metamask是否安装Web3
  if (typeof window.ethereum !== "undefined") {
    //web3 provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    try {
      //签名
      const signer = provider.getSigner()
      //产生合约对象
      const contract = new ethers.Contract(contractAddress, abi, signer)
      //异步调用
      await contract.reg()

    } catch (error) {
      console.log(error)
      if (error.data) {
        debug.innerHTML += "<br>"
        debug.innerHTML += error.data.message
      }
      return;
    }
    debug.innerHTML += "<br>"
    debug.innerHTML += "registered successfullly!"
  }
  else {
    withdrawButton.innerHTML = "Please install MetaMask"
    debug.innerHTML = "Please install MetaMask"
  }
}
//查询提案
async function query() {
  console.log("began query")
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    try {
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      const id=document.getElementById("proid").value
      //调用
      const s=await contract.query(id)
      //输出
      document.getElementById("querycontent").innerHTML=s
    }
    catch (error) {
      console.log(error)
      if (error.data) {
        debug.innerHTML += "<br>"
        debug.innerHTML += error.data.message
      }
      return;
    }
   }
  else {
    withdrawButton.innerHTML = "Please install MetaMask"
    debug.innerHTML = "Please install MetaMask"
  }
}
//投票
async function vote() {//done
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    try {
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      //得到输入框值
      const _index = document.getElementById("index").value
      const _side = document.getElementById("side").checked
      await contract.vote(_index, _side)

    } catch (error) {
      console.log(error)
      if (error.data) {
        debug.innerHTML += "<br>"
        debug.innerHTML += error.data.message
      }
      return;
    }
    debug.innerHTML += "<br>"
    debug.innerHTML += "vote successfullly!"

  }
  else {
    withdrawButton.innerHTML = "Please install MetaMask"
    debug.innerHTML = "Please install MetaMask"
  }
}
//发起提案
async function pro() {

  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    try {
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      //得到时间
      const starttime = new Date(document.getElementById("starttime").value)
      //转时间戳
      const _starttime = starttime.getTime() / 1000
      const endtime = new Date(document.getElementById("endtime").value)
      const _endtime = endtime.getTime() / 1000
      //提案名字，内容
      const _name = document.getElementById("name").value
      const _content = document.getElementById("content").value
      //调用
        const s = await contract.createProposal(_starttime, Math.max(_endtime - _starttime, 60), _name, _content)
        //输出
      // console.log(await myContract.methods.createProposal().call())
      contract.on("Created",(index,event)=>{
        console.log(ethers.BigNumber.from(index).toNumber())
        debug.innerHTML = "propose of index "+ethers.BigNumber.from(index).toNumber()+" created successfullly!"
      });
    }
    catch (error) {
      console.log(error)
      if (error.data) {
        debug.innerHTML += "<br>"
        debug.innerHTML += error.data.message
      }
      return;
    }
   }
  else {
    withdrawButton.innerHTML = "Please install MetaMask"
    debug.innerHTML = "Please install MetaMask"
  }
}
//更新提案状态
async function update() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    try {
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      
      await contract.update()
      //监听
      contract.on("Approved",(index,name,event)=>{
        console.log(index,name)
        debug.innerHTML += "<br>you proposal NO."+ethers.BigNumber.from(id).toNumber()+" has been approved"
        
      });
      contract.on("Denied",(index,name,event)=>{
        console.log(index,name)
        debug.innerHTML += "<br>you proposal NO."+ethers.BigNumber.from(id).toNumber()+" has been denied"
      });
      contract.on("getAward",(name,id,event)=>{
        debug.innerHTML = "<br> Congradulations! Ur awarded with a ERC721 which id is :"
        debug.innerHTML += ethers.BigNumber.from(id).toNumber()
      });
      contract.on("Update",(cnt,pro,event)=>{
        _proposals.innerHTML=""
        console.log(cnt)
        console.log(pro)
        debug.innerHTML += "<br>update successfullly!"
        for(var i=0;i<ethers.BigNumber.from(cnt).toNumber();i++){
          var pstate=""
          switch (pro[i][6]) {
            case 0:
              pstate="pending"
              break;
            case 1:
              pstate="approved"
              break;
            case 2:
              pstate="denied"
              break;
            default:
              break;
          }
          var d=new Date((ethers.BigNumber.from(pro[i][2]).toNumber()+ethers.BigNumber.from(pro[i][3]).toNumber())*1000)
          _proposals.innerHTML += "id :"+ethers.BigNumber.from(i).toNumber()+"<br> name :" + pro[i][4] + "<br> content : "+pro[i][5]+"<br> endtime : "+d+"<br> state : "+pstate+"<br>--------------<br>"
        }
      
      });
      }
      
    catch (error) {
        console.log(error)
        if (error.data) {
          debug.innerHTML += "<br>"
          debug.innerHTML += error.data.message
        }
        return;
      }

      
    }
  else {
      balanceButton.innerHTML = "Please install MetaMask"
      debug.innerHTML = "Please install MetaMask"
    }
  }
  //获取tokens
  async function getbalance() {//done
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      try {
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, abi, signer)
        const s = await contract.getBalance()
        console.log(s);
        _zjucoin.innerHTML = parseInt(s._hex, 16)
      } catch (error) {
        console.log(error)
        if (error.data) {
          debug.innerHTML += "<br>"
          debug.innerHTML += error.data.message
        }
        return;
      }
      debug.innerHTML += "<br>"
      debug.innerHTML += "update balance successfullly!"

    }
    else {
      withdrawButton.innerHTML = "Please install MetaMask"
      debug.innerHTML = "Please install MetaMask"
    }
  }

