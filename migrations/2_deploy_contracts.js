var Category = artifacts.require('./Category.sol');
var CategoryCatalog = artifacts.require('./CategoryCatalog.sol');
//var ConsentDirective = artifacts.require("./ConsentDirective.sol");
//var Patient = artifacts.require("./Patient.sol");
var PatientFactory = artifacts.require('./PatientFactory.sol');

module.exports = function(deployer, network, accounts) {
    deployer.deploy(Category, 'default');
  
    deployer.deploy(CategoryCatalog);
   
    deployer.deploy(PatientFactory);
  };