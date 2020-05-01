/* +++++++++++++++++++++++++++++++++
Create context menu item
*/
//browser.contextMenus.create({
chrome.contextMenus.create({
    id: "copy-link-to-clipboard",
    title: chrome.i18n.getMessage("menuContextSendLink"),
contexts: ["link"],
},onCreated);

/* +++++++++++++++++++++++++++++++++
Create context menu item
*/
//browser.contextMenus.create({
// chrome.contextMenus.create({
//     id: "associate-to-freebox",
//     title: "Associate to freebox",
// contexts: ["all"],
// },onCreated);

/* +++++++++++++++++++++++++++++++++
Listen to new context menu item
and start QNAP steps for download
*/
//browser.contextMenus.onClicked.addListener((info, tab) => {
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "copy-link-to-clipboard") {
        // Examples: text and HTML to be copied.
        const text = "This is text: " + info.linkUrl;
        // Always HTML-escape external input to avoid XSS.
        const safeUrl = escapeHTML(info.linkUrl);
        const html = `This is HTML: <a href="${safeUrl}">${safeUrl}</a>`;

        console.log("Send to QNAP URL="+safeUrl);
        LoadAndLogAndAddUrl(safeUrl);
    }
});

// https://gist.github.com/Rob--W/ec23b9d6db9e56b7e4563f1544e0d546
function escapeHTML(str) {
    // Note: string cast using String; may throw if `str` is non-serializable, e.g. a Symbol.
    // Most often this is not the case though.
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;")
        .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}




/*
Called when the item has been created, or when creation failed due to an error.
We'll just log success/failure here.
*/
function onCreated() {
//  if (browser.runtime.lastError) {
  if (chrome.runtime.lastError) {
    console.log(`Error: ${chrome.runtime.lastError}`);
  } else {
    chrome.browserAction.setBadgeText({text:""});

    console.log("Item created successfully");
  }
}

/*
Called when the item has been removed.
We'll just log success here.
*/
function onRemoved() {
  console.log("Item removed successfully");
}

/*
Called when there was an error.
We'll just log the error here.
*/
function onError(error) {
  console.log(`Error: ${error}`);
}


/* +++++++++++++++++++++++++++++++++
QNAP settings vars
*/
var NASsecure = true;
var NASprotocol = "";
var NASaddr = "mafreebox.freebox.fr";
var NASport = "80";
var NASpassword = ""; // use as app_token
var NASdir = "";
var NASsid = "";
var api_base_url = "/api/";
var api_major_version = "v7";
var app_challenge="";
var session_token="";

var api_base_url = "";
var api_major_version_body = "";
var api_major_version = "";
var app_id = "fr.freebox.webextension 4";
var app_name = "SendToFreebox 4 Extension";

function onError(error) {
    console.log(`Error: ${error}`);
  }


function initialize() {
//  var gettingAllStorageItems = browser.storage.local.get(null);
  chrome.storage.local.get(null,function(res) {
//      NASaddr = res.NASaddress;
      NASport = res.NASport;
      NASpassword = res.NASpassword;
      NASdir = res.NASdir;
//      NASsecure = res.NASsecure;
      if (NASsecure)
      {
        NASprotocol = "https";
      }
      else {
        NASprotocol = "http";
      }
  });
}
//browser.storage.onChanged.addListener(initialize);
chrome.storage.onChanged.addListener(initialize);


