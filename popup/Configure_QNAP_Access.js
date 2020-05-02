function saveOptions(e) {
  // chrome.storage.local.set({
  //   NASsecurevalue: document.querySelector("#NASsecure").value
  // });
  chrome.storage.local.set({
    NASsecure: document.querySelector("#NASsecure").checked
  });
  chrome.storage.local.set({
    NASaddress: document.querySelector("#NASaddress").value
  });
  chrome.storage.local.set({
    NASport: document.querySelector("#NASport").value
  });
  chrome.storage.local.set({
    NASpassword: document.querySelector("#NASpassword").value
  });
  chrome.storage.local.set({
    NASdir: document.querySelector("#NASdir").value
  });
//  e.preventDefault();
}


function restoreOptions() {
  function onError(error) {
    console.log(`Error: ${error}`);
  }

  var toStore = false;
  var DefPort = "";

  function setCurrentSecure(res){
        console.log("Secure from storage = "+res.NASsecure);
        if (res.NASsecure === undefined)
        {
          document.querySelector("#NASsecure").checked = NASsecure = true;
          toStore = true;
          chrome.storage.local.set({
            NASsecure: document.querySelector("#NASsecure").checked
          });

        }
          else
          {
            document.querySelector("#NASsecure").checked = NASsecure = res.NASsecure ;
          }
         console.log("Set DOM "+document.querySelector("#NASsecure").checked+" with "+NASsecure )
         if (NASsecure)
         {
           DefPort = "443";
           NASprotocol = "https";
         }
         else
         {
           DefPort = "80";
           NASprotocol = "http";
         }
     }

  chrome.storage.local.get('NASsecure',setCurrentSecure);


 function setCurrentAddress(res){
     document.querySelector("#NASaddress").value = NASaddr = res.NASaddress || "mafreebox.freebox.fr" ;
     console.log("Set DOM "+document.querySelector("#NASaddress").value+" with "+NASaddr)
     if (res.NASaddress === undefined)
     {
       toStore = true;
       chrome.storage.local.set({
         NASaddress: document.querySelector("#NASaddress").value
       });
     }
   }

    chrome.storage.local.get('NASaddress',setCurrentAddress);



  function setCurrentPort(res){
     document.querySelector("#NASport").value = NASPort = res.NASport || DefPort ;
     console.log("Set DOM "+document.querySelector("#NASport").value+" with "+res.NASport || DefPort);
     if (res.NASport === undefined)
     {
       toStore = true;
       chrome.storage.local.set({
         NASport: document.querySelector("#NASport").value
       });
     }
  }

  chrome.storage.local.get('NASport',setCurrentPort);

  function setCurrentPassword(res){
     document.querySelector("#NASpassword").value = NASpassword = res.NASpassword || "" ;
      console.log("Set DOM "+document.querySelector("#NASpassword").value+" with "+res.NASpassword || "");

      if (NASpassword.length > 0)
      {
        clearError();
        document.querySelector("#testConnectionButton").textContent = "Test Connection";
        document.querySelector("#testConnectionButton").removeEventListener("click", AssociateToFreebox);
        document.querySelector("#testConnectionButton").addEventListener("click", testConnection);
      }
      else {
        showError("Freebox Server NOT associated");
        document.querySelector("#NASpasswordLabel").style.color = "red";
        document.querySelector("#testConnectionButton").textContent = "Associate Freebox";
        document.querySelector("#testConnectionButton").removeEventListener("click", testConnection);
        document.querySelector("#testConnectionButton").addEventListener("click", AssociateToFreebox);
      }
  }

  chrome.storage.local.get('NASpassword',setCurrentPassword);


  function setCurrentDir(res){
     document.querySelector("#NASdir").value = res.NASdir || "/Freebox/Téléchargements" ;
     var NASdir = btoa( document.querySelector("#NASdir").value );
     console.log("Set DOM "+document.querySelector("#NASdir").value+" with "+res.NASdir || "/Freebox/Téléchargements" )
     if (res.NASdir === undefined)
     {
       chrome.storage.local.set({
         NASdir: document.querySelector("#NASdir").value
       });
       toStore = true;
     }
   }

  chrome.storage.local.get('NASdir',setCurrentDir);
}

