// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Constants.sol";

interface IRandom {
    function getRandomNumber(uint16 _min, uint16 _max)
        external
        returns (uint256);
}

contract MintingScrollNFT is ERC721Enumerable, Ownable {
    using Constants for Constants.Quality;

    IRandom iRandom;

    uint256 idCounter;

    constructor(address _iRandom) ERC721("MintingScrollNFT", "MSFT") {
        idCounter = 1;
        iRandom = IRandom(_iRandom);
    }

    struct Scroll {
        uint256 id;
        Constants.Quality quality;
        address owner;
    }

    mapping(uint256 => Scroll) public allScroll_;

    event MintScroll(
        address indexed to,
        uint256 tokenId,
        Constants.Quality quality
    );

    event BurnScroll(address indexed from, uint256 tokenId);
    event TransferScroll(
        address indexed from,
        address indexed to,
        uint256 tokenId
    );

    function mintScroll(address _to) external onlyOwner {
        Scroll memory scroll = Scroll(idCounter, _getRanDomQuality(), _to);
        allScroll_[idCounter] = scroll;
        _safeMint(_to, idCounter);
        emit MintScroll(_to, idCounter, scroll.quality);
        idCounter++;
    }

    function transferScroll(
        address _from,
        address _to,
        uint256 _tokenId
    ) external {
        allScroll_[_tokenId].owner = _to;
        transferFrom(_from, _to, _tokenId);
        emit TransferScroll(_from, _to, _tokenId);
    }

    function _getRanDomQuality() private  returns (Constants.Quality) {
        return Constants.Quality(iRandom.getRandomNumber(0, 4));
        // return Constants.Quality(1);
    }

    function burnScroll(uint256 _tokenId) external {
     
        _burn(_tokenId);
        emit BurnScroll(msg.sender, _tokenId);
        delete allScroll_[_tokenId];
    }

    function getScroll(uint256 _tokenId) external view returns (Scroll memory) {
        return allScroll_[_tokenId];
    }

    function getQualityOfScroll(uint256 _tokenId) external view returns (Constants.Quality) {
        return allScroll_[_tokenId].quality;
    }

    function getOnwerOfScroll(uint256 _tokenId) external view returns (address) {
        return allScroll_[_tokenId].owner;
    }
}
