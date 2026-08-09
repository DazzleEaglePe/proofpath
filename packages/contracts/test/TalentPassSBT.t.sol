// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TalentPassSBT} from "../src/TalentPassSBT.sol";

contract TalentPassSBTTest is Test {
    TalentPassSBT internal pass;

    address internal minter = address(0xBEEF);
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    string internal constant CID = "bafybeigdyrztexamplecid";

    event TalentPassMinted(address indexed holder, uint256 indexed tokenId, string cid);

    function setUp() public {
        pass = new TalentPassSBT(minter);
    }

    function test_MintTalentPass_Success() public {
        vm.expectEmit(true, true, false, true);
        emit TalentPassMinted(alice, 1, CID);

        vm.prank(minter);
        uint256 tokenId = pass.mint(alice, CID);

        assertEq(tokenId, 1, "el primer tokenId arranca en 1");
        assertEq(pass.ownerOf(tokenId), alice);
        assertEq(pass.tokenIdOf(alice), 1);
        assertEq(pass.tokenURI(tokenId), CID);
        assertEq(pass.balanceOf(alice), 1);
    }

    function test_MintTalentPass_RevertsIfAlreadyHasPass() public {
        vm.prank(minter);
        pass.mint(alice, CID);

        vm.prank(minter);
        vm.expectRevert(abi.encodeWithSelector(TalentPassSBT.AlreadyHasPass.selector, alice));
        pass.mint(alice, CID);
    }

    /// @dev El test que prueba que es soulbound. Si este cae, el SBT no es un SBT.
    function test_Transfer_Reverts() public {
        vm.prank(minter);
        uint256 tokenId = pass.mint(alice, CID);

        vm.prank(alice);
        vm.expectRevert(TalentPassSBT.SoulboundTransferBlocked.selector);
        pass.transferFrom(alice, bob, tokenId);

        vm.prank(alice);
        vm.expectRevert(TalentPassSBT.SoulboundTransferBlocked.selector);
        pass.safeTransferFrom(alice, bob, tokenId);

        assertEq(pass.ownerOf(tokenId), alice, "el pass no se movio");
    }

    function test_Mint_RevertsIfNotMinter() public {
        vm.prank(alice);
        vm.expectRevert(TalentPassSBT.NotMinter.selector);
        pass.mint(alice, CID);
    }

    function test_TokenIdsSonSecuencialesPorHolder() public {
        vm.startPrank(minter);
        uint256 a = pass.mint(alice, CID);
        uint256 b = pass.mint(bob, CID);
        vm.stopPrank();

        assertEq(a, 1);
        assertEq(b, 2);
    }
}