function initPage()
{
  restoreOptions();
  console.log("Restore Settings launched");

  if (api_base_url === "" || api_major_version_body === "" || api_major_version === "")
  {
    console.log("Missing Freebox api info: test connection with getapiversion");
    testConnection();
  }
}

document.addEventListener('DOMContentLoaded', initPage);

chrome.storage.onChanged.addListener(restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);


function changeNASInfo(newInfo)
{
  document.querySelector("#NASInfo").textContent=newInfo;
}

function toggleHideMenu() {
  var x = document.querySelector("#NASSettingForm");
//  console.log("Section id "+id+" is "x.className.indexOf("showsection"))
  if (x.className.indexOf("hidesection") == -1) {
    x.className += "hidesection";
  } else {
    x.className = x.className.replace("hidesection", "");
  }
}
document.querySelector("#SettingsMenu").addEventListener("click", toggleHideMenu);


//==================
function showError(msg)
{
  console.log(msg);
  document.querySelector("#ErrMsg").textContent = msg;
  chrome.browserAction.setBadgeText({text:"Err"});
}

function clearError()
{
  console.log("Clear Error");
  document.querySelector("#ErrMsg").textContent = "";
  chrome.browserAction.setBadgeText({text:""});
  document.querySelector("#NASpasswordLabel").style.color = "black";
}

//==================
var NASprotocol = "https";
var NASaddr = "mafreebox.freebox.fr";
var NASport = "";
var NASpassword = "";
var NASdir = "";
var NASsecure = true;
var NASsid = "";
var api_base_url = "";
var api_major_version_body = "";
var api_major_version = "";
var app_id = "fr.freebox.webextension 4";
var app_name = "SendToFreebox 4 Extension";
// var api_base_url = "/api/";
// var api_major_version = "v7";
// var app_id = "fr.freebox.webextension 4";
// var app_name = "SendToFreebox 4 Extension";

// Look for freebox
//testConnection();
function testConnection()
{
     var data="";
    var xhr = new XMLHttpRequest();

    clearError();

  //        xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
          if(this.readyState === 4) {
            console.log(this.responseText);
            var jsonData = JSON.parse(this.responseText);

            //check JSON parsing is valid
            if (typeof jsonData === "object" && jsonData !== null )
            {
              console.log("Freebox found");
              NASHostname = jsonData.device_name;
              NASDisplayName = jsonData.box_model_name;
              NASPortInfo = jsonData.https_port;
              NASsecure = jsonData.https_available;
              if (NASsecure)
              {
                NASprotocol = "https";
              }
              else {
                NASprotocol = "http";
              }


              api_base_url = jsonData.api_base_url ;
              api_major_version_body = jsonData.api_version.split(".")[0];
              api_major_version = "v"+api_major_version_body;
              console.log("api "+api_major_version_body+" => "+api_base_url+api_major_version);

              changeNASInfo(NASHostname+" "+NASDisplayName+" (api "+api_major_version+") on port "+NASPortInfo);

            }
            else
            {
              showError("Freebox Server not found");
            }

          }
          else {
            {
              showError("Request not sent: Add freebox root CA certificate");
            }
          }
      });

      console.log("Discover Freebox request");
      var requete = NASprotocol+"://"+NASaddr+"/api_version";
      console.log("Discover api Freebox Request :"+requete);
      xhr.open("GET", requete);
     xhr.setRequestHeader("Content-Type", "application/json");

      xhr.send(data);
}

function LoadSettings()
{
  console.log("Load settings");
  chrome.storage.local.get(null,function(res) {
      NASpassword = res.NASpassword;
      NASdir = res.NASdir;

      if (NASpassword.length > 0)
      {
        console.log("Freebox already associated");
        document.querySelector("#testConnectionButton").textContent = "Test Connection"
//        document.querySelector("#testConnectionButton").addEventListener("click", AssociateToFreebox);
      }
      else {
//        document.querySelector("#testConnectionButton").addEventListener("click", discoverFreebox);
        console.log("Freebox NOT associated");
        document.querySelector("#testConnectionButton").textContent = "Associate Freebox"
      }

     if (NASsecure)
     {
       NASprotocol = "https";
     }
     else {
       NASprotocol = "http";
     }
     console.log("Load settings: "+ NASprotocol);
  }
);
}

