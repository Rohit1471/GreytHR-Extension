let checkIfHasLocalUrl;

function checkIfApiIsInLocalAsync() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("apiData", function (result) {
      result.apiData ? resolve(result.apiData) : reject("No Api Data In Local");
    });
  });
}

async function checkIfAPIInLocal(){
  try{
    checkIfHasLocalUrl = await checkIfApiIsInLocalAsync();
    console.log("checkIfHasLocalUrl: ", checkIfHasLocalUrl);
  } catch(error){
    if (!checkIfHasLocalUrl) {
      chrome.webRequest.onCompleted.addListener(
        function (details) {
          // console.log("details.url: ", details.url);
          const urlPattern =/^https:\/\/designnbuy\.greythr\.com\/latte\/v3\/attendance\/info\/\d+\/swipes(\?.*)?$/;
          if (details.url.includes("https://designnbuy.greythr.com/latte/v3/attendance/info/") && urlPattern.test(details.url)) {
            chrome.storage.local.set({ apiData: details.url });
            console.log("Set Url : ", details.url);
          } else {
            console.log("No Url matched....");
          }
        },
        { urls: ["<all_urls>"] } // Adjust to match API URL
      );
    }
  }
}

checkIfAPIInLocal();


