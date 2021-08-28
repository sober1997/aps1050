App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    return await App.initWeb3();
  },

  initWeb3: async function () {

    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    web3.eth.defaultAccount = web3.eth.accounts[0];
    return App.initContract();
  },

  initContract: async function () {
    $.getJSON('Adoption.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      return App.LoadInfo();
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('submit', '.form-inline', App.LoadPetInfo);
    $(document).on('click', '.btn-like', App.handleLike);
    $(document).on('click', '.btn-bid', App.handleBid);
    $(document).on('submit', '.form-login', App.handleAddPet);
  },

 LoadInfo: async function() {
  var AdoptionRow= $('#petsRowForAdoption');
  var AdoptionTemp = $('#petTemplateForAdoption');
  var AuctionRow = $('#petsRowForAuction');
  var AuctionTemp = $('#petTemplateForAuction');

  var instance = await App.contracts.Adoption.deployed();
  var num = await instance.petsCount.call();
  // 1.obtain info about which ids are for auction and which ids are for adoption
  var petTypes = [];
  var petIdsForAdoption = [];
  var petIdsForAuction = [];
  for (i = 0; i < num; i++) {
    petTypes.push(instance.getPetType(i));
  }
  petTypes = await Promise.all(petTypes);
  for (i = 0; i < petTypes.length; i++) {
    if (petTypes[i][1]) {
      petIdsForAdoption.push(parseInt(petTypes[i][0]));
    }
    else {
      petIdsForAuction.push(parseInt(petTypes[i][0]));
    }
  }
  // update the prepeared texts for empty contents
  if (petIdsForAdoption.length == 0){
    document.getElementById('no-adoption-text').hidden=false;
  }
  else {
    document.getElementById('no-adoption-text').hidden=true;
  }
  if (petIdsForAuction.length == 0){
    document.getElementById('no-auction-text').hidden=false;
  }
  else {
    document.getElementById('no-auction-text').hidden=true;
  }
  // console.log(petTypes);
  // console.log(petIdsForAdoption);
  // console.log(petIdsForAuction);

  // 2.obtain the pet details and update the html (adoption)
  var petBasicInfo = [];
  var petLike = []; //for adoption only for now
  for (i = 0; i < petIdsForAdoption.length; i++) {
    petBasicInfo.push(instance.getPetInfo(petIdsForAdoption[i]));
    petLike.push(instance.getLike(i));
  }

  petBasicInfo = await Promise.all(petBasicInfo);
  petLike = await Promise.all(petLike);

  AdoptionRow.empty();
  AuctionRow.empty();

  var attribute = document.getElementById("attribute").value;
  var attributeValue = document.getElementById("attributeValue").value;
  
  // console.log(attribute);
  // console.log(attributeValue);

  for(i = 0;i <petBasicInfo.length;i++) {
    if (attributeValue == "" || attribute == "breed" && petBasicInfo[i][4] == attributeValue ||
        attribute == "age" && petBasicInfo[i][3] == attributeValue ||
        attribute == "location" && petBasicInfo[i][5] == attributeValue){
      AdoptionTemp.find('.btn-adopt').attr('data-id', petBasicInfo[i][0]);
      AdoptionTemp.find('.btn-like').attr('data-id', petBasicInfo[i][0]);
      AdoptionTemp.find('.glyphicon-heart').attr('data-id', petBasicInfo[i][0]);
      AdoptionTemp.find('.panel-title').text(petBasicInfo[i][1]);
      AdoptionTemp.find('img').attr('src', petBasicInfo[i][2]);
      AdoptionTemp.find('.pet-age').text(petBasicInfo[i][3]);
      AdoptionTemp.find('.pet-breed').text(petBasicInfo[i][4]);
      AdoptionTemp.find('.pet-location').text(petBasicInfo[i][5]);

      //update the buffer
      if (petBasicInfo[i][6] !== '0x0000000000000000000000000000000000000000')
        AdoptionTemp.find('#0').text('Adopted').attr('disabled', true);
      else
        AdoptionTemp.find('#0').text('Adopt').attr('disabled', false);

      if (petLike[i]) {
        AdoptionTemp.find('#like').css('color', "#E3170D");
        AdoptionTemp.find('#1').attr('disabled', true);
      }
      else{
        AdoptionTemp.find('#like').css('color', "grey");
        AdoptionTemp.find('#1').attr('disabled', false);
    }
    AdoptionRow.append(AdoptionTemp.html());
  }
  }


  // 3.obtain the pet details and update the html (auction)
  petBasicInfo = [];
  var petPriceInfo = [];
  for (i = 0; i < petIdsForAuction.length; i++) {
    petBasicInfo.push(instance.getPetInfo(petIdsForAuction[i]));
    petPriceInfo.push(instance.getPetPrice(petIdsForAuction[i]));
  }

  petBasicInfo = await Promise.all(petBasicInfo);
  petPriceInfo = await Promise.all(petPriceInfo);

  for(i = 0;i <petBasicInfo.length;i++) {
    if (attributeValue == "" || attribute == "breed" && petBasicInfo[i][4] == attributeValue ||
        attribute == "age" && petBasicInfo[i][3] == attributeValue ||
        attribute == "location" && petBasicInfo[i][5] == attributeValue){
    AuctionTemp.find('.btn-bid').attr('data-id', petBasicInfo[i][0]);
    AuctionTemp.find('.input-amount').attr('id', petBasicInfo[i][0]);
    AuctionTemp.find('.panel-title').text(petBasicInfo[i][1]);
    AuctionTemp.find('img').attr('src', petBasicInfo[i][2]);
    AuctionTemp.find('.pet-age').text(petBasicInfo[i][3]);
    AuctionTemp.find('.pet-breed').text(petBasicInfo[i][4]);
    AuctionTemp.find('.pet-location').text(petBasicInfo[i][5]);

    AuctionTemp.find('.pet-current-price').text(petPriceInfo[i][1]);
    AuctionTemp.find('.pet-min-increment').text(petPriceInfo[i][2]);
    AuctionTemp.find('.pet-adopter').text(petPriceInfo[i][3]);

    AuctionRow.append(AuctionTemp.html());
  }
}
  return App.markAdopted();
 },

  LoadPetInfo: async function (event) {
    event.preventDefault();
    return App.LoadInfo();
  },

markAdopted: async function () {
  // this part is moved to LoadPetInfo!

  // var instance = await App.contracts.Adoption.deployed();
  // var num = await instance.petsCount.call();
  // var array = [];
  // for (i = 0; i < num; i++) {
  //   array.push(instance.getPetInfo(i));
  // }
  // vals = await Promise.all(array);
  // for (i = 0; i < num; i++) {
  //   if (vals[i][6] !== '0x0000000000000000000000000000000000000000') {
  //             $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
  //           }
  // }
},

handleAdopt: function (event) {
  event.preventDefault();

  var petId = parseInt($(event.target).data('id'));

  var adoptionInstance;

  web3.eth.getAccounts(function (error, accounts) {
    if (error) {
      console.log(error);
    }

    var account = accounts[0];

    App.contracts.Adoption.deployed().then(function (instance) {
      adoptionInstance = instance;

      // Execute adopt as a transaction by sending account
      return adoptionInstance.setAdopter(petId, { from: account });
    }).then(function (result) {
      return App.LoadInfo();
    }).catch(function (err) {
        console.log(err.message);
      });
  });
},

handleBid: function (event) {
  event.preventDefault();

  var petId = parseInt($(event.target).data('id'));
  var bid_price = document.getElementById(petId).value;
  bid_price = parseInt(bid_price);

  console.log(petId, bid_price);
  var biddingInstance;

  web3.eth.getAccounts(function (error, accounts) {
    if (error) {
      console.log(error);
    }

    var account = accounts[0];

    App.contracts.Adoption.deployed().then(function (instance) {
      biddingInstance = instance;

      return biddingInstance.processBid(petId, bid_price, {from: account});
    }).then(function (result) {
      if (result.logs[0].args._isSuccess) {
        alert("Congrats, your bid has been successfully placed!");
      }
      else {
        alert("Sorry, your bid is unsuccessful!"); //might be able to add the reason...
      }
      window.location.reload();
      return App.markAdopted();
    }).catch(function (err) {
      console.log(err.message);
    })
  });
},

handleDonate: function () {
  var x;
  var amount = prompt("Please enter the amount you want to donate in ether", 0.0001);
  if (amount != null) {
    x = "You will donate " + amount + "ether to petShop owner. Comfirmed?";
    if (confirm(x)) {
      var account;
      web3.eth.getAccounts(function (error, accounts) {
        if (error) {
          console.log(error);
        }
        var account = accounts[0];
        web3.eth.sendTransaction({ from: account, to: App.contracts.Adoption.address, value: web3.toWei(amount, "ether"), gasPrice: web3.toWei(5, 'gwei') }, function (err, transactionHash) {
          if (!err) //if TX submitted, the following function increments the donation counter artificially to give the user instant feedback – despite the fact that the TX may still fail.
            //Please consider carefully whether or not to implement this feature.
            alert("Thanks for your donation. TX hash: " + transactionHash.substring(0, 8) + "...");
          else
            alert("donation failed. ");
        });
      });
  }
  else
    alert("donate cancelled!");
  }
},

handleAddPet: function (event) {
  event.preventDefault();
  web3.eth.defaultAccount = web3.eth.accounts[0]
  const data = new FormData(event.target);
  var url = "";
  const reader = new FileReader();
  reader.onloadend = function () {
    const ipfs = window.IpfsApi('localhost', 5001) // Connect to IPFS
    const buf = buffer.Buffer(reader.result) // Convert data into buffer
    ipfs.files.add(buf, (err, result) => { // Upload buffer to IPFS
      if (err) {
        console.error(err)
        return
      }
      url = `https://ipfs.io/ipfs/${result[0].hash}`;
      var object = {};
      data.forEach(function (value, key) {
        object[key] = value;
      });
      // add startPrice and minIncrement placeholders for adoption
      console.log(object["minBid"]);
      console.log(object["minIncrement"]);
      if (object["minBid"] == null || object["minIncrement"] == null){
        console.log("add place holder for adoptions");
        object["minBid"] = 0;
        object["minIncrement"] = 0;
      }
      console.log(`Url --> ${url}`)
      console.log(url)
      object["picture"] = url;
      var json = JSON.stringify(object);
      //alert(json);
      App.contracts.Adoption.deployed().then(function (instance) {
        adoptionInstance = instance;
        // alert(object["name"]);
        // Execute adopt as a transaction by sending account
        console.log(Boolean(object["choice_of_type"]=="adoption"))
        return adoptionInstance.addNewPet(object["name"], object["picture"], parseInt(object["age"]), object["breed"], object["location"], Boolean(object["choice_of_type"]=="adoption"), parseInt(object["minBid"]), parseInt(object["minIncrement"]));
      }).then(function (res) {
        alert("Add New Pet Successfully! Now pets count is " + res.logs[0].args._count.toNumber());
      }).then(function(res) {
        window.location.replace("index.html");
      });

    })
  }
  const photo = document.getElementById("id_picture");
  reader.readAsArrayBuffer(photo.files[0]); // Read Provided File
},

handleLike: function (event) {
  event.preventDefault();
  var petId = parseInt($(event.target).data('id'));
  // alert(petId);
  var likeInstance;

  web3.eth.getAccounts(function (error, accounts) {
    if (error) {
      console.log(error);
    }

    var account = accounts[0];

    App.contracts.Adoption.deployed().then(function (instance) {
      likeInstance = instance;
      return likeInstance.setLike(petId, { from: account });

    }).then(function (result) {
      return App.LoadInfo();

    }).catch(function (err) {
      console.log(err.message);
    })

  })

}

};

// markLiked: async function () {

//   var instance = await App.contracts.Adoption.deployed();

//   var num = await instance.petsCount.call();
//   //console.log(num);
//   var array = [];
//   for (var i = 0; i < num; i++) {

//     array.push(instance.getLike(i));

//   }

//   vals = await Promise.all(array);

//   for (i = 0; i < num; i++) {
//     if (vals[i]) {
//       $('.panel-pet').eq(i).find('#like').css('color', "red").attr('disabled', true);
//     }
//   }

// },

$(function () {
  $(window).load(function () {
    App.init();
  });
});

$(function() {
  $('input[name="choice_of_type"]').on('click', function() {
      if ($(this).val() == 'auction') {
          $('#hidden-inputs').show();
      }
      else {
          $('#hidden-inputs').hide();
      }
  });
});
