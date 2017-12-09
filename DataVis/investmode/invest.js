let investamount = 100; //dollars

function changeinvestamount(){
  investamount = +d3.select("#investamount").property("value");
  brushed();
}

function getPercentage(oldPrice, newPrice){
  let percentage = 0
  //If 0, means the money didn't exist so we consider there is no augmentation
  if(oldPrice != 0.0) {
    percentage = 100 * (newPrice - oldPrice) / oldPrice;
  }
  return percentage;
}

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

let initializing = true;

let svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 110, left: 50},
    margin2 = {top: 430, right: 20, bottom: 10, left: 50},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    height2 = +svg.attr("height") - margin2.top - margin2.bottom;

let parseDate = d3.timeParse("%b %d %Y");

let x = d3.scaleBand().range([0, width]).padding(0.1),
    x2 = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]);

let xAxis = d3.axisBottom(x),
    xAxis2 = d3.axisBottom(x2),
    yAxis = d3.axisLeft(y).tickSize(0)
    .tickPadding(6);

let brush = d3.brushX()
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

d3.csv("../crypto_prices.csv", function(error, data) {
  if (error) throw error;
  fillPrices(data);
  fillCurrencies(data[0]);
  x.domain(currencies);
  updateGraph(firstDate, finalDate);
});

//Dates of beginning and end of csv file
x2.domain([parseDate("Apr 28 2013"), parseDate("Nov 07 2017")]);

function cleanGraph(y_0, old_dates){
  //Set all histogram bars to 0
  for (let i = 0; i < old_dates.length -1 ; i++){
    d3.select("#crypto--"+i).remove();
    focus.selectAll("#bar--"+i)
           .transition()
           .duration(500)
           .attr("y", y_0)
           .attr("height", 0).remove();
  }

  //Change position of axis
  focus.selectAll("#xaxis")
        .transition()
        .duration(500)
        .attr("transform", "translate(0,"+ y_0 + ")")
        .remove();
  //focus.selectAll("#yaxis").remove();
  console.log("Cleaned graph : " + (focus.selectAll("rect")).size());
}

//Function that updates the graph when brushing
function updateGraph(beginDate, endDate){
  console.log("update graph for investamount : "+investamount);
    let amount_per_month = [];
    let best_crypto_month = [];
    let old_dates = dates
    //Compute all dates
    let bDate = parseDate(beginDate);
    let eDate = parseDate(endDate);
    dates = getRangeMonths(bDate, eDate);

    for(let i = 1; i < dates.length; i++) {
      let amount_per_crypto = []
      let begPrice = day_prices[dates[i - 1]];
      let endPrice = day_prices[dates[i]];

      for(let j = 0; j < currenciesCount; j++){
        let amount = investamount + getPercentage(begPrice[j], endPrice[j]) * investamount;
        amount_per_crypto.push(amount);
      }
      //Get max and the corresponding currency
      max_value = d3.max(amount_per_crypto);
      index_crypto = amount_per_crypto.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
      amount_per_month.push(max_value);
      best_crypto_month.push(currencies[index_crypto]);
    }

    console.log(amount_per_month);
    d3.select("#aggrwin").text("You would have won a total amount of "+
          Math.round(amount_per_month.reduce((a, b)=>a + b, 0)) + '$');
    let maxAmount = d3.max(amount_per_month);

    x.domain(dates);
    y.domain([0, maxAmount]);
    cleanGraph(y(0), old_dates);

    //Compute, place and draw every bar
     focus.selectAll(".bar")
          .data(amount_per_month)
          .enter().append("rect")
          .attr("id", function(d, i) { return "bar--"+i;})
          .attr("class", "bar");

    for (let i = 0; i < dates.length - 1; i++){
      focus.select("#bar--"+i)
           .attr("x", (x(dates[i]) + x(dates[i + 1])) / 2)
           .attr("y", y(0))
           .attr("height", 0)
           .attr("width", x.bandwidth())
           .transition()
           .delay(500)
           .duration(500)
           .attr("y", y(amount_per_month[i]))
           .attr("height", Math.abs(y(amount_per_month[i]) - y(0)));

      focus.append("text")
           .attr("class", "cryptoname")
           .attr("id", "crypto--"+i)
           .attr("x", (x(dates[i]) + x(dates[i + 1]))/2+ 5)
           .attr("y",y(amount_per_month[i])- 10)
           .transition()
           .delay(1000)
           .text(best_crypto_month[i] + ": " + Math.round(amount_per_month[i])+'$');
    }

    focus.append("g")//Append x axis of graph
            .attr("id", "xaxis")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0,"+ y(0) + ")")
            .attr("visibility", "hidden")
            .call(xAxis)
            .transition()
            .delay(500)
            .attr("visibility", "visible");

    /*yAxis = yAxis.tickFormat(d => d + "$");
    focus.append("g") //Append y axis of graph
            .attr("id", "yaxis")
            .attr("class", "axis axis--y")
            .call(yAxis);*/
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

context.append("text")
    .attr("id", "timeinterval")
    .attr("transform", "translate(0," + height2+ ")")
    .text("Time interval " + firstDate + " to " + finalDate);

context.append("text")
    .attr("id", "newcrypto")
    .attr("transform", "translate(230,"+ height2+")")
    .text("Here are the cryptocurrencies that appeared after your selected date.");

function unavailableCryptocurrencies(begin_year){
  let years = ["2013", "2014", "2015", "2016", "2017"];
  let unvailable = [];
  for(let i = years.indexOf(begin_year); i < years.length; i++){
    unvailable.push(first_appearance[years[i]]);
  }
  //console.log("From the year " + begin_year+ ", the following currencies appeared "+ unvailable);
  d3.select("#newcrypto").text("From the year " + begin_year+ ", the following currencies appeared "+ unvailable);
}


function brushed() {
  /*let s = d3.event.selection || x2.range();
  let time_interval = s.map(x2.invert, x2);*/
  let start = d3.select(".selection").attr("x");
  let end =  +start + +d3.select(".selection").attr("width");
  let time_interval = [start, end].map(x2.invert, x2);
  //Display somewhere the exact time interval
  //Compute new values for each currency and display new bars
  let split_begin = time_interval[0].toString().split(" ");
  let split_end = time_interval[1].toString().split(" ");
  firstDate = split_begin[1] + " " + split_begin[2] + " " + split_begin[3];
  finalDate = split_end[1] + " " + split_end[2] + " " + split_end[3];
  d3.select("#timeinterval").text("Time interval " + firstDate + " to "+ finalDate);
  //First time brushed() is called, d3 hasn't read the csv yet so we don't call updateGraph
  if (initializing == false){
    console.log("Brushed");
    updateGraph(firstDate, finalDate);
  }
  unavailableCryptocurrencies(split_begin[3]);
  initializing = false;
}

function type(d) { //Function that parses the data on read
  //d.name = parseDate(d.name);
  d.value = +d.value;
  return d;
}