function discoverFreebox()
{
     var data="";
     NASsecure = true;
     NASprotocol = "https";
     NASaddr = "mafreebox.freebox.fr";
     NASpassword = ""; // use as app_token

    var xhr = new XMLHttpRequest();

  //        xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
          if(this.readyState === 4) {
            console.log(this.responseText);
            var jsonData = JSON.parse(this.responseText);

            //check JSON parsing is valid
            if (typeof jsonData === "object" && jsonData !== null )
            {
              console.log("Freebox found");
              NASHostname = jsonData.device_name;
              NASDisplayName = jsonData.box_model_name;
              NASPortInfo = jsonData.https_port;
              NASsecure = jsonData.https_available;
              if (NASsecure)
              {
                NASprotocol = "https";
              }
              else {
                NASprotocol = "http";
              }

              api_base_url = jsonData.api_base_url ;
              api_major_version_body = jsonData.api_version.split(".")[0];
              api_major_version = "v"+api_major_version_body;
              console.log("api "+api_major_version_body+" => "+api_base_url+api_major_version);

              changeNASInfo(NASHostname+" "+NASDisplayName+" (api "+api_major_version+") on port "+NASPortInfo);

              if (NASpassword.length == 0)
              {
                AssociateToFreebox();
              }
            }
            else
              console.log("problem !")
          }
      });

      console.log("Discover Freebox request");
      var requete = NASprotocol+"://"+NASaddr+"/api_version";
      console.log("Discover api Freebox Request :"+requete);
      xhr.open("GET", requete);
     xhr.setRequestHeader("Content-Type", "application/json");

      xhr.send(data);
}

/* +++++++++++++++++++++++++++++++++
Login into NAS and get SID for next step
*/
function AssociateToFreebox() {
  var data="";
//   NASsecure = true;
//   NASprotocol = "https";
//   NASaddr = "mafreebox.freebox.fr";
//   NASpassword = ""; // use as app_token
//   api_base_url = "/api/";
//   api_major_version = "v7";
  clearError();

  data = `{
    "app_id": "${app_id}",
    "app_name": "${app_name}",
    "app_version": "${api_major_version_body}",
    "device_name": "Browser"
 }`;

    var xhr = new XMLHttpRequest();

//        xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
          console.log(this.responseText);
          var jsonData = JSON.parse(this.responseText);
          if (jsonData.success === true)
          {
            console.log("app_token=> "+jsonData.result.app_token);
            NASpassword = jsonData.result.app_token;
            chrome.storage.local.set({
              NASpassword: NASpassword
            });
            console.log("track id=> "+jsonData.result.track_id);
            NAStrackid = jsonData.result.track_id;
            chrome.storage.local.set({
              NAStrackid: NAStrackid
            });

            WaitAppToken(NAStrackid);
          }
          else
          {
            showError("Freebox not found yet !");
          }
        }
    });

    console.log(" Freebox get App Token with Authorize request");
    var requete = NASprotocol+"://"+NASaddr+api_base_url+api_major_version+"/login/authorize/";
    console.log("Login Authorise Request :"+requete);
    console.log("Login Authorise Body :"+data);
    xhr.open("POST", requete);
   xhr.setRequestHeader("Content-Type", "application/json");

    xhr.send(data);
}


/* +++++++++++++++++++++++++++++++++
Login into NAS and get SID for next step
*/
function WaitAppToken(track_id) {
    var xhr = new XMLHttpRequest();

//        xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
          console.log(this.responseText);
          var jsonData = JSON.parse(this.responseText);
          if (jsonData.success === true)
          {
            console.log("track status=> "+jsonData.result.status);
            if (jsonData.result.status === "pending")
            {
              console.log("Again track status=> ");
              setTimeout( WaitAppToken, 500, track_id);
            }
            else {
              LogGetChallenge();
            }

          }
          else
          {
            showError("Freebox association failed !")
          }
        }
    });

    console.log("Lancement Freebox get Challenge with Login Session request");
    var requete = NASprotocol+"://"+NASaddr+api_base_url+api_major_version+"/login/authorize/"+track_id;
    console.log("Login Authorise track :"+requete);
    xhr.open("GET", requete);