/* +++++++++++++++++++++++++++++++++
Load NAS settings and call next steps
*/
function LoadAndLogAndAddUrl(url) {
//  var gettingAllStorageItems = browser.storage.local.get(null);
/*  var gettingAllStorageItems = chrome.storage.local.get(null);
  gettingAllStorageItems.then((res) => {
      NASaddr = res.NASaddress;
      NASport = res.NASport;
      NASpassword = res.NASpassword;
      NASdir = res.NASdir;*/

    chrome.storage.local.get(null,function(res) {
//      NASaddr = res.NASaddress;
      if (res.NASaddr !== undefined)
        NASaddr = res.NASaddr;

      if (res.NASport !== undefined)
        NASport = res.NASport;

      if (res.NASpassword !== undefined)
        NASpassword = res.NASpassword;

      if (res.NASport !== undefined)
        NASdir = res.NASdir;
//      NASsecure = res.NASsecure;
      if (NASsecure)
      {
        NASprotocol = "https";
      }
      else {
        NASprotocol = "http";
      }

    console.log("settings: "+NASprotocol+":"+res.NASpassword+"@"+res.NASaddress+":"+res.NASport+"/"+res.NASdir);
    if ((api_base_url.length) > 0 && (api_major_version > 0))
    {
     console.log("Freebox already discovered")
     LogAndAddUrl(url);
   }
    else
    {
      console.log("Discover first");
      discoverFreebox(url);
    }
  });
}

function notifyExtension(url) {
  console.log("content script sending message: "+url);
  browser.runtime.sendMessage({"url": url});
}

function discoverFreebox(url)
{
     var data="";

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

              if (NASpassword !== undefined && NASpassword.length > 0)
              {
                if (NASsid.length > 0)
                {
                  addURL(NASsid, url);
                }
                else {
                  LogAndAddUrl(url);
                }
              }
              else
              {
                console.log("Not associated yet !")
                chrome.browserAction.setBadgeText({text:"Err"});
              }

            }
            else
            {
              console.log("No respond on freebox url:"+NASaddr)
              //alert("No respond on freebox url:"+NASaddr)
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

/* +++++++++++++++++++++++++++++++++
Login into NAS and get SID for next step
*/
function LogAndAddUrl(url) {
  var data="";

  if (true) //(NASsid.length == 0)
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
            LogSessionAndAddUrl(app_challenge,url);
          }
          else
            console.log("problem !")

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
    addURL(NASsid,url);
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
Login into NAS and get SID for next step
*/
function LogSessionAndAddUrl(app_challenge,url) {
  var data="";
  var fbxpassword="";

  fbxpassword = generatePassword(app_challenge,NASpassword);

//   "app_id": "fr.freebox.testapp3",

  data = `{
    "app_id": "${app_id}",
    "password" : "${fbxpassword}"
  }`

  if (true) //(NASsid.length == 0)
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
            addURL(NASsid,url);
          }
          else
            console.log("problem !")

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
    addURL(NASsid,url);
  }
}

/* +++++++++++++++++++++++++++++++++
 Add download task using Session Token (SID)
*/
function addURL(sid, url) {
    //var data = "sid="+sid+"&temp=Download&move=Multimedia%2FTemp&url=http%3A%2F%2Freleases.ubuntu.com%2F18.04%2Fubuntu-18.04.4-desktop-amd64.iso";
    console.log("SID="+sid);
    console.log("URL="+url);

    var urlQNAP = url.replace(/\//g,"%2F");
    urlQNAP = urlQNAP.replace(/:/,"%3A");
    console.log("urlQNAP="+urlQNAP);

    var dirQNAP = NASdir.replace(/\//g,"%2F");
    dirQNAP = dirQNAP.replace(/:/,"%3A");
    console.log("dirQNAP="+dirQNAP);

    var data = "download_url="+urlQNAP;
    //var data = "sid="+sid+"&temp=Download&move=Multimedia%2FTemp&url="+urlQNAP;

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            console.log(this.responseText);
        }
    });

    console.log("Lancement Freebox add URL ");
    var requete = NASprotocol+"://"+NASaddr+api_base_url+api_major_version+"/downloads/add";
    console.log("Download Add Request :"+requete);
    console.log("Download Add Body :"+data);
    console.log("Using SID "+sid)

    xhr.open("POST", requete);
    xhr.setRequestHeader("X-Fbx-App-Auth", sid);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
    console.log(xhr);
    xhr.send(data);

    }
