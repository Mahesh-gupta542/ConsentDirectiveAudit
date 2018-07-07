pragma solidity ^0.4.4;
pragma experimental ABIEncoderV2;

import "./Patient.sol";

contract PatientFactory {

  // Maps accounts to its respective Patient instance
    mapping(address => Patient) mMap;

    constructor () public {
    }

    function MakePatient(string name, uint64 mcp) {
        if (address(mMap[msg.sender]) == 0) {
            mMap[msg.sender] = new Patient(msg.sender, name, mcp);
        }
    }

  function DeletePatient() {
    delete mMap[msg.sender];
  }

  // Gets the address of the Patient instance associated with the caller
  function GetPatient() constant returns (Patient) {
    return mMap[msg.sender];
  }

  function IsPatient(address who) constant returns (bool) {
    return mMap[who] != address(0);
  }

  function GetPatientFromAddress(address who) constant returns (Patient) {
    return mMap[who];
  }

}