//     xhr.setRequestHeader("Content-Type", "application/json");

    xhr.send();
}




/* +++++++++++++++++++++++++++++++++
Login into NAS and get challenge for next step
*/
function LogGetChallenge() {
  var data="";

  if (NASsid === undefined || NASsid.length == 0)
  {
    var xhr = new XMLHttpRequest();

//    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
          console.log(this.responseText);
          var jsonData = JSON.parse(this.responseText);
          if (jsonData.success === true)
          {
            console.log("challenge="+jsonData.result.challenge);
            app_challenge = jsonData.result.challenge;

            LogSession(app_challenge);
          }
          else
          {
            showError("Freebox challenge not received !")
          }
        }
    });

    console.log("Lancement Freebox get Challenge with Login request");
    var requete = NASprotocol+"://"+NASaddr+api_base_url+api_major_version+"/login/";
    console.log("Login Request :"+requete);
    xhr.open("GET", requete);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");

    xhr.send(data);
  }
  else {
    console.log("SID "+NASsid+" already avaialble")
    GetDownloadConfig();
  }
}

function generatePassword(challenge, apptoken)
{
  var shaObj = new jsSHA(challenge, "TEXT");
	var hash = shaObj.getHash("SHA-1", "HEX");

	var hmacpassword = shaObj.getHMAC(apptoken, "TEXT", "SHA-1", "HEX");

  console.log("password="+hmacpassword);
  return(hmacpassword);
}

/* +++++++++++++++++++++++++++++++++
Login into NAS using challenge
*/
function LogSession(app_challenge) {
  var data="";
  var fbxpassword="";

  fbxpassword = generatePassword(app_challenge,NASpassword);

//   "app_id": "fr.freebox.testapp3",

  data = `{
    "app_id": "${app_id}",
    "password" : "${fbxpassword}"
  }`

  if (NASsid === undefined || NASsid.length == 0)
  {
    var xhr = new XMLHttpRequest();

    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
          console.log(this.responseText);
          var jsonData = JSON.parse(this.responseText);
          if (jsonData.success === true)
          {
            console.log("session_token sid ="+jsonData.result.session_token);
            NASsid = jsonData.result.session_token;

            // Retrieve default dir after association or login
            GetDownloadConfig();

          }
          else
            showError("Failed to get Sesson token")

        }
    });

    console.log("Lancement Freebox get Challenge with Login Session request");
    var requete = NASprotocol+"://"+NASaddr+api_base_url+api_major_version+"/login/session";
    console.log("Login Session Request :"+requete);
    console.log("Login Session Body :"+data);
    xhr.open("POST", requete);
    xhr.setRequestHeader("Content-Type", "text/plain; charset=utf-8");

    xhr.send(data);
  }
  else {
    console.log("SID "+NASsid+" already avaialble")
    GetDownloadConfig();
  }
}

/* +++++++++++++++++++++++++++++++++
Login into NAS using challenge
*/
function GetDownloadConfig() {


  if (NASsid !== undefined && NASsid.length > 0)
  {
    var xhr = new XMLHttpRequest();

    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
          console.log(this.responseText);
          var jsonData = JSON.parse(this.responseText);
          if (jsonData.success === true)
          {
            console.log("Default download dir ="+jsonData.result.download_dir);
            NASdir = jsonData.result.download_dir;

          }
          else
            showError("Fail to get download config");

        }
    });

    console.log("Lancement Freebox get Download Config");
    var requete = NASprotocol+"://"+NASaddr+api_base_url+api_major_version+"/downloads/config/";
    console.log("Login Session Request :"+requete);
    xhr.open("GET", requete);
    xhr.setRequestHeader("X-Fbx-App-Auth", NASsid);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.send();
  }
  else {
    showError("No SID yet "+NASsid);
  }
}






//================
