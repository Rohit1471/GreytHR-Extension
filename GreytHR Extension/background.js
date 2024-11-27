chrome.webRequest.onCompleted.addListener(
    function (details) {
      const urlPattern = /^https:\/\/designnbuy\.greythr\.com\/latte\/v3\/attendance\/info\/\d+\/swipes(\?.*)?$/;
      if (details.url.includes('https://designnbuy.greythr.com/latte/v3/attendance/info/') && urlPattern.test(details.url)) {
        chrome.storage.local.set({ apiData: details.url });
        console.log('Set Url : ', details.url);
      }else{
        console.log("No Url matched....")
      }
    },
    { urls: ["<all_urls>"] } // Adjust to match API URL
  );
  