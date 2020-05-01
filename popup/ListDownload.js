/* +++++++++++++++++++++++++++++++++
 Handles to DOM elements
*/

const addButton = document.querySelector("#NASpress");
const input = document.querySelector("#NAStest");
const tableDNL = document.querySelector("#NASDownloadTable");
const JobNb = document.querySelector("#NASDNLJobNb");

/* +++++++++++++++++++++++++++++++++
 Fill DOM element with retrieved Nb of download Jobs
*/
function setJobNb(newInfo)
{
  JobNb.textContent=newInfo+" Jobs in queue";
}


/* +++++++++++++++++++++++++++++++++
 Remove from DOM all download Jobs except first row used as header
*/
function clearDNLTable()
{
  var table = document.querySelector('#NASDownloadTable');
  var nbItem = table.rows.length;
  console.log("Nb of items to del:"+nbItem);
  if (table.rows.length > 1) {
      for (let i=1; i< nbItem;i++) {

        console.log("Loop2del "+i+" => item to del:"+table.rows[1].getAttribute("hash"));
        table.rows[1].remove();
      };
    }
}

/* +++++++++++++++++++++++++++++++++
 Add a new DOM element with one retrieved job defined by its QNAP hash, filename and already downloaded file
*/
function AddQNAPDNLasTable(hashFile ,filename,rateFile) {
  let newItem = filename;

  console.log("AQD New item="+newItem);

  var attrHash = document.createAttribute("hash");
  const fileRow = document.createElement('tr');
  const fileCol1 = document.createElement('td');
  const fileCol2 = document.createElement('td');
  const fileCol3 = document.createElement('td');
  const fileProgress = document.createElement('progress');
  const listBtn = document.createElement('button');

  console.log(" col1="+fileCol1);
  console.log(" col2="+fileCol2);
  console.log("btn="+listBtn);

  fileRow.appendChild(fileCol1);
  fileRow.id = "itemDNL";
  fileCol1.textContent = newItem;
//  fileCol1.width = "70%";

  fileProgress.textContent = rateFile;
  fileProgress.value = rateFile;
  fileProgress.max = "100";
  console.log("fprog="+fileProgress.value+"/"+fileProgress.max+" innerHTML="+fileProgress.innerHTML);

  fileCol2.appendChild(fileProgress);
  //fileCol2.textContent = rateFile;
  fileRow.appendChild(fileCol2);

  fileCol3.appendChild(listBtn);
  listBtn.className = "Btn3D";
  fileRow.appendChild(fileCol3);
  listBtn.textContent = 'X';

  attrHash.value = hashFile;
  fileRow.setAttributeNode(attrHash);
  tableDNL.appendChild(fileRow);

  listBtn.onclick = function(e) {
    console.log("Press Del="+hashFile);
    delDNL(hashFile);
    //tableDNL.removeChild(fileRow);
  }

}

/* +++++++++++++++++++++++++++++++++
 Link DOM button to callback
*/
function initListSection()
{
    var refreshButton = document.querySelector("#NASrefresh");

    refreshButton.addEventListener("click", LoadAndLogAndListDNL);
}

initListSection();


//==================================

