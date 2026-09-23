// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ShieldToken} from "../src/SheildToken.sol";

contract ShieldTokenTest is Test {
	ShieldToken private token;

	address private investor = makeAddr("investor");
	address private recipient = makeAddr("recipient");

	uint256 private constant INITIAL_SUPPLY = 1_000_000 ether;

	function setUp() public {
		token = new ShieldToken(INITIAL_SUPPLY);
	}

	function testConstructorSetsTokenDetailsAndMintsOwner() public {
		assertEq(token.name(), "ShieldToken");
		assertEq(token.symbol(), "SHLD");
		assertEq(token.decimals(), 18);
		assertEq(token.totalSupply(), INITIAL_SUPPLY);
		assertEq(token.balanceOf(address(this)), INITIAL_SUPPLY);
		assertTrue(token.whitelisted(address(this)));
	}

	function testOwnerCanWhitelistInvestor() public {
		token.setWhitelist(investor, true);

		assertTrue(token.whitelisted(investor));
	}

	function testNonOwnerCannotWhitelistInvestor() public {
		vm.prank(investor);
		vm.expectRevert();
		token.setWhitelist(recipient, true);
	}

	function testTransferRequiresWhitelistedReceiver() public {
		vm.expectRevert(bytes("ShieldToken: receiver not whitelisted"));
		token.transfer(investor, 100 ether);
	}

	function testWhitelistedInvestorCanReceiveAndSendTokens() public {
		token.setWhitelist(investor, true);
		token.setWhitelist(recipient, true);
		token.transfer(investor, 100 ether);

		vm.prank(investor);
		token.transfer(recipient, 40 ether);

		assertEq(token.balanceOf(investor), 60 ether);
		assertEq(token.balanceOf(recipient), 40 ether);
	}

	function testRemovedInvestorCannotSendTokens() public {
		token.setWhitelist(investor, true);
		token.setWhitelist(recipient, true);
		token.transfer(investor, 100 ether);
		token.setWhitelist(investor, false);

		vm.prank(investor);
		vm.expectRevert(bytes("ShieldToken: sender not whitelisted"));
		token.transfer(recipient, 1 ether);
	}

	function testOwnerCanSetLockUp() public {
		uint256 unlockTime = block.timestamp + 1 days;

		token.setLockUp(investor, unlockTime);

		assertEq(token.lockUntil(investor), unlockTime);
	}

	function testLockedInvestorCannotSendTokens() public {
		token.setWhitelist(investor, true);
		token.setWhitelist(recipient, true);
		token.transfer(investor, 100 ether);
		token.setLockUp(investor, block.timestamp + 1 days);

		vm.prank(investor);
		vm.expectRevert(bytes("ShieldToken: tokens locked"));
		token.transfer(recipient, 1 ether);
	}

	function testInvestorCanSendAtUnlockTime() public {
		token.setWhitelist(investor, true);
		token.setWhitelist(recipient, true);
		token.transfer(investor, 100 ether);

		uint256 unlockTime = block.timestamp + 1 days;
		token.setLockUp(investor, unlockTime);
		vm.warp(unlockTime);

		vm.prank(investor);
		token.transfer(recipient, 1 ether);

		assertEq(token.balanceOf(recipient), 1 ether);
	}

	function testNonOwnerCannotSetLockUp() public {
		vm.prank(investor);
		vm.expectRevert();
		token.setLockUp(investor, block.timestamp + 1 days);
	}
}
