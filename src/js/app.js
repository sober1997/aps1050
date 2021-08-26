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
    $(document).on('submit', '.form-login', App.handleAddPet);
    $(document).on('submit', '.form-inline', App.LoadPetInfo);
  },
  LoadInfo: async function () {
    var petsRow = $('#petsRow');
    var petTemplate = $('#petTemplate');
    var instance = await App.contracts.Adoption.deployed();
    var num = await instance.petsCount.call();
    var array = [];
    for (i = 0; i < num; i++) {
      array.push(instance.getPetInfo(i));
    }
    vals = await Promise.all(array);
    var attribute = document.getElementById("attribute").value;
    var attributeValue = document.getElementById("attributeValue").value;
    // alert(attribute);
    // alert(attributeValue);
    // alert(vals);
    petsRow.empty();
    for (i = 0; i < vals.length; i++) {
      if (attributeValue == "" || attribute == "breed" && vals[i][4] == attributeValue ||
        attribute == "age" && vals[i][3] == attributeValue ||
        attribute == "location" && vals[i][5] == attributeValue) {
        petTemplate.find('.btn-adopt').attr('data-id', vals[i][0]);
        petTemplate.find('.panel-title').text(vals[i][1]);
        petTemplate.find('img').attr('src', vals[i][2]);
        petTemplate.find('.pet-age').text(vals[i][3]);
        petTemplate.find('.pet-breed').text(vals[i][4]);
        petTemplate.find('.pet-location').text(vals[i][5]);
        if (vals[i][6] !== '0x0000000000000000000000000000000000000000')
          petTemplate.find('button').text('Adopted').attr('disabled', true);
        else
          petTemplate.find('button').text('Adopt').attr('disabled', false);

        petsRow.append(petTemplate.html());
      }
    }
  },
  LoadPetInfo: async function (event) {
    event.preventDefault();
    return App.LoadInfo();
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
        console.log(`Url --> ${url}`)
        console.log(url)
        object["picture"] = url;
        var json = JSON.stringify(object);
        alert(json);
        App.contracts.Adoption.deployed().then(function (instance) {
          adoptionInstance = instance;
          // alert(object["name"]);
          // Execute adopt as a transaction by sending account
          return adoptionInstance.addNewPet(object["name"], object["picture"], parseInt(object["age"]), object["breed"], object["location"]);
        }).then(function (res) {
          alert("Add New Pet Successfully! Now pets count is " + res.logs[0].args._count.toNumber());
        }).then(function (res) {
          window.location.replace("index.html");
        });

      })
    }
    const photo = document.getElementById("id_picture");
    reader.readAsArrayBuffer(photo.files[0]); // Read Provided File

  },

  searchPets: function () {

  }

};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
