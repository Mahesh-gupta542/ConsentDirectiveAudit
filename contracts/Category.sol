pragma solidity ^0.4.4;

contract Category {

  string public Name;
  
  constructor (string name) public{
    Name = name;
    ConsentData = new uint256[](0);
  }
  
  function SetCategoryName(string name) public { Name = name; }

  // TODO use future ConsentData type when that's done
  uint256[] public ConsentData;

  function GetConsentData(uint i) constant public returns(uint256)  { return ConsentData[i]; }
  function GetConsentDataCount() constant public returns(uint256) { return ConsentData.length; }
  function AddConsentData(uint256 consentData) public { ConsentData.push(consentData); }
  function GetAllConsentData() constant public returns(uint256[]) { return ConsentData; }

}