/* +++++++++++++++++++++++++++++++++
Load NAS settings and call next steps
*/
function LoadAndLogAndListDNL(url) {

    chrome.storage.local.get(null,function(res) {
      NASaddr = res.NASaddress;
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

    console.log("settings: "+NASprotocol+":"+res.NASpassword+"@"+res.NASaddress+":"+res.NASport+"/"+res.NASdir);
    if ((api_base_url.length) > 0 && (api_major_version > 0))
    {
     console.log("Freebox already discovered")
     LogAndListDNL();
   }
    else
    {
      console.log("Discover first");
      discoverFreebox();
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

              if (NASpassword.length > 0)
              {
                if (NASsid.length > 0)
                {
                  ListFreeboxDNL(NASsid);
                }
                else {
                  LogAndListDNL();
                }
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
function LogAndListDNL() {
  var data="";

  if (NASsid.length == 0)
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
            LogSessionAndListDNL(app_challenge);
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
    ListFreeboxDNL(NASsid);
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
function LogSessionAndListDNL(app_challenge) {
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
            ListFreeboxDNL(NASsid);
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
    ListFreeboxDNL(NASsid);
  }
}

/* +++++++++++++++++++++++++++++++++
   return filename from URL
*/
function getFilenameOfURL(url) {
  console.log("gFN URL="+url);

  var flna = url.split("/");
  var fileURL = flna[flna.length-1];

  console.log("fileURL="+fileURL);

  return(fileURL);
}

/* +++++++++++++++++++++++++++++++++
 Add download task using SID
*/
function ListFreeboxDNL(sid) {
    var data = "sid="+sid+"&limit=0&status=all&type=all";
    var xhr = new XMLHttpRequest();


    console.log("SID="+sid);
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            var totalActiveDNL =0;
            console.log(this.responseText);
            var jsonData = JSON.parse(this.responseText);

            clearDNLTable();
            console.log("Total tasks:"+jsonData.result.length);
            for (i=0; i < jsonData.result.length ; i++) {
                if ( jsonData.result[i].status != "done" ) {
                  console.log("En cours ["+i+"].status : "+jsonData.result[i].status+" - "+jsonData.result[i].name);
                  console.log("Rate ["+i+"] : "+jsonData.result[i].rx_pct / 100);
                  totalActiveDNL++;
                  let fnDNL = "";
                  if (jsonData.result[i].status == "queued")
                  {
                    fnDNL = getFilenameOfURL(jsonData.result[i].name)
                  }
                  else {
                    fnDNL = jsonData.result[i].name;
                  }
                  let hashDNL = jsonData.result[i].id;
                  let rateDNL = Math.trunc(jsonData.result[i].rx_pct / 100);

                  let TabElt = document.querySelector("[hash=\""+hashDNL+"\"]");
                  console.log("Query Result ("+fnDNL+" - "+hashDNL+") = "+TabElt);

                  if ( TabElt == null)
                  {
                    console.log("Create="+fnDNL+" - "+hashDNL);
                    AddQNAPDNLasTable(hashDNL,fnDNL,rateDNL.toString());
                  }
                  else {
                    console.log("Doublon="+fnDNL+" - "+hashDNL);
                  }

                    //AddQNAPDNL(jsonData.data[i].source_name); // Only filled if actually downloading state = 104
                }
                else {
                  //console.log("Fini["+i+"].status : "+jsonData.data[i].state+" - "+jsonData.data[i].source_name);

                }
            }
            console.log("Total downloading:"+totalActiveDNL);
            setJobNb(totalActiveDNL);

        }
    });

    console.log("Lancement DNL query tasks");
    var requete = NASprotocol+"://"+NASaddr+api_base_url+api_major_version+"/downloads/";
    console.log("DNL query request to send:"+requete);
    console.log("Using SID "+sid)
    xhr.open("GET", requete);
    xhr.setRequestHeader("X-Fbx-App-Auth", sid);
    console.log(xhr);
    xhr.send(data);
}



//==================================


/* +++++++++++++++++++++++++++++++++
 Add download task using SID
*/
function delDNL(hash) {
    //var data = "sid="+sid+"&temp=Download&move=Multimedia%2FTemp&url=http%3A%2F%2Freleases.ubuntu.com%2F18.04%2Fubuntu-18.04.4-desktop-amd64.iso";
    sid = NASsid;
    console.log("SID="+sid);
    console.log("Hash="+hash);

    var data = "sid="+sid+"&hash="+hash;

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            console.log(this.responseText);
            var jsonData = JSON.parse(this.responseText);

            console.log("EndOfDel=>List (SID ="+sid+"  )")
            ListFreeboxDNL(sid);
      }

    });

    console.log("Lancement QNAP Remove Task hash:"+hash);
    var requete = NASprotocol+"://"+NASaddr+api_base_url+api_major_version+"/downloads/"+hash+"/erase";
    console.log("DNL erase request to send:"+requete);
    console.log("Using SID "+sid)
    xhr.open("DELETE", requete);
    xhr.setRequestHeader("X-Fbx-App-Auth", sid);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
    console.log(xhr);
    xhr.send(data);

}
