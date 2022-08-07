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

    function balanceOf(address owner) external view returns (uint256);

    function tokenOfOwnerByIndex(address owner, uint256 index)
        external
        view
        returns (uint256);

    function name() external view returns (string memory);
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
    uint256 public _totalNFTCount;

    // offerId to offer mapping
    mapping(uint256 => Offer)public  iDToOffers_;

    // NFT type to array of tokenIds mapping
    mapping(address => uint256[])public addressToOfferIDs_;

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

    function getNFTsOfNFTtype(address NFTaddress) public view returns (uint256[] memory) {
        return addressToOfferIDs_[NFTaddress];
    }

    function getNFTidsOfUser(address _NFTaddress)
        external
        view
        returns (uint256[] memory)
    {
        require(
            _NFTAddresses.contains(_NFTaddress),
            "Marketplace does not support this NFT"
        );
        INFT nft = INFT(_NFTaddress);
        uint256[] memory ids = new uint256[](nft.balanceOf(_msgSender()));
        for (uint256 i = 0; i < nft.balanceOf(_msgSender()); i++) {
            ids[i] = nft.tokenOfOwnerByIndex(_msgSender(), i);
        }
        return ids;
    }

    function getTotalItemOfNFT(address _nftAddress)
        external
        view
        returns (uint256 length)
    {
        return addressToOfferIDs_[_nftAddress].length;
    }

    function makeOffer(
        uint256 _offerId,
        uint256 _price,
        address _NFTaddress
    ) external {
        require(
            _NFTAddresses.contains(_NFTaddress),
            "Marketplace does not support this NFT"
        );

        INFT nft = INFT(_NFTaddress);
        require(
            _msgSender() == nft.ownerOf(_offerId),
            "Marketplace: only nft owner can make offer"
        );

        token.transferFrom(_msgSender(), address(this), _calculateFee(_price));
        nft.transferFrom(_msgSender(), address(this), _offerId);
        Offer memory newOffer = Offer(
            _totalNFTCount,
            _offerId,
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
            _offerId,
            _msgSender(),
            address(this),
            _NFTaddress,
            _price
        );
        _totalNFTCount++;
    }



    //_tokenId is offerId
    function cancelOffer(uint256 _offerId, address _NFTaddress) external {
        require(
            iDToOffers_[_offerId].seller == _msgSender(),
            "Only owner can cancel offer"
        );
        require(
            !iDToOffers_[_offerId].sold,
            "Marketplace: Offer is already sold"
        );
        require(
            _NFTAddresses.contains(_NFTaddress),
            "Marketplace: NFT address is not supported"
        );
        INFT nft = INFT(_NFTaddress);

        // return the NFT to the seller
        nft.transferFrom(address(this), _msgSender(), iDToOffers_[_offerId].tokenId);

        delete iDToOffers_[_offerId];
        _removeFromArray(addressToOfferIDs_[_NFTaddress], _offerId);

        _totalNFTCount--;
        emit OfferCancelled(_offerId);
    }


    
    function executeOffer(uint256 _offerId, address _NFTaddress) external {
        require(
            iDToOffers_[_offerId].sold == false,
            "Marketplace: Offer is already sold"
        );
        require(
            iDToOffers_[_offerId].seller != _msgSender(),
            "Marketplace: Owner cannot execute offer"
        );
        require(
            _NFTAddresses.contains(_NFTaddress),
            "Marketplace: NFT address is not supported"
        );
        Offer storage offer = iDToOffers_[_offerId];
        INFT nft = INFT(_NFTaddress);
        token.transferFrom(
            _msgSender(),
            offer.seller,
            _calculateFee(offer.price)
        );

        nft.transferFrom(address(this), _msgSender(), offer.tokenId);

        iDToOffers_[_offerId].sold = true;
        _removeFromArray(addressToOfferIDs_[_NFTaddress], _offerId);
        emit ExecuteOffer(
            _offerId,
            iDToOffers_[_offerId].seller,
            _msgSender(),
            offer.tokenId,
            iDToOffers_[_offerId].price
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

    function getOffer(uint256 _offerId) external view returns (Offer memory) {
        return iDToOffers_[_offerId];
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
