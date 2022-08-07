import React, { createContext, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import address from '../address/contractAddress.json'
import { SneakerNFTabi, Marketplaceabi, GemNFTabi, MintingScrollNFTabi, ShoeBoxNFTabi, GSTTokenabi, Move2Earnabi, MysteryBoxabi } from '../abi/index.js'
import { COMBINE_PRICE, EQUIP_GEM_PRICE, LEVELING_PRICE, REPAIR_PRICE } from '../Constants'

const { ethereum } = window

export const MoveContext = createContext()

const getContract = (address, abi) => {
    const provider = new ethers.providers.Web3Provider(ethereum)
    const signer = provider.getSigner()
    const transactionContract = new ethers.Contract(
        address, abi, signer
    )
    return transactionContract
}

export const MoveProvider = ({ children }) => {

    const [currentAccount, setCurrentAccount] = useState('')
    const [notify, setNotify] = useState({
        message: '',
        type: ''
    })
    const [loading, setLoading] = useState(false)
    const [balance, setBalance] = useState(0)
    const [energy, setEnergy] = useState({
        energy: 0,
        maxEnergy: 0
    })

    const checkMetamask = () => {
        if (!ethereum) {
            alert("Please enable metamask")
            throw new Error("Metamask is not installed")
        }
    }

    const connectWallet = async () => {
        try {
            checkMetamask();
            const accounts = await ethereum.request({
                method: "eth_requestAccounts",
            });
            setCurrentAccount(accounts[0])
            console.log(accounts[0])
        } catch (error) {
            // await ethereum.enable();
        }
    };

    const checkIfWalletIsConnected = async () => {
        try {
            checkMetamask()
            const accounts = await ethereum.request({ method: "eth_accounts" })
            if (accounts.length) {
                setCurrentAccount(accounts[0])
                return true
            }
            else
                return false
        } catch (error) {
            throw new Error("Error")
        }
    }

    const setNotification = (message, type) => {
        setNotify(prev => ({
            ...prev,
            message,
            type
        }))
    }

    /**
     * 
     * @param {*} nftType ("sneaker", "gem", "mintingScroll", "shoeBox")
     * @returns return list of NFTs of one NFT type that are selling on Marketplace
     */
    const getListNFTsListingOnMarketplace = async (nftType) => {
        const Marketplace = getContract(address.marketplace, Marketplaceabi)

        let idsList = []
        let nftList = []
        switch (nftType) {
            case 'sneaker':
                const Sneaker = await getContract(address.sneakerNFT, SneakerNFTabi)
                idsList = await Marketplace.getNFTsOfNFTtype(address.sneakerNFT)
                await Promise.all(idsList.map(async (id) => {
                    const offerSneaker = await Marketplace.getOffer(id)
                    const sneaker = await Sneaker.getSneaker(offerSneaker.tokenId.toString())
                    if (!offerSneaker.sold) {
                        nftList.push({
                            id,
                            sneaker,
                            offerSneaker
                        })
                    }

                }))
                break;
            case 'gem':
                const Gem = await getContract(address.gemNFT, GemNFTabi)
                idsList = await Marketplace.getNFTsOfNFTtype(address.gemNFT)
                await Promise.all(idsList.map(async (id) => {
                    const offerGem = await Marketplace.getOffer(id)
                    const gem = await Gem.getGem(offerGem.tokenId.toString())
                    nftList.push({
                        id,
                        gem,
                        offerGem
                    })
                }))
                break;
            case 'mintingScroll':
                const MintingScroll = await getContract(address.mintingScrollNFT, MintingScrollNFTabi)
                idsList = await Marketplace.getNFTsOfNFTtype(address.mintingScrollNFT)
                await Promise.all(idsList.map(async (id) => {
                    const offerMintingScroll = await Marketplace.getOffer(id)
                    const mintingScroll = await MintingScroll.getScroll(offerMintingScroll.tokenId.toString())
                    nftList.push({
                        id,
                        mintingScroll,
                        offerMintingScroll
                    })
                }))
                break;
            default:
                const ShoeBox = await getContract(address.shoeBoxNFT, ShoeBoxNFTabi)

                idsList = await Marketplace.getNFTsOfNFTtype(address.shoeBoxNFT)
                await Promise.all(idsList.map(async (id) => {
                    const offerShoeBox = await Marketplace.getOffer(id)
                    const shoeBox = await ShoeBox.getShoeBox(offerShoeBox.tokenId.toString())
                    if (!offerShoeBox.sold) {
                        nftList.push({
                            id,
                            shoeBox,
                            offerShoeBox
                        })
                    }

                }))
                break;
        }
        return nftList
    }

    /**
     * 
     * @param {*} nftAddress address of NFT type
     * @returns return nfts list of 1 NFT type owned by user
     */
    const getListNFTsofAddress = async (nftAddress) => {
        const Marketplace = await getContract(address.marketplace, Marketplaceabi)
        const ids = await Marketplace.getNFTidsOfUser(nftAddress)
        return ids
    }


    /**
     * 
     * @param {*} nftType 
     * @returns return list of sneakerNFT own by an address
     */
    const getListNFTsOfaUser = async (nftType) => {
        let listIds
        let listSneakers;
        switch (nftType) {
            case 'sneaker':
                listIds = await getListNFTsofAddress(address.sneakerNFT)
                listSneakers = await fetchSneakers(listIds)
                return listSneakers
            case 'gem':
                listIds = await getListNFTsofAddress(address.gemNFT)
                listSneakers = await fetchGems(listIds)
                return listSneakers
            case 'mintingScroll':
                listIds = await getListNFTsofAddress(address.mintingScrollNFT)
                listSneakers = await fetchMintingScrolls(listIds)
                return listSneakers
            default:
                listIds = await getListNFTsofAddress(address.shoeBoxNFT)
                listSneakers = await fetchShoeBoxs(listIds)
                return listSneakers
        }
    }

    const equipGem =async (sneakerId, gemId, slotId, callback) =>{
        try{
            console.log({sneakerId, gemId, slotId})
            setLoading(true)
            const SneakerNFT = await getContract(address.sneakerNFT, SneakerNFTabi)
            const GSTToken = await getContract(address.GSTToken, GSTTokenabi)
            await (await GSTToken.approve(address.sneakerNFT, EQUIP_GEM_PRICE)).wait()
            const tx =await (await SneakerNFT.equipGem(sneakerId, gemId, slotId)).wait()
            console.log({tx})
            const newBalance = await GSTToken.balanceOf(currentAccount)
            setBalance(newBalance)
            setLoading(false)
            callback()
        }catch(error){
            console.log({error})
            setNotification(error?.error?.data?.message || "falied to equip gem", 'error')
            setLoading(false)
        }
    }

    const openShoeBox = async (tokenId, callback) => {
        try {
            setLoading(true)
            const ShoeBox = await getContract(address.shoeBoxNFT, ShoeBoxNFTabi)
            const tx = await (await ShoeBox.open(tokenId)).wait()
            setLoading(false)
            setNotification("ShoeBox opened", "success")
            callback()
        } catch (error) {
            setLoading(false)
            setNotification("failed to open shoebox", "error")
        }
    }

    const makeOffer = async (tokenId, price, nftType, callback) => {
        setLoading(true)
        let NFTContract;
        let nftAddress;
        switch (nftType) {
            case 'sneaker':
                nftAddress = address.sneakerNFT
                NFTContract = await getContract(address.sneakerNFT, SneakerNFTabi)
                break;
            case 'gem':
                nftAddress = address.gemNFT
                NFTContract = await getContract(address.gemNFT, GemNFTabi)
                break;
            case 'mintingScroll':
                nftAddress = address.mintingScrollNFT
                NFTContract = await getContract(address.mintingScrollNFT, MintingScrollNFTabi)
                break;
            default:
                nftAddress = address.shoeBoxNFT
                NFTContract = await getContract(address.shoeBoxNFT, ShoeBoxNFTabi)
                break;
        }
        try {
            const Marketplace = await getContract(address.marketplace, Marketplaceabi)
            const GSTToken = await getContract(address.GSTToken, GSTTokenabi)
            await (await GSTToken.approve(Marketplace.address, price))
            await (await NFTContract.setApprovalForAll(address.marketplace, true)).wait()
            const tx = await (await Marketplace.makeOffer(tokenId, price, nftAddress)).wait()
            const newBalance = await getUserBalance(currentAccount)
            setBalance(newBalance)
            setLoading(false)
            setNotification('Offer made successfully', 'success')
            callback()
        } catch (error) {
            // console.log({ error })
            setLoading(false)
            setNotification("Failed to list NFT on marketplace", "error")
        }
    }

    const executeOffer = async (tokenId, price, nftType, callback) => {
        setLoading(true)
        let NFTContract;
        let nftAddress;
        switch (nftType) {
            case 'sneaker':
                nftAddress = address.sneakerNFT
                NFTContract = await getContract(address.sneakerNFT, SneakerNFTabi)
                break;
            case 'gem':
                nftAddress = address.gemNFT
                NFTContract = await getContract(address.gemNFT, GemNFTabi)
                break;
            case 'mintingScroll':
                nftAddress = address.mintingScrollNFT
                NFTContract = await getContract(address.mintingScrollNFT, MintingScrollNFTabi)
                break;
            default:
                nftAddress = address.shoeBoxNFT
                NFTContract = await getContract(address.shoeBoxNFT, ShoeBoxNFTabi)
                break;
        }
        try {
            const Marketplace = await getContract(address.marketplace, Marketplaceabi)
            const GSTToken = await getContract(address.GSTToken, GSTTokenabi)
            await (await GSTToken.approve(address.marketplace, price)).wait()
            console.log({ tokenId, nftAddress, market: Marketplace.address })
            const tx = await (await Marketplace.executeOffer(tokenId, nftAddress)).wait()
            console.log({ tx })
            setLoading(false)
            setNotification('Offer executed successfully', 'success')
            // if (typeof callback == 'function') {
            callback()
            // }
        } catch (error) {
            // console.log({ error })
            setLoading(false)
            setNotification("Failed to execute offer", "error")
        }
    }

    const fetchSneakers = async (listIds, page = 0, limit = 10) => {
        const SneakerNFT = await getContract(address.sneakerNFT, SneakerNFTabi)
        let listSneakers = []
        if (listIds.length === 0) return []
        await Promise.all(listIds.slice(page * limit, page * limit + limit).map(async (id) => {
            const sneaker = await SneakerNFT.getSneaker(id)
            listSneakers.push(sneaker)
        }))

        return listSneakers
    }

    const fetchGems = async (listIds) => {
        const GemNFT = await getContract(address.gemNFT, GemNFTabi)
        let listGems = []
        if (listIds.length === 0) return []
        await Promise.all(listIds.map(async (id) => {
            const gem = await GemNFT.getGem(id)
            listGems.push(gem)
        }
        ))
        return listGems
    }

    const fetchMintingScrolls = async (listIds) => {
        const MintingScrollNFT = await getContract(address.mintingScrollNFT, MintingScrollNFTabi)
        let listMintingScrolls = []
        if (listIds.length === 0) return []
        await Promise.all(listIds.map(async (id) => {
            const mintingScroll = await MintingScrollNFT.getScroll(id)
            listMintingScrolls.push(mintingScroll)
        }
        ))
        return listMintingScrolls
    }

    const fetchShoeBoxs = async (listIds) => {
        const ShoeBoxNFT = await getContract(address.shoeBoxNFT, ShoeBoxNFTabi)
        let listShoeBoxes = []
        if (listIds.length === 0) return []
        await Promise.all(listIds.map(async (id) => {
            const shoeBox = await ShoeBoxNFT.getShoeBox(id)
            listShoeBoxes.push(shoeBox)
        }
        ))
        return listShoeBoxes
    }



    const move2Earn = async (tokenId, speed, duration, gpsSignal = true) => {
        try {
            setLoading(true)
            const Move2Earn = await getContract(address.move2Earn, Move2Earnabi)
            const GSTToken = await getContract(address.GSTToken, GSTTokenabi)

            await GSTToken.approve(Move2Earn.address, speed)
            const tx = await (await Move2Earn.move2Earn(tokenId, speed, duration, gpsSignal)).wait()
            console.log({ tx })
            const reward = tx.events.filter(x => x.event = "Reward")
            console.log({ reward })
            const newEnergy = await getUserEnergy(currentAccount)
            setEnergy(newEnergy)
            const newBalance = await getUserBalance(currentAccount)
            setBalance(newBalance)
            setLoading(false)
        } catch (error) {
            setLoading(false)
            console.log(error)

        }
    }

    const levelUpSneaker = async (tokenId, callback) => { 
        try {
            setLoading(true)
            const SneakerNFT = await getContract(address.sneakerNFT, SneakerNFTabi)
            const GSTToken = await getContract(address.GSTToken, GSTTokenabi)
            await (await GSTToken.approve(address.sneakerNFT, LEVELING_PRICE)).wait()
            const tx = await (await SneakerNFT.levelingSneaker(tokenId)).wait()
            console.log({ tx })
           SneakerNFT.on('Leveling',res=>{
            console.log({res})
           })
            const newBalance = await getUserBalance(currentAccount)
            setBalance(newBalance)
            setLoading(false)
            callback()
        } catch (error) {
            setLoading(false)
            console.log(error)
        }
    }

    const combine = async (gemList, callback) => {
        try {
            setLoading(true)
            const GemNFT = await getContract(address.gemNFT, GemNFTabi)
            const GSTToken = await getContract(address.GSTToken, GSTTokenabi)
            await (await GSTToken.approve(address.gemNFT, COMBINE_PRICE)).wait()
            const tx = await (await GemNFT.combineGem(gemList[0], gemList[1], gemList[2])).wait()
            console.log({ tx })
            const newBalance = await getUserBalance(currentAccount)
            setBalance(newBalance)

            setLoading(false)
            callback()
        } catch (error) {
            console.log(error)
            setLoading(false)
        }
    }

    const repairSneaker =async  (tokenid, callback) => {
        try{
            setLoading(true)
            const SneakerNFT = await getContract(address.sneakerNFT, SneakerNFTabi)
            const GSTToken = await getContract(address.GSTToken, GSTTokenabi)
            await (await GSTToken.approve(address.sneakerNFT, REPAIR_PRICE)).wait()
            const tx = await (await SneakerNFT.repairSneaker(tokenid)).wait()
            console.log({ tx })
            const newBalance = await getUserBalance(currentAccount)
            setBalance(newBalance)
            setLoading(false)
            callback()

        }catch(error){
            console.log(error)
            setLoading(false)
        }
    }

    const mintShoeBox = async (sneaker1, sneaker2, mintingScroll1, mintingScroll2, callback) => {
        try {
            setLoading(true)
            const ShoeBoxNFT = await getContract(address.shoeBoxNFT, ShoeBoxNFTabi)
            const GSTToken = await getContract(address.GSTToken, GSTTokenabi)
            const tw = await (await ShoeBoxNFT.mint(sneaker1, sneaker2, mintingScroll1, mintingScroll2)).wait()
            const newBalance = await getUserBalance(currentAccount)
            setBalance(newBalance)
            setLoading(false)
            setNotification('ShoeBox minted successfully', 'success')
            callback()
        } catch (error) {
            console.log(error)
            setLoading(false)
        }
    }


    const getListMysteryBoxOfUser = async (userAddress) =>{
        try{
            const MysteryBox = await getContract(address.mysteryBoxNFT, MysteryBoxabi)
            let totalMysBoxOfUser = await MysteryBox.balanceOf(userAddress)
            let listMysteryBox = []

            await Promise.all(Array(Number(totalMysBoxOfUser.toString())).fill(0).map(async (_, index)=>{
                let tokenIdAtIndex = await MysteryBox.tokenOwnByIndex(userAddress,index)
                let mysBox =await MysteryBox.getMysteryBox(tokenIdAtIndex)
                listMysteryBox.push(mysBox)
            }))

            return listMysteryBox
        }catch(error){
            console.log(error)
        }
    }

    const openMysteryBox = async (tokenId, callback) =>{
        try{
            setLoading(true)
            const MysteryBox = await getContract(address.mysteryBoxNFT, MysteryBoxabi)
            const tx = await (await MysteryBox.open(tokenId)).wait()
            console.log({tx})
            setLoading(false)
            callback()
        }catch(error){
            console.log(error)
            setLoading(false)
        }
    }

    const getUserEnergy = async (userAddress) => {
        const Move2Earn = await getContract(address.move2Earn, Move2Earnabi)
        const energy = await Move2Earn.getUserEnergy(userAddress)
        // console.log({Move2Earn})
        return energy
    }

    const getUserBalance = async (userAddress) => {
        const GSTToken = await getContract(address.GSTToken, GSTTokenabi)
        const balance = await GSTToken.balanceOf(userAddress)
        return balance
    }

    useEffect(() => {
        (async () => {
            await checkIfWalletIsConnected()
            if (currentAccount) {
                const energy = await getUserEnergy(currentAccount);
                setEnergy(energy);
                const balance = await getUserBalance(currentAccount);
                setBalance(balance.toString());

            }
        })()
    }, [currentAccount])

    return (
        <MoveContext.Provider
            value={{
                connectWallet, checkIfWalletIsConnected, currentAccount, setCurrentAccount, getListNFTsOfaUser, makeOffer, notify, setNotification, getListNFTsListingOnMarketplace,
                executeOffer, loading, balance, energy, move2Earn, levelUpSneaker, combine, openShoeBox,openMysteryBox,
                mintShoeBox,repairSneaker,equipGem, getListMysteryBoxOfUser
            }}
        >
            {children}
        </MoveContext.Provider>
    )
}

