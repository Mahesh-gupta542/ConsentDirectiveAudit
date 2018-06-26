/*
 * Main entry point (init)
 */
var patientMetadata = LoadContractMetadata('Patient.json');
var patientContract = web3.eth.contract(patientMetadata.abi);

function Init() {
    // web3 object
    if (typeof web3 !== 'undefined') {
        window.web3 = new Web3(web3.currentProvider);
    }
    else {
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    if(web3.isConnected()) {
      console.log(web3.eth.accounts[0]);
      web3.eth.defaultAccount = web3.eth.accounts[0];

  }
     //var categoryAddress = '0x79ea5b7f183a48e0cd5ca03e597845557a1ee3c0';//GetContractAddress(categoryMetadata);
     //var patientFactoryAddress = '0x66579eeff8883d509594af34270f59527c36bcc7';//GetContractAddress(patientFactoryMetadata);
     //var categoryCatalogAddress = '0x270610b6fc0d87045ae624caa39227af992a84e2';//GetContractAddress(categoryCatalogMetadata);

    // Patient contract
    var patientFactoryMetadata = LoadContractMetadata('PatientFactory.json');
    var patientFactoryContract = web3.eth.contract(patientFactoryMetadata.abi);
    var patientFactoryAddress = GetContractAddress(patientFactoryMetadata);
    patientFactoryContract.at(patientFactoryAddress, function (error, instance) {
        if (error) {
            alert('Unable to load PatientFactory@' + patientFactoryAddress);
        } else {
            window.PatientFactory = instance;
        }
    });

    // CategoryCatalog contract
    var categoryCatalogMetadata = LoadContractMetadata('CategoryCatalog.json');
    var categoryCatalogContract = web3.eth.contract(categoryCatalogMetadata.abi);
    var categoryCatalogAddress = GetContractAddress(categoryCatalogMetadata);
    categoryCatalogContract.at(categoryCatalogAddress, function (error, instance) {
        if (error) {
            alert('Unable to load CategoryCatalog@' + categoryCatalogAddress);
        } else {
            window.CategoryCatalog = instance;
        }
    });

    // Category contract
    var categoryMetadata = LoadContractMetadata('Category.json');
    var categoryContract = web3.eth.contract(categoryMetadata.abi);
    var categoryAddress = GetContractAddress(categoryMetadata);
    categoryContract.at(categoryAddress, function (error, instance) {
        if (error) {
            alert('Unable to load category@' + categoryAddress);
        } else {
            window.Category = instance;
        }
    });

    // Hardcoded account addresses (PoC)
    window.Accounts = {
        'accounts': [
            { 'address': '0x004862247223e9784fec421a0c6a3c2e28b0782a', 'name': 'Admin' },
            { 'address': null, 'name': 'P (Patient)' },
            { 'address': '0x5c879555a7ed30062d01ff55e6f598a27624287d', 'name': 'MD1' },
            { 'address': '0xac08c39735d583ea3e893821b79fc1c88d61e4e8', 'name': 'MD2' },
            { 'address': '0x4a45d3081cf0ecd45b23aee009be3576c46b29ef', 'name': 'MD3' },
            { 'address': '0x79304e3605e578f83c22d9054702391aa0e6fa2c', 'name': 'Auditor' }
        ]
    };

    // Title and footer
    $(document).attr('title', GetAccountName() + ' Actor');
    $('#accountName').text(GetAccountName());
    $('#accountAddress').text(GetAccountAddress());

    // Consent Data
    InitConsentData();

    var currAccnt = Accounts.accounts.find(function (accnt) { return accnt.address == GetAccountAddress()});

    if (!currAccnt || currAccnt.name == 'P (Patient)') {
        InitPatient();
    } else if ( currAccnt.name.substring(0,2) == 'MD'){
        InitMD();
    } else if (currAccnt.name == 'Auditor') {
        InitAuditor();
    }


}

window.addEventListener('load', function () {
    //Init();
});

/*
 * Util functions
 */
function LoadContractMetadata(path) {
    var contract;

    jQuery.ajax({
        url: path,
        success: function (result) {
            contract = result;
        },
        async: false
    });

    return contract;
}

function GetContractAddress(contract) {
    return contract.networks[Object.keys(contract.networks)[0]].address;
}

function GetAccountName() {
/*     if (web3.eth.accounts.length != 1) {
        return 'unknown';
    } */

    for (var i = 0; i < Accounts.accounts.length; i++) {
        if (Accounts.accounts[i].address == web3.eth.accounts[0]) {
            return Accounts.accounts[i].name;
        }
    }
}

function GetAccountNameAt(address) {
    for (var i = 0; i < Accounts.accounts.length; i++) {
        if (Accounts.accounts[i].address == address) {
            return Accounts.accounts[i].name;
        }
    }
    return 'Unknown';
}

function GetAccountAddress() {
  /*     if (web3.eth.accounts.length != 1) {
        return 'unknown';
    } */
    return web3.eth.accounts[0];
}

/*
 * Patient functions
 */
function InitPatient() {
    $('#appName').text( 'Patient App');
    $('.patientContent').show();

    PatientFactory.GetPatient.call(function (error, address) {
        if (error) {
            alert('GetPatient call failed');
        } else {
            console.log('get address: ' + address);
            if (Number(address) == 0) {
                $('#patientHeading').text('You\'re not a patient');
                $('#createButton').attr('class', '');
                $('#destroyButton').attr('class', 'disabled');
                $('#manageConsentDirectivesDiv').attr('style', 'display:none');
            } else {
                Accounts.accounts.find(function (accnt) { return accnt.name == 'P (Patient)'}).address = web3.eth.accounts[0];
                $(document).attr('title', GetAccountName() + ' Actor');
                $('#accountName').text(GetAccountName());
                $('#createButton').attr('class', 'disabled');
                $('#destroyButton').attr('class', '');
                $('#manageConsentDirectivesDiv').attr('style', '');


                patientContract.at(address, function (error, instance) {
                    if (error) {
                        console.log('Unable to load Patient @ ' + address);
                    } else {
                        console.log('Loaded Patient @ ' + address);
                        window.Patient = instance;
                        let promise = new Promise(function(resolve, reject) {
                            instance.Name.call(function(error,name) {
                                if (error) {
                                    console.log("Error getting patient name.")
                                } else {
                                    resolve(name);
                                }
                            });
                          });
                        promise.then(function(name) {
                            $('#patientHeading').text('Patient : ' + name);
                            LoadDDLActors('LoadActor', 1);
                            InitPermissionsHeaderDiv();
                            LoadActor(Accounts.accounts[0].address)
                        });
                    }
                });

            }
        }
    });
}

function InitMD(){
    $('#appName').text( 'Physician App');
    $('.physicianContent').show();
    var recrdCnt = 0;

    PatientFactory.GetPatientList.call(function (error, addresses) {
        if (error) {
            alert('GetPatientList call failed' + error.message);
        } else {
            if (addresses.length > 0) {
                for (var i = 0; i < addresses.length; i++) {
                    var newRow = $('#patientsHeaderDiv').clone();
                    newRow.attr('id', 'patientListDiv-'+i);
                    newRow.css('display', 'inline-flex');
            
                    newRow.children('#patientsSelectDiv').html('<input type="radio" val="' + addresses[i] + '" name = "patientList">');
                    //newRow.children('#patientAccountDiv').text(account);
                    newRow.children('#patientAccountDiv').css('width', '100%');
                    newRow.appendTo('#patientsDiv');

                    let promise = new Promise(function(resolve, reject) {
                        PatientFactory.GetPatientFromAddress(addresses[i], function(error, contractAddress){
                            if (error) {
                                console.error('Error getting paient contract address.');
                            } else {
                                resolve(contractAddress);
                            }
                        });
                    });
                    promise.then(function(contractAddress) { 
                        
                        let patientPromise = new Promise(function(resolve, reject){                        
                            patientContract.at(contractAddress, function(error, instance) {
                                if(error) {
                                    console.error('Error loading Patient instance.');
                                } else {
                                    resolve(instance);
                                }
                            });
                        });
                        patientPromise.then(function(instance) {
                            let promise = new Promise(function(resolve, reject) {
                                instance.Name.call(function(error, name) {
                                    if (error) {
                                        console.error('Error getting patient\'s name.');
                                    } else {
                                        resolve(name);
                                    }
                                });
                            });
                            promise.then(function(name) {
                                var account = 'Patient: ' + name;
                                $('#patientsDiv').find('#patientListDiv-' + recrdCnt + ' #patientAccountDiv').text(account);
                                recrdCnt++;
                            });
                        });
                    });
                }
            }
        }
    });
}

function InitAuditor(){
    $('#appName').text( 'Auditor App');
    $('.auditorContent').show();
    $( '#datepicker' ).datepicker();

   PatientFactory.GetPatientList.call(function (error, addresses) {
        if (error) {
            alert('GetPatientList call failed' + error.message);
        } else {
            if (addresses.length > 0) {
                for (var i = 0; i < addresses.length; i++) {
                    var account = 'Patient @' + addresses[i];
                    var newRow = $('#patientsLogHeaderDiv').clone();
                    newRow.attr('id', 'patientListDiv');
                    newRow.css('display', 'inline-flex');
            
                    newRow.children('#patientsLogSelectDiv').html('<input type="radio" val="' + addresses[i] + '" name = "patientList">');
                    newRow.children('#patientLogAccountDiv').text(account);
                    newRow.children('#patientLogAccountDiv').css('width', '100%');
                    newRow.appendTo('#patientsLogDiv');
                }
            }
        }
    });
}

function LoadDDLActors(funcName, index) {

    var templateId = '#actorTemplateDdi';
    var targetId = '#actorsDdm';

    if (index == 2) {
        templateId += '2';
        targetId += '2';
    }

    for (var i = 0; i < Accounts.accounts.length; i++) {
        var account = Accounts.accounts[i];
        if (account.name == 'P (Patient)') continue;
        var newItem = $(templateId).clone();

        newItem.attr('style', '');
        newItem.appendTo(targetId);

        var link = newItem.children(':first');
        link.text(account.name);

        console.log('2');

        link.attr('OnClick', funcName + '("' + account.address + '");');
    }
}


function LoadPatients(funcName, index) {

    var templateId = '#actorTemplateDdi';
    var targetId = '#actorsDdm';

    if (index == 2) {
        templateId += '2';
        targetId += '2';
    }

    PatientFactory.GetPatientList.call(function (error, addresses) {
        if (error) {
            alert('GetPatientList call failed' + error.message);
        } else {
            if (addresses.length > 0) {
                for (var i = 0; i < addresses.length; i++) {
                    var account = addresses[i];
            
                    var newItem = $(templateId).clone();
            
                    newItem.attr('style', '');
                    newItem.appendTo(targetId);
            
                    var link = newItem.children(':first');
            
                    if (GetAccountAddress() == account.address) {
                        newItem.attr('class', 'disabled');
                        link.text(account.name + '');
                    } else {
                        link.text('Patient @ ' + account.substring(0,7));
                    }
            
                    console.log('2');
            
                    link.attr('OnClick', funcName + '("' + account + '");');
                }
            }
        }
    });
}



function LoadActor(pAddress) {
    console.log('Actor address: ' + pAddress);

    window.CurrentActorAddress = pAddress;

    $('#actorNameDDL').text(GetAccountNameAt(pAddress));

    $('#permissionsDiv').find('input:checkbox').each(function() {
        $(this).prop('checked', false);
    });

    Patient.GetConsentDirectiveCount.call(function (error, directives) {
        if (error) {
            console.error('GetConsentDirectives call failed');
        } else {
            window.NoOfDirectives = directives.c[0];
            FindFirstConsentDirectiveFor(pAddress, ContinueLoadingActor);
        }
    });
}

function ContinueLoadingActor() {
    if (!ConsentDirective) {
        console.error('ContinueLoadingActor -- First Consent Directive NOT found');
    } else {
        console.info('ContinueLoadingActor -- continuing with CD@' + window.ConsentDirective);
        $('#permissionsDiv').find('input:checkbox').each(function() {
            var flag = $(this).attr('val');
            var bit_on = ((flag & ConsentDirective.what) == flag);
            $(this).prop('checked', bit_on);
        });
    }
}

function SaveConsentDirective() {

    var what = 0;

    $('#permissionsDiv').find('input:checkbox').each(function () {
        if ($(this).prop('checked')) {
            what += Number($(this).attr('val'));
        }
    });

    Patient.SetConsentDirective(CurrentActorAddress, what, function(error, result) {
        if (error) {
            console.error('Error updating consent directive');
        } else {
            console.info('Consent Directive updated');
            web3.eth.getTransaction(result , function(error, data) {
                console.log(data);
            })
        }
    });
}

function ViewProfile() {
    var checkPermissionFor = 16;
    var patientAddress;
    $('#patientsDiv').find('input:radio').each(function () {
        if ($(this).prop('checked')) {
            patientAddress = $(this).attr('val');
        }
    });

    if (!patientAddress) {
        alert('Select a patient to view Profile.')
    }

    PatientFactory.GetPatientFromAddress(patientAddress, function(error, patientContractAddress) {
        if (error) {
            console.error('Error loading contract address from patient address.')
        } else {
            let patientPromise = new Promise (function(resolve, reject) { 
                patientContract.at(patientContractAddress, function (error, patient) {
                    if (error) {
                        console.log('Error loading patient contract from contract address.')
                    } else {
                        resolve(patient);
                    }
                });
            });

            patientPromise.then(function(patient) {
                let promise = new Promise (function (resolve, reject) {
                    patient.CheckConsentsTo.call(checkPermissionFor, function (error, data) {
                        if (error) {
                            console.error('error while checking for profile view permission.');
                        } else {
                            resolve({allow:data[0],patName: data[1], patMcp: data[2].c[0]});
                        }
                    });
                });
                promise.then(function(data) {
                    patient.CreateAuditLog(GetAccountAddress(), checkPermissionFor, data.allow, Date.now(), function(error, txHash) {
                        if (error){
                            console.error('Error logging audit');
                        } else {
                            console.log('Audit logged in ' + txHash);
                            if (data.allow) {
                                $('#noAccessDiv').hide();
                                $('#patientProfileDiv').show();
                                $('#patientProfileDiv #patientProfileName').text(data.patName);
                                $('#patientProfileDiv #patientProfileMcp').text(data.patMcp);
                            } else {
                                $('#noAccessDiv').show();
                                $('#patientProfileDiv').hide();
                            }                            
                        }
                    });
                })
            });
        }
    });
}

async function ViewAccessLogs() {
    var checkAccessLogForDate = new Date($( '#datepicker' ).val()).getTime();
    var patientAddress;
    $('#patientsLogDiv').find('input:radio').each(function () {
        if ($(this).prop('checked')) {
            patientAddress = $(this).attr('val');
        }
    });

    if (!patientAddress) {
        alert('Select a patient to view Profile.');
    }

    PatientFactory.GetPatientFromAddress(patientAddress, function(error, patientContractAddress) {
        if (error) {
            console.log('Error loading contract address from patient address.')
        } else {
            patientContract.at(patientContractAddress, function (error, patient) {
                if (error) {
                    console.log('Error loading patient contract from contract address.')
                } else {
                    patient.GetAccessLogLength(function(error, len) {
                        if (error) {
                            console.error('Error loading bit flags');
                        } else {
                            var length = len.c[0];
                            var logs = [];
                            for (var i = 0; i < length; i++){
                                patient.GetAccessLogAt(i, function(error, auditLogs) {
                                     if (error) {
                                         console.error('Error loading bit flags');
                                     } else {
                                         logs.push( {AccessedBy: auditLogs[0],
                                                     PermissionRequested: auditLogs[1].c[0],
                                                     AccessedAt: auditLogs[2].c[0],
                                                     AccessGranted: auditLogs[3]});
                                         if (i == length) {
                                            displayAccessLogs(logs);                                             
                                         }
                                     }
                                 });
                             }
                        }
                    });
                }
            });
        }
    });

}

function displayAccessLogs(logs) {
    if ($('.auditorContent').find('.auditLogs').length) {
        $('.auditorContent').find('.auditLogs').empty();
    }
    for (var i = 0; i < logs.length; i++) {
        var newDiv = '<div class= "auditLogs"> Accessed by : ' + Accounts.accounts.find( function (acc) { return acc.address == logs[i].AccessedBy}).name +' <br> Accessed at: '+ logs[i].AccessedAt + '</div>';
        $('.auditorContent').append($(newDiv));
    }
    
}

function FindFirstConsentDirectiveFor(pActor, f) {
    window.ConsentDirective = null;

    for (var i = 0; i < NoOfDirectives; i++) {
        Patient.GetConsentDirective.call(i, function(error, cd) {
            if (error) {
                console.error('Error loading Consent Directive');
            } else {
                cd = {who: cd[0], what: cd[1].c[0] };
                if (pActor == cd.who) {
                    window.ConsentDirective = cd;
                    console.log('CD@' + window.ConsentDirective + ' for actor@' + pActor + ' found');
                    f();
                }
            }
        });
    }
}


function ShowForm() {
    $("#actionButton").hide();
    $("#getPatientDeails").show();
}

function CreatePatient() {
    let pName = $("input[name=PatientName]").val();
    let pMcp = $("input[name=mcpNo]").val();
    PatientFactory.MakePatient(pName, pMcp, function (error, result) {
        if (error) {
            console.error('MakePatient transaction failed');
        } else {
            setTimeout(ReloadPage, 2500);
        }
    });
}

function DestroyPatient() {
    PatientFactory.DeletePatient(function (error, result) {
        if (error) {
            alert('Delete transaction failed');
        } else {
            setTimeout(ReloadPage, 2000);
        }
    });
}

function ReloadPage() {
    location.reload();
}

/*
 * Admin functions
 */
function InitConsentData() {
    // TODO add each bit as a Category in the category catalog

    window.Permissions = [
        { 'value': 0x00000001, 'name': 'Authority to Consent' },
        { 'value': 0x00000010, 'name': 'View' },
        { 'value': 0x00000020, 'name': 'Modify' },
        { 'value': 0x00000040, 'name': 'Add Note' },
        { 'value': 0x00000080, 'name': 'Pull Chart' },
        { 'value': 0x00000100, 'name': 'Order' },
        { 'value': 0x00000200, 'name': 'View Order' },
        { 'value': 0x00000400, 'name': 'Submit Order Report' },
        { 'value': 0x00000800, 'name': 'Enter Order Codes' },
    ];

}

function GetPermissionName(value) {
    for (var i = 0; i < Permissions.length; i++) {
        if (Permissions[i].value == value) {
            return Permissions[i].name;
        }
    }
    return 'Unknown';
}

function InitExternal() {
    LoadPatients('LoadActor1', 1);
    LoadActor1(Accounts.accounts[1].address); // Patient

    LoadDDLActors('LoadActor2', 2);
    LoadActor2(Accounts.accounts[3].address); // MD

    LoadCategoriesForExternal();
}

function LoadActor1(pAddress) {
    console.info('Actor1 address: ' + pAddress);
    window.CurrentActor1Address = pAddress;

    $('#actor1Span').text(pAddress ? 'Patient @ ' + pAddress.substring(0,7) : 'Actor 1');
    AnswerQuestion();
}


function LoadActor2(pAddress) {
    console.info('Actor2 address: ' + pAddress);
    window.CurrentActor2Address = pAddress;

    $('#actor2Span').text(GetAccountNameAt(pAddress));
    AnswerQuestion();
}

function LoadCategory(address) {
    for (var i = 0; i < CurrentCategories.length; i++) {
        if (address == CurrentCategories[i].address) {
            CurrentCategories[i].Name.call(function(error, name) {
                if (error) {
                    console.log('Unable to load Category name');
                } else {
                    $('#actionSpan').text(name);
                    AnswerQuestion();
                }
            });

            window.CurrentCategoriesIndex = i;
        }
    }

}

window.CurrentActor1Address = null;
window.CurrentActor2Address = null;
window.CurrentCategories = [];
window.CurrentCategoriesIndex = -1;

var i = 0;
function AnswerQuestion() {
    $('#answerSpan').text('N/A');

    if (CurrentActor1Address == null || CurrentActor2Address == null || CurrentCategoriesIndex == -1) {
        return;
    }

    PatientFactory.IsPatient.call(CurrentActor1Address, function(error, isPatient) {
        if (error) {
            $('#answerSpan').text('No');
        } else {
            if (!isPatient) {
                $('#answerSpan').text('No');
                return;
            }

            PatientFactory.GetPatientFromAddress(CurrentActor1Address, function(error, patientAddress) {
                if (error) {
                    $('#answerSpan').text('No');
                } else {
                    patientContract.at(patientAddress, function (error, patient) {
                        if (error) {
                            $('#answerSpan').text('No');
                        } else {
                            console.log('Loaded Patient @ ' + patientAddress);

                            var categoryAddress = CurrentCategories[CurrentCategoriesIndex].address;
                            patient.ConsentsTo.call(CurrentActor2Address, categoryAddress, function(error, consents) {
                                if (error) {
                                    $('#answerSpan').text('No');
                                }
                                else {
                                    if (consents) {
                                        $('#answerSpan').text('Yes!');
                                    } else {
                                        $('#answerSpan').text('No!');
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }

    });

}


function LoadCategoriesForExternal() {
    var categoryMetadata = LoadContractMetadata('Category.json');
    var categoryContract = web3.eth.contract(categoryMetadata.abi);

    window.CurrentCategories = [];
    window.CurrentCategoriesIndex = -1;

    CategoryCatalog.GetAll.call(function(error, categories) {
        if (error) {
            console.log('Error loading categories');
        } else {
            console.log('Categories loaded');

            var first = true;

            for (var i = 0; i < categories.length; i++) {

                categoryContract.at(categories[i], function (error, instance) {
                    if (error) {
                        console.log('Unable to load Category instance');
                    } else {
                        console.log('Category address -- ' + instance.address);

                        CurrentCategories.push(instance);

                        instance.Name.call(function(error, name) {
                            if (error) {
                                console.log('Unable to load Category name');
                            } else {
                                console.log(name);

                                var templateId = '#actorTemplateDdi3';
                                var targetId = '#actorsDdm3';

                                var newItem = $(templateId).clone();
                                newItem.attr('style', '');
                                newItem.appendTo(targetId);

                                var link = newItem.children(':first');
                                link.text(name);
                                link.attr('OnClick', 'LoadCategory("' + instance.address + '");');

                                if (first) {
                                    first = false;
                                    LoadCategory(instance.address);
                                }

                            }
                        });


                    }
                });

            }
        }
    });
}


function InitAdmin() {
    var adminAccount = Accounts.accounts.find(function (accnt) { return accnt.name == 'Admin'});

    if (adminAccount.address == GetAccountAddress()) {
        $('#adminDiv').show();
        $('#nonAdminDiv').hide();
    } else {
        $('#adminDiv').hide();
        $('#nonAdminDiv').show();
    }
    InitAdmin2();
}

function InitAdmin2() {
    CategoryCatalog.GetAll.call(function (error, result) {
        if (error) {
            alert('GetAll call failed');
        } else {
            window.AllCategories = result;
            if (AllCategories.length == 0) {
                $('#noCategoriesDiv').show();
                $('#categoriesDiv').hide();
            } else {
                $('#noCategoriesDiv').hide();
                $('#categoriesDiv').show();
            }
            InitPermissionsHeaderDiv();
            LoadCategories();
        }
    });
}

function InitPermissionsHeaderDiv() {
    for (var i = 0; i < window.Permissions.length; i++) {
        var permission = window.Permissions[i];
        var newRow = $('#permissionsHeaderDiv').clone();
        newRow.attr('id', 'permissionsContentDiv');

        var hexTemplate = '0x00000000';
        var val = permission.value.toString(16);
        var res = hexTemplate.substring(0, hexTemplate.length - val.length) + val;

        newRow.children('#permissionsIncludeDiv').html('<input type=\'checkbox\' val=\'' + permission.value + '\'></input>');
        newRow.children('#permissionsNameDiv').text(permission.name);
        newRow.children('#permissionsFlagsDiv').text(res);
        newRow.appendTo('#permissionsDiv');
    }
}

function AddCategoryFromUi() {
    var permissions = [];
    $('#permissionsDiv').find('input:checkbox').each(function () {
        if ($(this).prop('checked')) {
            permissions.push(Number($(this).attr('val')));
        }
    });

    var name = $('#categoryNameInput').val();
    AddCategory(name, permissions);
}

function AddCategory(name, permissions) {
    var metadata = LoadContractMetadata('/Category.json');
    let bytecode = metadata.bytecode;
    let MyContract = web3.eth.contract(metadata.abi);

    web3.eth.estimateGas({
        data: bytecode
    }, function (error, gasEstimate) {
        if (error) {
            alert('Unable to estimate gas');
        } else {
            MyContract.new(name, {
                from: GetAccountAddress(),
                data: bytecode,
                gas: gasEstimate * 2}, function (err, myContract) {
                if (!err) {
                    if (!myContract.address) {
                        console.log('Tx hash: ' + myContract.transactionHash);
                    } else {
                        console.log('Contract address: ' + myContract.address);

                        CategoryCatalog.Add(myContract.address, function (error, result) {
                            if (error) {
                                console.log('Error adding category to the catalog');
                            } else {
                                console.log('Category added to the catalog');
                                AddPermissions(myContract, permissions);
                            }
                        });
                    }
                }
            });
        }
    });
}

function AddPermissions(category, permissions) {
    category.Name.call(function(error, name) {
        if (error) {
            console.log(error);
        } else {
            console.log('Category name: ' + name);
            console.log('Permissions to add: ' + permissions);
        }
    });

    for (var i = 0; i < permissions.length; i++) {
        console.log('Will add consent data -- ' + permissions[i]);
        category.AddConsentData(permissions[i], function(error, result) {
            if (error) {
                console.log('Error adding consent data');
            }
            else {
                console.log('Consent data added');
                LoadCategories();
            }
        });
    }

}

function LoadCategories() {
    $('#categoriesDisplayContentDiv').text('');

    CategoryCatalog.GetAll.call(function(error, categories) {
        if (error) {
            console.log('Error loading categories');
        } else {
            console.log('Categories loaded');
            for (var i = 0; i < categories.length; i++) {

                var categoryMetadata = LoadContractMetadata('Category.json');
                var categoryContract = web3.eth.contract(categoryMetadata.abi);
                categoryContract.at(categories[i], function (error, instance) {
                    if (error) {
                        console.log('Unable to load Category instance');
                    } else {
                        console.log('Category address -- ' + categories[i]);

                        instance.Name.call(function(error, name) {
                            if (error) {
                                console.log('Unable to load Category name');
                            } else {
                                instance.GetAllConsentData.call(function(error, data) {
                                    if (error) {
                                        console.log('Unable to load Category consent data');
                                    } else {
                                        var newRow = $('#categoriesDisplayHeaderDiv').clone();
                                        newRow.children('#categoriesDisplayNameDiv').text(name);

                                        var description = '';
                                        for (var i = 0; i < data.length; i++) {
                                            description += GetPermissionName(data[i].toNumber()) + '; ';
                                        }
                                        newRow.children('#categoriesDisplayPermissionsDiv').text(description);

                                        newRow.appendTo('#categoriesDisplayContentDiv');
                                    }

                                });

                            }
                        });


                    }
                });

            }
        }
    });
}
