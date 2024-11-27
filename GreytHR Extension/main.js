  // Phase 1: Run this code in greytHR console only

  // markAttendence API by greytHR : https://designnbuy.greythr.com/v3/api/dashboard/dashlet/markAttendance

  // Note: greytHR processes time in UTC, so as per Indian UTC, we need to add 5:30hr to whatever time given in response of swipeInfo object

  let GLOBAL_TIME_MANAGER = {
    swipesUrl: '',
    data:"",
    allSwipes:"",
    workTime : "",
    breakTime : "",
    shiftTotalTime : {hr:8, min:30},
    shiftEndTime: "",
    remaningTime: "", //Can be used as extraa time with negative value
  }

  document.addEventListener("DOMContentLoaded", allDomLoaded);

  function allDomLoaded(){
    chrome.storage.local.get(["apiData"]).then((result) => {
      GLOBAL_TIME_MANAGER.swipesUrl = result.apiData;
      console.log(GLOBAL_TIME_MANAGER.swipesUrl);
      fetchData(GLOBAL_TIME_MANAGER.swipesUrl);
    });
  }

  function fetchData(apiEndPoint){
    fetch(apiEndPoint)  
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      GLOBAL_TIME_MANAGER.data = data;
      GLOBAL_TIME_MANAGER.allSwipes = swipeProvider(data);
      GLOBAL_TIME_MANAGER.workTime = calculateTime(GLOBAL_TIME_MANAGER.allSwipes, "work");
      GLOBAL_TIME_MANAGER.breakTime = calculateTime(GLOBAL_TIME_MANAGER.allSwipes, "break");
      GLOBAL_TIME_MANAGER.shiftEndTime = calculateShiftEndTime(GLOBAL_TIME_MANAGER.shiftTotalTime, GLOBAL_TIME_MANAGER.workTime);
      GLOBAL_TIME_MANAGER.remaningTime = calculateRemaningTime(GLOBAL_TIME_MANAGER.shiftTotalTime, GLOBAL_TIME_MANAGER.workTime);
      // console.log("Working Hour: ", GLOBAL_TIME_MANAGER.workTime);

      showOutput();


    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error); 
    });

  }

  function swipeProvider(data){
    if (!data.swipe || !Array.isArray(data.swipe)) {
      console.error('Swipe data is missing or invalid.');
      return;
    }    
    let allSwipes = [];
    let totalSwipes = data.swipe;
    totalSwipes.forEach((swipe, index) => {
      allSwipes.push(swipe.punchDateTime+"Z");
    });
    GLOBAL_TIME_MANAGER.allSwipes = allSwipes;
    
    return allSwipes;
  }

  function calculateTime(swipes, type){
    let totalSwipes = type==="work" ? [...swipes, new Date().toISOString()] : swipes.slice(1);
    // console.log("totalSwipes.length: ", totalSwipes);

    let totalTimeArr=[];
    for(let i=1; i<=(totalSwipes.length/2); i++){
      let diffTime = new Date(totalSwipes[2*i-1]) - new Date(totalSwipes[2*i-2]);
      totalTimeArr.push(~~(diffTime / (1000*60*60)));
      totalTimeArr.push(~~(((diffTime /1000)/60)%60));
    }

    return hrMinInISO(totalTimeArr);
  }

  function hrMinInISO(timeInISO){
    let totalHr=0, totalMin=0;
    timeInISO.forEach((time, index) => {
      if(index%2==0){
        totalHr= totalHr + time;
      } else {
        totalMin= totalMin + time;
      }
      if(totalMin>59){
        totalMin = totalMin-59;
        totalHr++;
      }
    })
    return {totalHr, totalMin}
  }

  function calculateShiftEndTime(shiftTotalTime, timeCompletedByMe){
    let timeCompletedInMS = timeCompletedByMe.totalHr*60*60*1000 + timeCompletedByMe.totalMin*60*1000;
    let shiftTimeInMS = shiftTotalTime.hr*60*60*1000 + shiftTotalTime.min*60*1000;
    let timeRemaningInMS = shiftTimeInMS - timeCompletedInMS;
    if(timeRemaningInMS<0) -timeRemaningInMS;
    let shiftCompletionTime = timeRemaningInMS + Date.now();
    shiftCompletionTime = new Date(shiftCompletionTime);
    let shiftCompletionTimeArr = shiftCompletionTime.toString().split(' ');
    return {shiftEndFixTime:shiftCompletionTimeArr[4], shiftEndDateTime:shiftCompletionTime}; 

  }

  function calculateRemaningTime(shiftTotalTime, timeCompletedByMe){
    let timeCompletedInMS = timeCompletedByMe.totalHr*60*60*1000 + timeCompletedByMe.totalMin*60*1000;
    let shiftTimeInMS = shiftTotalTime.hr*60*60*1000 + shiftTotalTime.min*60*1000;
    let timeRemaningInMS = shiftTimeInMS - timeCompletedInMS;
    let overtime=false;
    if(timeRemaningInMS<0) {-timeRemaningInMS; overtime = true;};

    let remaningTime = new Date(timeRemaningInMS).toISOString().split('T')[1].split(':00')[0]; 
    return {remaningTime:remaningTime, overtime:overtime}; 
  }

  function showOutput(){
    
    let outputContainer = document.querySelector('.outputContainer');

    let p1 = `<p><b>Total Shift Hours:</b> 08hr 30min </p>`
    let p2 = `<p><b>Today's Working Hours:</b> ${GLOBAL_TIME_MANAGER.workTime.totalHr}hr ${GLOBAL_TIME_MANAGER.workTime.totalMin}min</p>` ;
    let p3 = `<p><b>Today's Break Hours:</b> ${GLOBAL_TIME_MANAGER.breakTime.totalHr}hr ${GLOBAL_TIME_MANAGER.breakTime.totalMin}min</p>`;
    let p4 = `<p><b>Shift End Time:</b> ${GLOBAL_TIME_MANAGER.shiftEndTime.shiftEndFixTime}</p>`;
    let p5 = `<p><b>Remaning Time:</b> ${GLOBAL_TIME_MANAGER.remaningTime.remaningTime} </p>`;
    let p6 = `<p><b>Overtime:</b> ${GLOBAL_TIME_MANAGER.remaningTime.overtime ? "Time's up :-)" : "No" }</p>`;

    let pArr = [p1, p2, p3, p4, p5, p6];
    pArr.forEach(el => {
      let div = document.createElement('div');
      div.innerHTML = el;
      outputContainer.append(div);
    })
  }



