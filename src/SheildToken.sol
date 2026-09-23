// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ShieldToken - simplified ERC-271 (SHIELD) fungible-token path
/// @notice Implements: investor whitelist + per-holder lock-up period
contract ShieldToken {
    string public name = "ShieldToken";
    string public symbol = "SHLD";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // address => allowed to hold/send/receive tokens
    mapping(address => bool) public whitelisted;

    // address => timestamp before which they cannot SEND tokens
    mapping(address => uint256) public lockUntil;

    event WhitelistUpdated(address indexed investor, bool status);
    event LockUpSet(address indexed investor, uint256 unlockTime);
    event TransferRejected(address indexed from, address indexed to, string reason);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    constructor(uint256 initialSupply) {
        owner = msg.sender;
        // Owner starts whitelisted so they can distribute tokens
        whitelisted[msg.sender] = true;
        _mint(msg.sender, initialSupply);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _update(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 approved = allowance[from][msg.sender];
        require(approved >= value, "ERC20: insufficient allowance");
        allowance[from][msg.sender] = approved - value;
        emit Approval(from, msg.sender, allowance[from][msg.sender]);
        _update(from, to, value);
        return true;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Admin adds or removes an investor from the whitelist
    function setWhitelist(address investor, bool status) external onlyOwner {
        whitelisted[investor] = status;
        emit WhitelistUpdated(investor, status);
    }

    /// @notice Admin locks an investor's tokens until a future timestamp
    function setLockUp(address investor, uint256 unlockTime) external onlyOwner {
        lockUntil[investor] = unlockTime;
        emit LockUpSet(investor, unlockTime);
    }

    function _mint(address to, uint256 value) internal {
        totalSupply += value;
        _update(address(0), to, value);
    }

    function _update(address from, address to, uint256 value) internal {
        // Skip checks on mint (from == address(0))
        if (from != address(0)) {
            if (!whitelisted[from]) {
                emit TransferRejected(from, to, "sender not whitelisted");
                revert("ShieldToken: sender not whitelisted");
            }
            if (block.timestamp < lockUntil[from]) {
                emit TransferRejected(from, to, "sender locked up");
                revert("ShieldToken: tokens locked");
            }
        }
        if (to != address(0) && !whitelisted[to]) {
            emit TransferRejected(from, to, "receiver not whitelisted");
            revert("ShieldToken: receiver not whitelisted");
        }

        if (from == address(0)) {
            balanceOf[to] += value;
        } else {
            require(balanceOf[from] >= value, "ERC20: transfer amount exceeds balance");
            balanceOf[from] -= value;
            if (to == address(0)) {
                totalSupply -= value;
            } else {
                balanceOf[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }
}