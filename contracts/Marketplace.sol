// SPDX-License-Identifier:MIT

pragma solidity ^0.8.2;
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IBEP20.sol";

interface INFT {
    function approve(address to, uint256 tokenId) external;

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    function ownerOf(uint256 tokenId) external view returns (address owner);
}

contract Marketplace is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private _NFTAddresses;

    uint256 feeRate;
    uint256 feeDecimal;

    address feeRecipient;
    IBEP20 token;

    struct Offer {
        uint256 id;
        uint256 tokenId;
        address seller;
        address owner;
        address NFTaddress;
        bool sold;
        uint256 price;
    }

    // acceptable NFTs can listing on marketplace
    address[] addressSet;

    // total number of NFTs on marketplace
    uint256 _totalNFTCount;

    // tokenId to offer mapping
    mapping(uint256 => Offer) iDToOffers_;

    // NFT type to array of tokenIds mapping
    mapping(address => uint256[]) addressToOfferIDs_;

    constructor(
        uint256 feeRate_,
        uint256 feeDecimal_,
        address _tokenAddress
    ) {
        feeDecimal = feeDecimal_;
        feeRate = feeRate_;
        feeRecipient = _msgSender();
        token = IBEP20(_tokenAddress);
    }

    event FeeRateUpdate(
        uint256 feeDecimal,
        uint256 feeRate,
        address feeRecipient
    );
    event OfferAdded(
        uint256 id,
        uint256 tokenId,
        address seller,
        address owner,
        address NFTaddress,
        uint256 price
    );

    event OfferCancelled(uint256 id);
    event ExecuteOffer(
        uint256 id,
        address seller,
        address buyer,
        uint256 tokenId,
        uint256 price
    );

    function makeOffer(
        uint256 _tokenId,
        uint256 _price,
        address _NFTaddress
    ) external {
        require(
            _NFTAddresses.contains(_NFTaddress),
            "Marketplace does not support this NFT"
        );

        INFT nft = INFT(_NFTaddress);
        require(
            _msgSender() == nft.ownerOf(_tokenId),
            "Marketplace: only nft owner can make offer"
        );

        nft.transferFrom(_msgSender(), address(this), _tokenId);
        token.transferFrom(_msgSender(), address(this), _calculateFee(_price));
        Offer memory newOffer = Offer(
            _totalNFTCount,
            _tokenId,
            _msgSender(),
            address(this),
            _NFTaddress,
            false,
            _price
        );

        iDToOffers_[_totalNFTCount] = newOffer;
        addressToOfferIDs_[_NFTaddress].push(_totalNFTCount);

        emit OfferAdded(
            _totalNFTCount,
            _tokenId,
            _msgSender(),
            address(this),
            _NFTaddress,
            _price
        );
        _totalNFTCount++;
    }

    function cancelOffer(uint256 _tokenId, address _NFTaddress) external {
        require(
            iDToOffers_[_tokenId].seller == _msgSender(),
            "Only owner can cancel offer"
        );
        require(!iDToOffers_[_tokenId].sold, "Marketplace: Offer is already sold");
        require(
            _NFTAddresses.contains(_NFTaddress),
            "Marketplace: NFT address is not supported"
        );
        INFT nft = INFT(_NFTaddress);

        // return the NFT to the seller
        nft.transferFrom(address(this), _msgSender(), _tokenId);

        delete iDToOffers_[_tokenId];
        _removeFromArray(addressToOfferIDs_[_msgSender()], _tokenId);

        _totalNFTCount--;
        emit OfferCancelled(_tokenId);
    }

    function executeOffer(uint256 _tokenId, address _NFTaddress) external {
        require(
            iDToOffers_[_tokenId].sold == false,
            "Marketplace: Offer is already sold"
        );
        require(
            iDToOffers_[_tokenId].seller != _msgSender(),
            "Marketplace: Owner cannot execute offer"
        );
        require(
            _NFTAddresses.contains(_NFTaddress),
            "Marketplace: NFT address is not supported"
        );
        Offer storage offer = iDToOffers_[_tokenId];
        INFT nft = INFT(_NFTaddress);
        token.transferFrom(
            _msgSender(),
            offer.seller,
            _calculateFee(offer.price)
        );
        nft.transferFrom(address(this), _msgSender(), _tokenId);

        iDToOffers_[_tokenId].sold = true;
        emit ExecuteOffer(
            _tokenId,
            iDToOffers_[_tokenId].seller,
            _msgSender(),
            _tokenId,
            iDToOffers_[_tokenId].price
        );
    }

    function getFeeInfo()
        external
        view
        returns (
            uint256,
            uint256,
            address
        )
    {
        return (feeRate, feeDecimal, feeRecipient);
    }

    function getOffer (uint256 _tokenId) external view returns( Offer memory ) {
        return iDToOffers_[_tokenId];
    }

    function updateFee(
        uint256 _feeRate,
        uint256 _feeDecimal,
        address _feeRecipient
    ) external onlyOwner {
        feeDecimal = _feeDecimal;
        feeRate = _feeRate;
        feeRecipient = _feeRecipient;
        emit FeeRateUpdate(feeDecimal, feeRate, _feeRecipient);
    }

    function addNewNFTType(address _NFTaddress) public onlyOwner {
        require(
            _NFTaddress != address(0),
            "Marketplace: NFT address is not valid"
        );
        require(
            _NFTAddresses.add(_NFTaddress),
            "Marketplace: NFT address already exists"
        );
    }

    function removeNFTType(address _NFTaddress) public onlyOwner {
        require(
            _NFTAddresses.remove(_NFTaddress),
            "Marketplace: NFT address does not exist"
        );
    }

    function getNFTTypes() public view returns (address[] memory) {
        return _NFTAddresses.values();
    }

    function _removeFromArray(uint256[] storage _arr, uint256 _value) private {
        for (uint256 i = 0; i < _arr.length; i++) {
            if (_arr[i] == _value) {
                _arr[i] = _arr[_arr.length - 1];
                _arr.pop();
                return;
            }
        }
    }

    function _calculateFee(uint256 _price) private view returns (uint256) {
        return (_price * feeRate) / 10**feeDecimal;
    }
}
