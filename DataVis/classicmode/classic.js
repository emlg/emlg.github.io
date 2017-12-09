//Function to select or unselect a cryptocurrency from showing in the graph
function clicked(button){
  //Get the abbreviation of the concerned cryptocurrency
  let id = button.getAttribute("id");
  //If it is not in the selected_currencies yet, the index will be -1 : we need to add it
  //If it is in the selected_currencies, the index will be >= 0 and we need to remove it
  let index = selected_currencies.indexOf(id);
  if(index == -1){
    //Add the currency to the list of interest
    selected_currencies.push(id);
    //Change style of button so that the user knows that this currency is selected
    button.style.color = "#5B281C";
    button.style.background =  "#AEB7B3";
  } else {
    //Retrieve the currency from the list to stop rendering it
    selected_currencies.splice(index, 1);
    //Change style of button back to unselected state
    button.style.color = "#AEB7B3";
    button.style.background="#1C2826";
  }
  //Simulate a brushing to update the graph
  brushed();
}
//Function triggered when the mouse is over a button
function highlight(button){
  //Retrieve id of concerned cryptocurrency
  let id = button.getAttribute("id");
  //Retrieve the bars of the graph
  let bars = focus.selectAll(".bar")._groups[0];
  //For all the bars except the one considered by the button, change class & style to unfocus.
  for (let i = 0; i < bars.length; i ++){
    //Retrieve id of current bar
    let curr_id = bars[i].id
    if(curr_id != id){
      focus.selectAll("#"+curr_id).attr("class", "bar--notfocus");
    }
  }
}
//Function called when mouse leaves a button
function resetcolor(){
  //We reset all the unfocused bars to their usual class : either positive or negative depending on value
  focus.selectAll(".bar--notfocus").attr("class", function(d) { return "bar bar--" + (d < 0 ? "negative" : "positive"); });
}
//Function returning a percentage between 2 given prices
function getPercentage(oldPrice, newPrice){
  let percentage = 0
  //If 0, means the money didn't exist so we consider there is no augmentation
  if(oldPrice != 0.0) {
    percentage = 100 * (newPrice - oldPrice) / oldPrice;
  }
  return percentage;
}

//Setting the svg environment with the margins
//All items with a 2 in suffix are used for the time axis
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
    yAxis = d3.axisLeft(y).tickSize(0).tickPadding(6).tickFormat(d => d + "%");

let brush = d3.brushX() //Area to select a time interval
    .extent([[0, 0], [width, 40]])
    .on("end", brushed);

let focus = svg.append("g") //Focus is the svg for the graph
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

let context = svg.append("g") //Context is the svg for the time axis
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

//Read csv file only once and keep the day prices of all currencies in a JS object
let day_prices = {};
//List to keep name of currencies
let currencies = [];
let currenciesCount = 0;
//List of selected currencies
let selected_currencies = ["BTC"];
let firstDate = "Apr 28 2017";
let finalDate = "Nov 07 2017";

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
x2.domain([parseDate("Apr 28 2013"), parseDate("Nov 07 2017")]);

//Function used to clean the bars and axis of the graph before drawing with the new data
function cleanGraph(y_0, dates){
  //Set all histogram bars to 0 using their id
    for (let i = 0; i < currencies.length; i++){
      focus.selectAll("#"+ currencies[i])
           .transition() //Nice transition to make the bars decrease to the origin
           .duration(500)
           .attr("y", y_0)
           .attr("height", 0)
           .remove();
    }
  //Change position of axis so that it matches the appearance of next axis and remove
  focus.selectAll("#xaxis")
        .transition()
        .duration(500)
        .attr("transform", "translate(0,"+ y_0 + ")")
        .remove();
  //Remove old y axis
  focus.selectAll("#yaxis").remove();
}

//Function that updates the graph when brushing
function updateGraph(beginDate, endDate){
    //Computing the new data to plot
    let percentages = [];
    //Getting the prices at given interval dates
    let oldPrice = day_prices[beginDate];
    let newPrice = day_prices[endDate];
    //Computing the percentages
    for(let i = 0; i < currenciesCount; i++) {
      //By default the percentage is 0
      let percentage = 0.0;
      //If the current currency belongs to the selected ones then compute real percentage
      if(selected_currencies.indexOf(currencies[i]) > -1){
        percentage = getPercentage(oldPrice[i], newPrice[i]);
      }
      //Push to array (we have one value per cryptocurrency, but not more nonzero values than the number of selected cryptocurrencies)
      percentages.push(percentage);
    }
    //Define the new range of percentages for the y axis
    let maxPercentage = d3.max(percentages);
    let minPercentage = d3.min(percentages);
    x.domain(currencies);
    y.domain([minPercentage, maxPercentage]);
    //Now that we know where the x axis will be to match the y axis, clean the graph
    cleanGraph(y(0), []);

    focus.selectAll(".bar") //Compute, place and draw every bar
         .data(percentages)
         .enter().append("rect")
         .attr("id", function(d, i) {return currencies[i]; })
         .attr("x", function(d, i) {return x(currencies[i]); })
         .attr("width", x.bandwidth());

    for (let i = 0; i < currencies.length; i++){
       focus.select("#"+ currencies[i])
            .transition() //Nice transition to make the bar grow from the x axis
            .delay(500)
            .duration(500)
            .attr("y", function(d) { return y(Math.max(0, percentages[i])); })
            .attr("height", function(d) {return Math.abs(y(percentages[i]) - y(0)); })
            .attr("class", function(d) { return "bar bar--" + (percentages[i] < 0 ? "negative" : "positive"); });
    }

    focus.append("g")//Append x axis of graph
            .attr("id", "xaxis")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0,"+ y(0) + ")")
            .attr("visibility", "hidden")
            .call(xAxis)
            .transition()//Make the axis appear once the former one reached the position and was removed
            .delay(500)
            .attr("visibility", "visible");

    focus.append("g") //Append y axis of graph
            .attr("id", "yaxis")
            .attr("class", "axis axis--y")
            .call(yAxis);
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

context.append("text") //Add text to display the exact time interval
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
  //Draw the new bars
  updateGraph(firstDate, finalDate);
  //Change text of display with new unavailable cryptocurrencies
  unavailableCryptocurrencies(split_begin[3]);
}

function type(d) { //Function that parses the data on read
  d.value = +d.value;
  return d;
}
