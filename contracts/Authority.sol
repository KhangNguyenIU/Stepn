//SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
contract Authority is Ownable{

    mapping (address => bool) authority_;

    constructor(){
        authority_[msg.sender] = true;
    }

    event EditAuthority(address _authority, bool _isAuthority);
    function editAuthority(address _authority, bool _isAuthority) public onlyOwner() {
        authority_[_authority] = _isAuthority;
        emit EditAuthority(_authority, _isAuthority);
    }

    modifier checkAuthority(){
        require (authority_[_msgSender()] == true,"Unauthorized");
        _;
    }
}