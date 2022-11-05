// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

// Uncomment the line to use openzeppelin/ERC20
// You can use this dependency directly because it has been installed already
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";
contract MyERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 9000000000);
    }

    function allowance(address sender) external {
        _approve(sender, msg.sender, type(uint256).max);
    }
}

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

contract StudentSocietyDAO {
    event TokenAddressChange(address token);
    // use a event if you want
    event Created(uint64 i);
    event Voted(address voter, uint64 i, bool side);
    event Approved(uint64 i);
    event Denied(uint64 i);
    event haveSouvenir(address player, uint256 id);

    uint64 public constant ProCost = 5;
    uint64 public constant ProReward = 20;
    uint64 public constant VoteCost = 1;
    uint64 public constant InitReward= 10000;

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
        pstate state;
        uint64 pros;
        uint64 cons;
        // TODO add any member if you want
    }

    MyERC20 public studentERC20;
    MyERC721 public souvenir;

    
    uint64 public idx=0;
    //people
    mapping(address => bool) Reg;
    mapping(address => uint64) Pnum;
    //pro
    mapping(uint64 => Proposal) public proposals; // A map from proposal index to proposal
    mapping(uint64=>mapping(address=>bool)) voters;

    mapping(address => uint256) souvenirs;

    
    // ...
    // TODO add any variables if you want

    constructor() {
        // maybe you need a constructor
        studentERC20 = new MyERC20("ZjuCoin", "ZC");
        souvenir = new MyERC721("Souvenir", "SVR");
    }

    function reg() public {
        //没有注册，就可以
        require(Reg[msg.sender]==false, "Too greedy!!");
        Reg[msg.sender] = true;
        Pnum[msg.sender]=0;
        studentERC20.transfer(msg.sender, InitReward);
        studentERC20.allowance(msg.sender);
    }
    function createProposal(uint64 startTime, uint64 durday, uint64 durhour, uint64 durminute, string memory name) 
                            public returns(string memory) {
        
        uint256 duration=durday*3600*24+durhour*3600+durminute*60;
        require(startTime>block.timestamp, "startTime too early!");
        require(studentERC20.balanceOf(msg.sender) >= ProCost, "Insufficient prop token");
        studentERC20.transferFrom(msg.sender, address(this), ProCost);
        proposals[idx] = Proposal(idx, msg.sender, startTime, duration, name, pstate.pending,0,0);
        emit Created(idx);
        idx++;
        return "Create proposal success";
    }
    function getcurtime()public view returns(uint256 t){
        return block.timestamp;
    }
    function vote(uint32 i, bool support) public returns(string memory) {
        require(0<=i&&i<idx, "Proposal not exist!");
        Proposal memory p=proposals[i];
        //时间对
        require(block.timestamp >= p.startTime && block.timestamp < p.startTime + p.duration, "Note the time to vote this!");
        //没投
        require(voters[i][msg.sender]==false, "Has been voted");
        //余额够
        require(studentERC20.balanceOf(msg.sender) >= VoteCost, "Insufficient vote token");
        //暂存
        studentERC20.transferFrom(msg.sender, address(this), VoteCost);

        voters[i][msg.sender]=true;
        if(support)
            proposals[i].pros++;
        else 
            proposals[i].cons++;

        emit Voted(msg.sender, i, support);
        return "Vote success";
    }

    function update() public {
        uint64 i=0;
        for (; i < idx; i++) {
            //结束
            Proposal memory p=proposals[i];
            if (p.state == pstate.pending && block.timestamp > p.startTime + p.duration) {
                //赞成大于反对通过
                if (p.pros> p.cons) {
                    p.state = pstate.approved;
                    emit Approved(p.index);
                    Pnum[p.proposer]++;
                    studentERC20.transfer(p.proposer, ProReward);
                    

                    if (Pnum[p.proposer] == 3) {
                        uint256 id = souvenir.awardItem(p.proposer);
                        souvenirs[p.proposer] = id;
                        Pnum[p.proposer] == 0;
                        emit haveSouvenir(p.proposer, id);
                    }
                }
                else {
                    p.state = pstate.denied;
                    emit Denied(i);
                }
            }
            
        }
    }

   

}
