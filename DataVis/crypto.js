let mode = 1;

function switchMode(button){
  let b = button.getAttribute("id");
  if(mode == 2){
    mode = 1;
    d3.selectAll("#modeSwitch").text("Go to Investment Mode");
    d3.select(".form").attr("visibility", "hidden");
  }else if(mode == 1){
    mode = 2;
    d3.selectAll("#modeSwitch").text("Go to Basic Mode");
    d3.select(".form").attr("visibility", "visible");
  }
  //console.log("Switched mode to "+mode);
  let start = d3.select(".selection").attr("x");
  let end =  +start + +d3.select(".selection").attr("width");
  let time_interval = [start, end].map(x2.invert, x2);
  let split_begin = time_interval[0].toString().split(" ");
  let split_end = time_interval[1].toString().split(" ");
  let begin_date = split_begin[1] + " " + split_begin[2] + " " + split_begin[3];
  let end_date = split_end[1] + " " + split_end[2] + " " + split_end[3];
  d3.select("#timeinterval").text("Time interval " + begin_date + " to "+ end_date);
  updateGraph(begin_date, end_date);
}

function clicked(button){
  let id = button.getAttribute("id");
  let index = selected_currencies.indexOf(id);
  if(index == -1){
    selected_currencies.push(id);
    button.style.color = "#5B281C";
    button.style.background =  "#AEB7B3";
  }else {
    selected_currencies.splice(index, 1);
    button.style.color = "#AEB7B3";
    button.style.background="#1C2826";
  }
  let start = d3.select(".selection").attr("x");
  let end =  +start + +d3.select(".selection").attr("width");
  let time_interval = [start, end].map(x2.invert, x2);
  let split_begin = time_interval[0].toString().split(" ");
  let split_end = time_interval[1].toString().split(" ");
  let begin_date = split_begin[1] + " " + split_begin[2] + " " + split_begin[3];
  let end_date = split_end[1] + " " + split_end[2] + " " + split_end[3];
  d3.select("#timeinterval").text("Time interval " + begin_date + " to "+ end_date);
  updateGraph(begin_date, end_date);
}

function highlight(button){
  let id = button.getAttribute("id");
  let bars = focus.selectAll(".bar")._groups[0];
  for (let i = 0; i < bars.length; i ++){
    let curr_id = bars[i].id
    if(curr_id != id){
      focus.selectAll("#"+curr_id).attr("class", "bar--notfocus");
    }
  }
}

function resetcolor(){
  focus.selectAll(".bar--notfocus").attr("class", function(d) { return "bar bar--" + (d < 0 ? "negative" : "positive"); });
}

function getPercentage(oldPrice, newPrice){
  let percentage = 0
  //If 0, means the money didn't exist so we consider there is no augmentation
  if(oldPrice != 0.0) {
    percentage = 100 * (newPrice - oldPrice) / oldPrice;
  }
  return percentage;
}

let initializing = true;

let svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 110, left: 40},
    margin2 = {top: 430, right: 20, bottom: 10, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    height2 = +svg.attr("height") - margin2.top - margin2.bottom;

let parseDate = d3.timeParse("%b %Y");

let x = d3.scaleBand().range([0, width]).padding(0.1),
    x2 = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]);

let xAxis = d3.axisBottom(x),
    xAxis2 = d3.axisBottom(x2),
    yAxis = d3.axisLeft(y).tickSize(0)
    .tickPadding(6).tickFormat(d => d + "%");

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
//List of selected currencies
let selected_currencies = ["BTC"];

let first_appearance = [];
first_appearance[2013] = ["BTC", "XRP", "LTC"];
first_appearance[2014] = ["DASH", "XMR"];
first_appearance[2015] = ["ETH", "XEM"];
first_appearance[2016] = ["NEO", "BCC", "ETC"];
first_appearance[2017] = ["BCH", "NMR", "MIOTA", "START", "WAVES"];
/*first_appearance["BTC"] = "Apr 28 2013";
first_appearance["ETH"] = "Aug 07 2015";
first_appearance["NEO"] = "Sep 09 2016";
first_appearance["XRP"] = "Aug 04 2013";
first_appearance["BCH"] = "Jul 23 2017";
first_appearance["DASH"] = "Feb 14 2014";
first_appearance["BCC"] = "Jan 20 2016";
first_appearance["ETC"] = "Jul 24 2016";
first_appearance["MIOTA"] = "Jun 13 2017";
first_appearance["LTC"] = "Apr 28 2013";
first_appearance["XMR"] = "May 21 2014";
first_appearance["XEM"] = "Apr 01 2015";
first_appearance["NMR"] = "Jun 23 2017";
first_appearance["STRAT"] = "Aug 12 2016";
first_appearance["WAVES"] = "Jun 02 2016";*/


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
}

