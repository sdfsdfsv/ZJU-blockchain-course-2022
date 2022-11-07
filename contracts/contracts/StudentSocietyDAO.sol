// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

// Uncomment the line to use openzeppelin/ERC20
// You can use this dependency directly because it has been installed already
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

//重写erc20函数
contract MyERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 9000000000);
    }

    function allowance(address sender) external {
        _approve(sender, msg.sender, type(uint256).max);
    }
}

//重写erc721函数
contract MyERC721 is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    event award(address, uint256);

    mapping (uint256 => string) private _tokenURIs;
 

    constructor(string memory name, string memory symbol) public ERC721(name, symbol) {}
    

    function awardItem(address player) public returns(uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(player, newItemId);

        emit award(player, newItemId);
        return newItemId;
    }


    function getTokenURI(uint256 tokenId) view external returns(string memory) {
        return _tokenURIs[tokenId];
    }
}

//合约
contract StudentSocietyDAO {
    //触发的事件
    event Reged(address reger);//注册
    event Created(uint64 i);//
    event Voted(address voter, uint64 i, bool side);
    event Approved(uint64 i,string name);
    event Denied(uint64 i,string name);
    event getAward(address player, uint256 id);

    //数据数值
    uint64 public constant ProCost = 5;
    uint64 public constant ProReward = 20;
    uint64 public constant VoteCost = 1;
    uint64 public constant InitReward= 10000;

    //合约状态
    enum pstate{
        pending,
        approved,
        denied
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

    //erc20和erc721实例
    MyERC20 public studentERC20;
    MyERC721 public award;

    
    uint64 public idx=0;
    //people
    mapping(address => bool) Reg;
    mapping(address => uint64) Pnum;
    //pro
    mapping(uint64 => Proposal) public proposals; // A map from proposal index to proposal
    mapping(uint64=>mapping(address=>bool)) voters;

    mapping(address => uint256) awards;


    //构造20和721
    constructor() {
        studentERC20 = new MyERC20("ZjuCoin", "ZC");
        award = new MyERC721("Zjuaward", "AW");
    }

    //用户注册
    function reg() public {
        //没有注册，就可以空投，已经注册，返回too greedy
        require(Reg[msg.sender]==false, "Too greedy!!");
        //是否注册
        Reg[msg.sender] = true;
        //成功提案数
        Pnum[msg.sender]=0;
        studentERC20.transfer(msg.sender, InitReward);
        //事先委托初始金额
        studentERC20.allowance(msg.sender);
        emit Reged(msg.sender);
    }

    //发起提案，由于时间
    function createProposal(uint64 startTime, uint64 duration, string memory name,string memory content) 
                            public returns(string memory) {
        //不够
        require(studentERC20.balanceOf(msg.sender) >= ProCost, "Insufficient prop token");
        //钱转合约账号
        studentERC20.transferFrom(msg.sender, address(this), ProCost);
        //产生提案
        proposals[idx] = Proposal(idx, msg.sender, startTime, duration, name, content, pstate.pending,0,0);
        emit Created(idx);
        idx++;
        return "Create proposal success";
    }


    //投票 i--投的提案序号， support--是否支持
    function vote(uint32 i, bool support) public returns(string memory) {
        require(0<=i&&i<idx, "Proposal not exist!");
        Proposal memory p=proposals[i];
        //时间对
        require(block.timestamp < p.startTime + p.duration, "Note the time to vote this!");
        //没投
        require(voters[i][msg.sender]==false, "Has been voted");
        //余额够
        require(studentERC20.balanceOf(msg.sender) >= VoteCost, "Insufficient vote token");
        //暂存
        studentERC20.transferFrom(msg.sender, address(this), VoteCost);
        //设置已投，不能再投
        voters[i][msg.sender]=true;
        //修改提案的支持反对数
        if(support)
            proposals[i].pros++;
        else 
            proposals[i].cons++;

        emit Voted(msg.sender, i, support);
        return "Vote success";
    }
    function getBalance()public view returns(uint256 balance){
        return studentERC20.balanceOf(msg.sender);
    }

    function update() public returns(uint64 , Proposal[20] memory, uint256){
        Proposal[20] memory ret;
        uint64 i=0;
        uint64 reti=0;
        uint256 awardid=0;
        for (; i < idx; i++) {
            //结束
            Proposal memory p=proposals[i];
            //更新自己的提案状态
            if(p.proposer!=msg.sender)continue;
            //如果提案还在进行且时间已过
            if (p.state == pstate.pending && block.timestamp > p.startTime + p.duration) {
                //赞成大于反对通过
                if (p.pros> p.cons) {
                    p.state = pstate.approved;
                    emit Approved(p.index,p.name);
                    Pnum[p.proposer]++;
                    studentERC20.transfer(p.proposer, ProReward);
                    //有3个则得到奖励，写入区块
                    if (Pnum[p.proposer] == 3) {
                        awardid = award.awardItem(p.proposer);
                        awards[p.proposer] = awardid;
                        Pnum[p.proposer] == 0;
                        emit getAward(p.proposer, awardid);
                    }
                }
                else {
                    p.state = pstate.denied;
                    emit Denied(i,p.name);
                }
                ret[reti]=p;
                reti++;
                proposals[i]=p;
            }
        }
        return (reti, ret, awardid);
    }
}
