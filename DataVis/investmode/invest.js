//Indicator of initialization for the brushed function
let init = true;
//Default amount of investment for our computations
let investamount = 100; //dollars
//Function triggered by the button to change the value of investment
function changeinvestamount(){
  //Set new investment amount
  investamount = +d3.select("#investamount").property("value");
  //And update the graph by simulating a brushing
  brushed();
}

//Function returning a ratio between 2 given prices
function getRatio(oldPrice, newPrice){
  let percentage = 0
  //If 0, means the money didn't exist so we consider there is no augmentation
  if(oldPrice != 0.0) {
    percentage = (newPrice - oldPrice) / oldPrice;
  }
  return percentage;
}

//Function to get all the months between the 2 given dates
function getRangeMonths(date1, date2){
  let datesList = [];
  //Convert Dates to first day of their corresponding month
  let currentDate = new Date(date1.getFullYear(), date1.getMonth(), 1);
  let stopDate = new Date(date2.getFullYear(), date2.getMonth(), 1);
  while(currentDate <= stopDate){
    split_current = currentDate.toString().split(" ");
    date_string = split_current[1] + " 01 " + split_current[3];
    datesList.push(date_string);
    // Go to next month (to change if we want to pick each week, day...)
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1);
  }
  return datesList;
}

//Setting the svg environment with the margins
//All items with a 2 in suffix are used for the time axis
let svg = d3.select("svg"),
    margin = {top: 80, right: 20, bottom: 110, left: 50},
    margin2 = {top: 430, right: 20, bottom: 10, left: 50},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    height2 = +svg.attr("height") - margin2.top - margin2.bottom;

let parseDate = d3.timeParse("%b %d %Y");

let x = d3.scaleBand().range([0, width]).padding(0.1),
    x2 = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]);

let xAxis = d3.axisBottom(x);
let xAxis2 = d3.axisBottom(x2);
let yAxis = d3.axisLeft(y).tickSize(0)
              .tickPadding(6);

let brush = d3.brushX() //Area to select a time interval
    .extent([[0, 0], [width, 40]])
    .on("end", brushed);

let focus = svg.append("g") //Focus is the svg for the graph
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

let context = svg.append("g") //Context is the svg for the brush
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

//Read csv file only once and keep the day prices of all currencies in a JS object
let day_prices = {};
//List to keep name of currencies
let currencies = [];
let currenciesCount = 0;
//Dates to keep for mode 2
let firstDate = "Apr 28 2017";
let finalDate = "Nov 07 2017";
let dates = [];

//From our exploratory analysis, here is the data we use to indicate whether some cryptocurrency existed or not
let first_appearance = [];
first_appearance[2013] = ["BTC", "XRP", "LTC"];
first_appearance[2014] = ["DASH", "XMR"];
first_appearance[2015] = ["ETH", "XEM"];
first_appearance[2016] = ["NEO", "BCC", "ETC"];
first_appearance[2017] = ["BCH", "NMR", "MIOTA", "START", "WAVES"];

//Function that fill the day_prices object with the csv data
function fillPrices(data){
  data.forEach(function(d){
    day_prices[d.Date] = [d.BTC, d.ETH, d.NEO, d.XRP, d.BCH, d.DASH, d.BCC, d.ETC, d.MIOTA, d.LTC, d.XMR, d.XEM, d.NMR, d.STRAT, d.WAVES];
  });
}

//Function that fill the currencies list names given the corresponding row of the csv file
function fillCurrencies(row){
  for (let prop in row) {
    if (row.hasOwnProperty(prop)) {
      if (prop != 'Date') {
        currencies.push(prop);
      }
    }
  };
  currenciesCount = currencies.length;
}
//Reading our data file and filling the necessary arrays
d3.csv("../crypto_prices.csv", function(error, data) {
  if (error) throw error;
  fillPrices(data);
  fillCurrencies(data[0]);
  x.domain(currencies);
  //We can already draw our graph in the default settings
  updateGraph(firstDate, finalDate);
});

//Set time axis with dates of beginning and end of csv file
x2.domain([parseDate("May 01 2013"), parseDate("Nov 07 2017")]);

//Function used to clean the bars and axis of the graph before drawing with the new data
function cleanGraph(y_0, old_dates){
  d3.selectAll(".cryptoname").remove();
  //Set all histogram bars to 0 using their id
  for (let i = 0; i < old_dates.length -1; i++){
    focus.selectAll("#bar--"+i)
      .transition()//Nice transition to make the bars decrease to the origin
      .duration(500)
      .attr("height", 0)
      .attr("y", y_0)
      .remove();
  }
  //Change position of axis so that it matches the appearance of next axis and remove
  focus.selectAll("#xaxis")
        .transition()
        .duration(500)
        .remove();
}

