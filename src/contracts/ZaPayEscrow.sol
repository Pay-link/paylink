// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ZaPayEscrow
 * @dev A secure escrow contract for holding USDC claims on the Arc network.
 * Funds are locked under a claim hash. The backend admin can release them, 
 * or the sender can refund them after 7 days.
 */

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract ZaPayEscrow {
    address public admin;
    IERC20 public usdc;

    struct Claim {
        address sender;
        uint256 amount;
        uint256 expiresAt;
        bool active;
    }

    mapping(bytes32 => Claim) public claims;

    event Deposited(bytes32 indexed claimHash, address indexed sender, uint256 amount, uint256 expiresAt);
    event Released(bytes32 indexed claimHash, address indexed recipient, uint256 amount);
    event Refunded(bytes32 indexed claimHash, address indexed sender, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    constructor(address _usdcTokenAddress) {
        admin = msg.sender;
        usdc = IERC20(_usdcTokenAddress);
    }

    /**
     * @dev Sender deposits USDC into escrow, tied to a claimHash.
     * Sender must have approved this contract to spend their USDC first.
     */
    function deposit(bytes32 claimHash, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(!claims[claimHash].active, "Claim hash already exists");

        // The 7-day expiration
        uint256 expiresAt = block.timestamp + 7 days;

        claims[claimHash] = Claim({
            sender: msg.sender,
            amount: amount,
            expiresAt: expiresAt,
            active: true
        });

        // Transfer USDC from sender to this contract
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");

        emit Deposited(claimHash, msg.sender, amount, expiresAt);
    }

    /**
     * @dev Admin (ZaPay Backend) releases the funds to the verified recipient.
     */
    function release(bytes32 claimHash, address recipient) external onlyAdmin {
        Claim storage claim = claims[claimHash];
        require(claim.active, "Claim is not active");
        require(block.timestamp <= claim.expiresAt, "Claim has expired, sender must refund");

        claim.active = false;

        require(usdc.transfer(recipient, claim.amount), "USDC transfer failed");

        emit Released(claimHash, recipient, claim.amount);
    }

    /**
     * @dev Original sender can pull their funds back after 7 days if unclaimed.
     */
    function refund(bytes32 claimHash) external {
        Claim storage claim = claims[claimHash];
        require(claim.active, "Claim is not active");
        require(msg.sender == claim.sender, "Only the original sender can refund");
        require(block.timestamp > claim.expiresAt, "Claim has not expired yet");

        claim.active = false;

        require(usdc.transfer(claim.sender, claim.amount), "USDC transfer failed");

        emit Refunded(claimHash, claim.sender, claim.amount);
    }

    /**
     * @dev Allow admin to update the admin address
     */
    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        admin = newAdmin;
    }
}
