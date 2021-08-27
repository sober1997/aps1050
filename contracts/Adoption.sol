pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;
contract Adoption {
    uint VersionMarker3 = 650;
    event GetPetCount(uint256 _count);
    event Bidding(uint256 _petId, uint256 _biddingPrice, address _bidderAddres, bool _isSuccess);

    struct Pet {
        uint256 id;
        string name;
        string pictureHash;
        uint256 age;
        string breed;
        string location;
        address adopter; //also the winner of an auction

        bool forFree; //true is for adotion, false is for auction
        //parameters below are for aucitons only
        uint256 currentPrice;
        uint256 minIncrement;
    }

    mapping(uint256 => mapping(uint256 => Pet)) public Pets; //[# of generations][pet-id]

    uint256 public petsCount;
    uint256 private _testIterationNum = 0;
    mapping(uint256 => address[]) public likes;

    constructor() public {
        petsCount = 0;
    }

    // Adopting a pet
    function setAdopter(uint256 petId) public returns (uint256) {
        require(petId >= 0 && petId < petsCount && Pets[_testIterationNum][petId].forFree == true); 
        //we might need to add Pets[_testIterationNum][petId].adopter == address(0)
        //and Pets[_testIterationNum][petId].forFree == true

        Pet storage pet = Pets[_testIterationNum][petId];
        pet.adopter = msg.sender;

        // Pets[_testIterationNum][petId].adopter = msg.sender;

        return petId;
    }

    // Bid on a pet
    function processBid(uint256 petId, uint256 bidPrice) public returns (bool) {
        require(petId >= 0 && petId < petsCount && Pets[_testIterationNum][petId].forFree == false);

        uint256 minimumPrice = Pets[_testIterationNum][petId].currentPrice + Pets[_testIterationNum][petId].minIncrement;
        address currentAdopter = Pets[_testIterationNum][petId].adopter;


        if (bidPrice >= minimumPrice) { //(bidPrice >= minimumPrice && msg.sender != currentAdopter)
            Pets[_testIterationNum][petId].currentPrice = bidPrice;
            Pets[_testIterationNum][petId].adopter = msg.sender;
            emit Bidding(petId, bidPrice, msg.sender, true);
            return true;
        }
        else {
            emit Bidding(petId, bidPrice, msg.sender, false);
            return false;
        }
    }

    // Adding new pet
    function addNewPet(
        string memory name,
        string memory picHash,
        uint256 age,
        string memory breed,
        string memory location,

        bool forFree,
        uint256 startPrice,
        uint256 minIncrement 
    ) public returns (uint256) {
        // to make sure the followings are positive 
        if (startPrice<0) {
            startPrice = 1;
        }
        if (minIncrement<0) {
            minIncrement = 1;
        }

        Pets[_testIterationNum][petsCount] = Pet(
            petsCount,
            name,
            picHash,
            age,
            breed,
            location,
            address(0),

            forFree,
            startPrice,
            minIncrement
        );
        petsCount++;
        emit GetPetCount(petsCount);
        return petsCount;
    }

    function deleteAllPets() public returns (bool) {
        _testIterationNum++;
        petsCount = 0;
        return true;
    }

    // function getPetsInfo() external view returns (uint256[] memory, string[] memory, string[] memory, uint256[] memory, string[] memory, string[] memory, address[] memory) {

    //     uint256[] memory ids =  new uint256[](petsCount);
    //     string[] memory names = new string[](petsCount);
    //     string[] memory pictureHashs = new string[](petsCount);
    //     uint256[] memory ages =  new uint256[](petsCount);
    //     string[] memory breeds = new string[](petsCount);
    //     string[] memory locations = new string[](petsCount);
    //     address[] memory adopters = new address[](petsCount);
    //     for (uint256 i = 0; i < petsCount; i++) {
    //         ids[i] = (Pets[_testIterationNum][i].id);
    //         names[i] = Pets[_testIterationNum][i].name;
    //         pictureHashs[i] = (Pets[_testIterationNum][i].pictureHash);
    //         breeds[i] = (Pets[_testIterationNum][i].breed);
    //         locations[i] = (Pets[_testIterationNum][i].location);   
    //         adopters[i] = (Pets[_testIterationNum][i].adopter);
    //         ages[i] = (Pets[_testIterationNum][i].age);
    //     }
    //     return (ids,names,pictureHashs,ages,breeds,locations,adopters);
    // }

    // Solidity Function has maxmum number of local variables of 16, string counts two.
    function getPetInfo(uint256 petId) public view returns (uint256, string memory, string memory, uint256, string memory, string memory, address) {
        require(petId >= 0 && petId < petsCount);
        return (Pets[_testIterationNum][petId].id, 
                Pets[_testIterationNum][petId].name, 
                Pets[_testIterationNum][petId].pictureHash, 
                Pets[_testIterationNum][petId].age, 
                Pets[_testIterationNum][petId].breed, 
                Pets[_testIterationNum][petId].location, 
                Pets[_testIterationNum][petId].adopter);
    }

    function getPetType(uint256 petId) public view returns (uint256, bool) {
        require(petId >= 0 && petId < petsCount);
        return (Pets[_testIterationNum][petId].id, Pets[_testIterationNum][petId].forFree);
    }

    function getPetPrice(uint256 petId) public view returns (uint256, uint256, uint256, address) {
        require(petId >= 0 && petId < petsCount);
        return (Pets[_testIterationNum][petId].id, 
                Pets[_testIterationNum][petId].currentPrice, 
                Pets[_testIterationNum][petId].minIncrement,
                Pets[_testIterationNum][petId].adopter);
    }
    // function getPetInfo(uint256 petId) public view returns (Pet memory) {
    //     require(petId >= 0 && petId < petsCount);
    //     return Pets[_testIterationNum][petId];
    // }

    // Retrieving the adopters
    // function getAdopters() public view returns (address[16] memory) {
    //     return adopters;
    // }

    function() external payable {}

    function setLike(uint256 petId) public returns(uint256){
        require(petId >= 0 && petId < petsCount);
        likes[petId].push(msg.sender);
        return petId;
    }

    function getLike(uint256 petId) public view returns(bool){
        require(petId >= 0 && petId < petsCount);
        uint len = likes[petId].length;
        for (uint i = 0; i < len; i++){
            if (likes[petId][i] == msg.sender){
                return true;
            }
        }
        return false;

    }
}