//Function that updates the graph when brushing
async function updateGraph(beginDate, endDate){
    //Computing the new data to plot
    let amount_per_month = [];
    let best_crypto_month = [];
    //Keep copy of all dates that we will use to delete the previous bars
    let old_dates = dates
    //Compute all dates
    let bDate = parseDate(beginDate);
    let eDate = parseDate(endDate);
    dates = getRangeMonths(bDate, eDate);
    //Compute the best crypto for every month
    for(let i = 1; i < dates.length; i++) {
      //For given month get all amount by cryptocurrency
      let amount_per_crypto = []
      let begPrice = day_prices[dates[i - 1]];
      let endPrice = day_prices[dates[i]];
      for(let j = 0; j < currenciesCount; j++){
        let amount = investamount + getRatio(begPrice[j], endPrice[j]) * investamount;
        if(amount == investamount){
          //It means the currency didn't exist at the time -> getRatio yields 0, thus amount = inverstamount
          amount = 0.0;
        }
        amount_per_crypto.push(amount);
      }
      //Get max and the corresponding currency
      max_value = d3.max(amount_per_crypto);
      //Retrieve name of best crypto
      index_crypto = amount_per_crypto.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
      amount_per_month.push(max_value);
      best_crypto_month.push(currencies[index_crypto]);
    }

    //Compute the aggregate value of all investments and display
    d3.select("#aggrwin").text("You would have won a total amount of "+
          Math.round(amount_per_month.reduce((a, b)=>a + b, 0)) + '$');
    //Update the axis and clean the graph with former dates
    let maxAmount = d3.max(amount_per_month);

    cleanGraph(y(0), old_dates);
    await sleep(500);
    x.domain(dates);
    y.domain([0, maxAmount]);
    //Depending on number of months to display, do or do not show all ticks on x axis
    xAxis.tickValues(x.domain().filter(function(d,i){
      if(dates.length <= 24 && dates.length > 12){
        return !(i%2)
      } else if (dates.length > 24) {
        return !(i%4)
      } else {
        return true;
      }
    }));

    //Compute, place and draw every bar
     focus.selectAll(".bar")
          .data(amount_per_month)
          .enter().append("rect")
          .attr("id", function(d, i) { return "bar--"+i;})
          .attr("class", "bar");

    for (let i = 0; i < dates.length - 1; i++){
      //Make bar raise to the corresponding height
      focus.select("#bar--"+i)
           .attr("x", (x(dates[i]) + x(dates[i + 1])) / 2)
           .attr("width", x.bandwidth())
           .attr("y", y(0))
           .attr("height", 0)
           .transition()
           .duration(500)
           .attr("y", y(amount_per_month[i]))
           .attr("height", Math.abs(y(amount_per_month[i]) - y(0)));
      //Add text to positionned with each bar to tell which crypto currency and value
      focus.append("text")
           .attr("class", "cryptoname")
           .attr("id", "crypto--"+i)
           .attr("dy", ".35em")
           .attr("text-anchor", "middle")
           .attr("transform", function(){
             xText = (x(dates[i]) + x(dates[i+1]))/2 + x.bandwidth()/2;
             yText = y(amount_per_month[i]) - 10;
             if(dates.length > 12){
               return "translate("+(xText)+","+(yText -25)+"), rotate(-90)";
             } else {
               return "translate("+(xText)+","+yText+")";
             }
           })
           .transition()
           .delay(500)
           .text(best_crypto_month[i] + ": " + Math.round(amount_per_month[i])+'$');
    }

    focus.append("g")//Append x axis of graph
          .attr("id", "xaxis")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0,"+ y(0) + ")")
          .attr("visibility", "hidden")
          .call(xAxis)
          .transition()
          .attr("visibility", "visible");
}

context.append("g") //Axis for brush
    .attr("id", "taxis")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + (height2/3) + ")")
    .call(xAxis2);

context.append("g") //Selecting area on brush
    .attr("id", "brusharea")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, [x2(parseDate(firstDate)), x2(parseDate(finalDate))]);

context.append("text")//Add text to display the exact time interval
    .attr("id", "timeinterval")
    .attr("transform", "translate(0," + height2+ ")")
    .text("Time interval " + firstDate + " to " + finalDate);

context.append("text") //Add text to display the unavailable Cryptocurrencies at beginning of time interval
    .attr("id", "newcrypto")
    .attr("transform", "translate(230,"+ height2+")")
    .text("Here are the cryptocurrencies that appeared after your selected date.");

//Function that returns the cryptocurrencies created since the beginning of the year of given date
function unavailableCryptocurrencies(begin_year){
  //Possible years
  let years = ["2013", "2014", "2015", "2016", "2017"];
  let unvailable = [];
  //Start from year of given date and add all the created cryptocurrencies
  for(let i = years.indexOf(begin_year); i < years.length; i++){
    unvailable.push(first_appearance[years[i]]);
  }
  //Change text to display
  d3.select("#newcrypto").text("From the year " + begin_year+ ", the following currencies appeared "+ unvailable);
}

//Function that handles the brush event on the time axis
function brushed() {
  //Retrieve time interval
  let start = d3.select(".selection").attr("x");
  let end =  +start + +d3.select(".selection").attr("width");
  let time_interval = [start, end].map(x2.invert, x2);
  //Reorder the dates to match the data of our file
  let split_begin = time_interval[0].toString().split(" ");
  let split_end = time_interval[1].toString().split(" ");
  firstDate = split_begin[1] + " " + split_begin[2] + " " + split_begin[3];
  finalDate = split_end[1] + " " + split_end[2] + " " + split_end[3];
  //Change text of display with new time interval
  d3.select("#timeinterval").text("Time interval " + firstDate + " to "+ finalDate);
  //Avoid calling updateGraph on initialization of brush area
  if(init == false){
    //Draw the new bars
    updateGraph(firstDate, finalDate);
  }
  init = false;
  //Change text of display with new unavailable cryptocurrencies
  unavailableCryptocurrencies(split_begin[3]);
}

function type(d) { //Function that parses the data on read
  d.value = +d.value;
  return d;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