d3.csv("crypto_prices.csv", function(error, data) {
  if (error) throw error;
  fillPrices(data);
  fillCurrencies(data[0]);
  x.domain(currencies);
  updateGraph("Apr 01 2017", "Nov 07 2017");
});

x2.domain([parseDate("Apr 2013"), parseDate("Nov 2017")]);

function cleanGraph(bars, y_0){
  bars.transition()
      .duration(500)
      .attr("y", y_0)
      .attr("height", 0);

  focus.selectAll("#xaxis")
        .transition()
        .duration(500)
        .attr("transform", "translate(0,"+ y_0 + ")")
        .remove();
  focus.selectAll("#yaxis").remove();
}


//Function that updates the graph when brushing
function updateGraph(beginDate, endDate){
  if(mode == 1){
    let percentages = [];
    let oldPrice = day_prices[beginDate];
    let newPrice = day_prices[endDate];
    let currenciesCount = currencies.length;
    for(let i = 0; i < currenciesCount; i++) {
      let percentage = 0;
      if(selected_currencies.indexOf(currencies[i]) > -1){
        percentage = getPercentage(oldPrice[i], newPrice[i]);
      }
      percentages.push(percentage);
    }

    let maxPercentage = d3.max(percentages);
    let minPercentage = d3.min(percentages);

    //x.domain(selected_currencies);
    y.domain([minPercentage, maxPercentage]);

    cleanGraph(focus.selectAll(".bar"), y(0));

    focus.selectAll(".bar") //Compute, place and draw every bar
        .data(percentages)
        .enter().append("rect")
        .attr("id", function(d, i) { return currencies[i]; })
        .attr("x", function(d, i) { return x(currencies[i]); })
        .attr("width", x.bandwidth());

    for (let i = 0; i < currencies.length; i++){
      focus.select("#"+ currencies[i])
          .attr("class", function(d) { return "bar bar--" + (d < 0 ? "negative" : "positive"); })
          .attr("y", y(0))
          .transition()
          .delay(500)
          .duration(500)
          .attr("y", function(d) { return y(Math.max(0, d)); })
          .attr("height", function(d) { return Math.abs(y(d) - y(0)); });
    }

    focus.append("g")//Append x axis of graph
            .attr("id", "xaxis")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0,"+ y(0) + ")") //height/2 + margin.top
            .attr("visibility", "hidden")
            .call(xAxis)
            .transition()
            .delay(500)
            .attr("visibility", "visible");

    focus.append("g") //Append y axis of graph
            .attr("id", "yaxis")
            .attr("class", "axis axis--y")
            .call(yAxis);
  } else if(mode ==2){

  }
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
    .call(brush.move, [x2(parseDate("Apr 2017")), x2(parseDate("Nov 2017"))]);

context.append("text")
    .attr("id", "timeinterval")
    .attr("transform", "translate(0," + height2+ ")")
    .text("Time interval Apr 01 2017 to Nov 07 2017");

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
  let s = d3.event.selection || x2.range();
  let time_interval = s.map(x2.invert, x2);
  //Display somewhere the exact time interval
  //Compute new values for each currency and display new bars
  let split_begin = time_interval[0].toString().split(" ");
  let split_end = time_interval[1].toString().split(" ");
  let begin_date = split_begin[1] + " " + split_begin[2] + " " + split_begin[3];
  let end_date = split_end[1] + " " + split_end[2] + " " + split_end[3];
  //console.log("time interval ", begin_date, end_date);
  d3.select("#timeinterval").text("Time interval " + begin_date + " to "+ end_date);
  if (initializing == false){
    updateGraph(begin_date, end_date);
  }
  unavailableCryptocurrencies(split_begin[3]);
  initializing = false;
}

function type(d) { //Function that parses the data on read
  //d.name = parseDate(d.name);
  d.value = +d.value;
  return d;
}
