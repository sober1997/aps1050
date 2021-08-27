pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;
contract Adoption {
    event GetPetCount(uint256 _count);
    struct Pet {
        uint256 id;
        string name;
        string pictureHash;
        uint256 age;
        string breed;
        string location;
        address adopter;
    }

    mapping(uint256 => mapping(uint256 => Pet)) public Pets;
    uint256 public petsCount;
    uint256 private _testIterationNum = 0;
    mapping(uint256 => address[]) public likes;

    constructor() public {
        petsCount = 0;
    }

    // Adopting a pet
    function setAdopter(uint256 petId) public returns (uint256) {
        require(petId >= 0 && petId < petsCount);

        Pet storage pet = Pets[_testIterationNum][petId];
        pet.adopter = msg.sender;

        return petId;
    }

    function addNewPet(
        string memory name,
        string memory picHash,
        uint256 age,
        string memory breed,
        string memory location
    ) public returns (uint256) {
        Pets[_testIterationNum][petsCount] = Pet(
            petsCount,
            name,
            picHash,
            age,
            breed,
            location,
            0x0000000000000000000000000000000000000000
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

    function getPetInfo(uint256 petId) public view returns (uint256, string memory, string memory, uint256, string memory, string memory, address) {
        require(petId >= 0 && petId < petsCount);
        return (Pets[_testIterationNum][petId].id, Pets[_testIterationNum][petId].name, Pets[_testIterationNum][petId].pictureHash, Pets[_testIterationNum][petId].age, Pets[_testIterationNum][petId].breed, Pets[_testIterationNum][petId].location, Pets[_testIterationNum][petId].adopter);
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
