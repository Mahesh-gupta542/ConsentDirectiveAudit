pragma solidity ^0.4.4;
pragma experimental ABIEncoderV2;

import "./Category.sol";

contract Patient {
  
    address public Owner;
    string public Name;
    uint64 public Mcp;

    struct ConsentDirective {
        address who;
        uint256 what;
        address record;
    }
    ConsentDirective[] public Directives;

    struct ProfileAccessRecord {
        address AccessedBy;
        uint256 PermissionRequested;
        uint256 AccessedTime;
        bool AccessGranted;
    }
    ProfileAccessRecord[] public AuditLogs;

    constructor (address owner, string name, uint64 mcp) public {
        Owner = owner;
        Name = name;
        Mcp = mcp;
    }

    function GetOwner() constant returns(address) {
        return Owner;
    }

    function GetConsentDirectiveCount() constant public returns(uint) {
        return Directives.length;
    }

    function GetConsentDirective(uint i) view public returns(address, uint256, address) {
        ConsentDirective memory cd = Directives[i];
        return (cd.who, cd.what, cd.record);
    } 

    function SetConsentDirective(address who, uint256 what) external {
        bool exist = false;
        ConsentDirective memory cd = ConsentDirective(who, what, address(0));
        if (this.HasDelegatedAuthority(msg.sender, cd)) {
            for (uint i = 0; i < Directives.length; i++){
                if (Directives[i].who == cd.who){
                    Directives[i].what = cd.what;
                    exist = true;
                    break;
                }
            }
            if (!exist){
                Directives.push(cd);
            }
        }
    }

/*   function RemoveAllConsentDirectives() {
    if (msg.sender == Owner) {
      Directives = new ConsentDirective[];
    } else {
      revert();
    }
  } */

  //
  // Does Patient consent WHO to do WHAT?
  //
  function ConsentsTo(address who, Category what) constant returns(bool) {
    // Owner always consents to themself
    if (who == Owner) {
      return true;
    }

    for (uint i = 0; i < Directives.length; i++) {

      if (who != Directives[i].who) {
        continue;
      }

      var dir_data = Directives[i].what;   // Directive data (consented)

      for (uint j = 0; j < what.GetConsentDataCount(); j++) {
        var cat_data = what.GetConsentData(j); // Requested data (category)

        var res_data = dir_data & cat_data; 
        if (res_data == cat_data) {
          return true;
        }
      }

    }

    return false;
  }

    function CheckConsentsTo(uint256 permission) view public returns (bool, string, uint64) {
        if (msg.sender == Owner) {
            return (true, Name, Mcp);
        }
        for (uint i = 0; i < Directives.length; i++) {

            if (msg.sender != Directives[i].who) {
                continue;
            }            
            uint256 dir_data = Directives[i].what;
            uint256 res_data = dir_data & permission;
            if (res_data == permission) {
                return (true, Name, Mcp);
            }
        }
        return (false, "####", 0);
    }

    function CreateAuditLog(address who, uint256 permission, bool accessGranted, uint256 currTime) {
        AuditLogs.push(ProfileAccessRecord(who, permission, currTime, accessGranted));
    }

  // Has Patient delegated authority to WHO to consent to WHAT on their behalf?
    function HasDelegatedAuthority(address who, ConsentDirective cd) public constant returns(bool) {

      // Owner always has authority to consent
        if (who == Owner) {
            return true;
        }

        // The least significant bit indicates authority to consent on the Patient's behalf,
        // therefore we change the LSB to 1 to check for authority to consent.
        var req_data = cd.what | 0x1;

        for (uint i = 0; i < Directives.length; i++) {
            var con_data = Directives[i].what; // Consented data

            // req_data 0001 0001 
            // con_data 0111 0001 &
            // res_data 0001 0001 (result)
            if (req_data & con_data == req_data) {
                return true;
            }

        }

        return false;
    }

    function GetAccessLogLength() public view returns(uint){
        return AuditLogs.length;
    }

    function GetAccessLogAt(uint idx) public view returns(address, uint, uint, bool){
        ProfileAccessRecord storage log = AuditLogs[idx];
        return (log.AccessedBy, log.PermissionRequested, log.AccessedTime, log.AccessGranted);
    }

    function SearchAccessLog(address accessedBy, uint accessedOn) public view returns(address, uint, uint, bool, string) {
        bool consentExist = false;
        for (uint i1 = 0; i1 < Directives.length; i1++) {
            if (Directives[i1].who == accessedBy) {
                consentExist = true;
                break;
            }
        }
        if (consentExist) {
            for (uint i2 = 0; i2 < AuditLogs.length; i2++) {
                if (AuditLogs[i2].AccessedBy == accessedBy && AuditLogs[i2].AccessedTime < accessedOn) {
                    ProfileAccessRecord storage log = AuditLogs[i2];
                    return (log.AccessedBy, log.PermissionRequested, log.AccessedTime, log.AccessGranted, Name);
                }
            }
            return (address(0), 0, 0, true, "xxx");
        } else {
            return (address(0), 0, 0, false, "xxx");
        }

    }

    function  AuditLogCount(address mdAdress,  uint scriptFillDate, uint prevFillDate) public view returns(uint, uint[]) {
        uint count = 0;
        uint[] memory indexes = new uint[](AuditLogs.length);
        for (uint i = 0; i < AuditLogs.length; i++) {
            if (AuditLogs[i].AccessedBy == mdAdress && AuditLogs[i].AccessedTime < scriptFillDate && AuditLogs[i].AccessedTime > prevFillDate) {
                indexes[count] = i;
                count++;
            }

        }
        return (count,indexes);
    }

}
