# 社团提案投票~~简陋版~~ by zju-ljx

## 如何运行

1.在部署合约，将frontend/constants.js的address修改为合约地址
2.终端输入http-server，即可打开运行

## 功能实现分析


重写erc20和erc721
```
contract MyERC20 is ERC20 {
```
```
contract MyERC721 is ERC721 {
```

定义了一些事件，用于调试，返回值给前端
```
 event Reged(address reger);//注册
    event Created(uint64 i);//
    event Voted(address voter, uint64 i, bool side);
    event Approved(uint64 i,string name);
    event Denied(uint64 i,string name);
    event getAward(address player, uint256 id);
    event Update(uint64 count, Proposal[20] p);
```

合约结构，增加了合约具体内容，状态和支持反对数量
```
 enum pstate{
        pending,//进行中
        approved,//通过
        denied//否决
    }
  struct Proposal {
      uint64 index; // index of this proposal
      address proposer; // who make this proposal
      uint256 startTime; // proposal start time
      uint256 duration; // proposal duration
      string name; // proposal name
      string content;
      pstate state;//合约状态
      uint64 pros;//支持数
      uint64 cons;//反对数
      // TODO add any member if you want
  }
```
定义映射，reg为是否注册，pnum为通过提案数，proposals为提案，voters为投票者，awards为奖励
```
  //people
    mapping(address => bool) Reg;
    mapping(address => uint64) Pnum;
    //pro
    mapping(uint64 => Proposal) public proposals; // A map from proposal index to proposal
    mapping(uint64=>mapping(address=>bool)) voters;

    mapping(address => uint256) awards;
```

#### 1.点击connect按钮连接 
通过小狐狸钱包的最新接口window.ethereum，调用request method进行连接

#### 2.点击register进行注册，第一次会有空投
使用并重写erc20函数，委托给合约初始金额数用于之后交易周转，第二次不会执行并报too greedy!
```
 require(Reg[msg.sender]==false, "Too greedy!!");
```
```
  studentERC20.transfer(msg.sender, InitReward);
  //事先委托初始金额
  studentERC20.allowance(msg.sender);
  emit Reged(msg.sender);
```

#### 3.查询提案，输入对应提案id，查看提案内容
合约中查询函数，直接利用返回值得到内容字符串
```
function query(uint32 i) public view returns(string content) {
        return proposals[i].content;
    }
```

#### 4.点击vote按钮，输入想投的提案id，并框选是否支持，进行投票，每次消耗1枚Zjucoin
调用合约的vote函数，检查边界条件，无误后进行投票，voters mapping写入该用户投票状态，每人只能投每提案一下
```
//时间对
require(block.timestamp < p.startTime + p.duration, "Note the time to vote this!");
//没投
require(voters[i][msg.sender]==false, "Has been voted");
//余额够
require(studentERC20.balanceOf(msg.sender) >= VoteCost, "Insufficient vote token");
```
#### 5.查看拥有的Zjucoin
也是直接通过返回值取得

#### 6.输入起止日期，标题，内容，点击propose按钮，发起提案，每次消耗5枚Zjucoin
前端将html5的datetime转时间戳，调用合约的createProposal函数，会检查边界条件，不符会返回

#### 7.点击update按钮，让合约更新自己的提案，处理已到期的提案，以及可能获得的ERC721奖励
事件返回合约结构体数组，里面有自己发起的合约的相关数据，前端监听事件得到返回值，解析得到时间，内容，合约状态
```
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
```
erc721会给用户一个id，每次生成后id会加1
```
MyERC721 public award;
//有3个则得到奖励，写入区块
if (Pnum[p.proposer] == 3) {
awardid = award.awardItem(p.proposer);
awards[p.proposer] = awardid;
Pnum[p.proposer] == 0;
emit getAward(p.proposer, awardid);
}
```
```
function awardItem(address player) public returns(uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(player, newItemId);

        emit award(player, newItemId);
        return newItemId;
    }
```

## 项目运行截图

### 1.点击connect按钮连接 
![image](https://user-images.githubusercontent.com/82871660/200316955-fd62ba3f-0561-4a72-bacc-2e3bca71969f.png)

### 2.查询提案，输入对应提案id，查看提案内容
![image](https://user-images.githubusercontent.com/82871660/200317090-24c17769-7379-4791-9faf-a57131b08d1d.png)
![image](https://user-images.githubusercontent.com/82871660/200317121-78ed2840-a128-4d5d-bcac-a580f03a589c.png)

### 3.点击vote按钮，输入想投的提案id，并框选是否支持，进行投票，每次消耗1枚Zjucoin
![image](https://user-images.githubusercontent.com/82871660/200317963-7fc2172d-c326-4665-8528-c178fbb353a6.png)

### 4.查看拥有的Zjucoin
![image](https://user-images.githubusercontent.com/82871660/200317935-c9727c1b-dc64-4717-a6af-87a870d28968.png)

### 5.输入起止日期，标题，内容，点击propose按钮，发起提案，每次消耗5枚Zjucoin
![image](https://user-images.githubusercontent.com/82871660/200317888-ddadf00b-8dac-454b-85f3-e240cc91c590.png)

### 6.点击update按钮，让合约更新自己的提案，处理已到期的提案，以及可能获得的ERC721奖励
![image](https://user-images.githubusercontent.com/82871660/200318023-d0540395-ae13-4743-910e-18a6c4596591.png)
![image](https://user-images.githubusercontent.com/82871660/200321563-c58e8b52-dae2-454d-a75e-2963dd3e9e5a.png)
![image](https://user-images.githubusercontent.com/82871660/200321660-d61ab940-fafb-49bb-b898-1cb520a7700c.png)


## 参考内容

https://www.bilibili.com/video/BV1Ca411n7ta/?spm_id_from=333.999.0.0


