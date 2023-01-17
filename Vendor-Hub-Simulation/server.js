// add your server code here
const http = require("http");
const fs = require("fs");
const pug = require("pug");

let vendorsList = [];
let currentVendor;
let currentVendorName;
let totalOrders = 0;
let totalOrderAmount = 0;
let soldItems = {};

//Pug functions to render various pages
const renderHome = pug.compileFile("views/index.pug");
const renderStats = pug.compileFile("views/stats.pug");

// when server loads, it must first read and store all relevant information contained in the files
// within the vendors directory. server does not start until this initialization process has been completed
fs.readdir("./vendors", function (err, vendors) {
  if (err) {
    send500(response);
    return;
  } else {
    //reads vendors folder and gets each individual vendor json object, adds it to vendor list
    vendors.forEach((vendor) => {
      let vendorInfo = require("./vendors/" + vendor);
      // let JSONObject = JSON.stringify(vendorInfo);
      vendorsList.push(vendorInfo);
    });
  }

  //Create a server
  const server = http.createServer(function (request, response) {
    console.log(request.url);

    if (request.method === "GET") {
      //loads the home page. (index.pug) is loaded
      if (request.url === "/" || request.url === "/index.html") {
        let data = renderHome({});
        response.statusCode = 200;
        response.setHeader("Content-Type", "text/html");
        response.end(data);
      }
      //orderform.html load
      else if (request.url === "/order") {
        fs.readFile("orderform.html", function (err, data) {
          if (err) {
            send500(response);
            return;
          }
          response.statusCode = 200;
          response.setHeader("Content-Type", "text/html");
          response.write(data);
          response.end();
        });
      }
      // gets the selected vendor by name from request url to display its page
      else if (request.url.startsWith("/order/")) {
        let pid = request.url.slice(7);
        // adds back spaces to replace %20 fron url
        currentVendorName = pid.replaceAll("%20", " ");
        console.log(currentVendorName);

        // for each vendor in the vendor list, check if its name matches the name requested from the url
        Object.values(vendorsList).forEach((elem) => {
          //if element id matches id from request
          if (currentVendorName === elem.name) {
            //set current vendor to that of request url
            response.write(JSON.stringify(elem));
            currentVendor = elem;
          }
        });
        //initializes default vals for stats
        totalOrders = 0;
        totalOrderAmount = 0;
        soldItems = {};
        response.end();
      }
      // loads the stats page
      else if (request.url === "/stats") {
        //gets most popular item by sorting array of all products
        //let popularItem = getPopular();

        // for each key in each vendor
        Object.values(vendorsList).forEach((key) => {
          // set avg order amount for each vendor object
          key["avgTotalOrder"] = (
            key["totalOrderAmount"] / key["totalOrders"]
          ).toFixed(2);
        });
        // renders pug file to be able to use template engine for various statistics
        let data = renderStats({
          vendorsList: Object.values(vendorsList),
        });

        response.statusCode = 200;
        response.setHeader("Content-Type", "text/html");
        response.end(data);
      }
      //loads vendor names for select list
      else if (request.url === "/vendors") {
        //console.log(vendorsList);
        response.statusCode = 200;
        response.write(JSON.stringify(vendorsList));
        response.end();
      }
      //loads the client js file
      else if (request.url === "/client.js") {
        fs.readFile("client.js", function (err, data) {
          if (err) {
            send500(response);
            return;
          }
          response.statusCode = 200;
          response.setHeader("Content-Type", "application/javascript");
          response.write(data);
          response.end();
        });
      }
      //loads the stylesheet
      else if (request.url === "/styles.css") {
        fs.readFile("styles.css", function (err, data) {
          if (err) {
            send500(response);
            return;
          }
          response.statusCode = 200;
          response.setHeader("Content-Type", "text/css");
          response.write(data);
          response.end();
        });
      }
      //loads add.png file
      else if (request.url === "/add.png") {
        fs.readFile("add.png", function (err, data) {
          if (err) {
            send500(response);
            return;
          }
          response.statusCode = 200;
          response.setHeader("Content-Type", "image/png");
          response.end(data);
        });
      }
      //loads remove.png file
      else if (request.url === "/remove.png") {
        fs.readFile("remove.png", function (err, data) {
          if (err) {
            send500(response);
            return;
          }
          response.statusCode = 200;
          response.setHeader("Content-Type", "image/png");
          response.end(data);
        });
      }
    }
    //POST REQUESTS
    else if (request.method === "POST") {
      // responsible for saving purchased data to server
      if (request.url === "/submit") {
        let body = "";
        request.on("data", (chunk) => {
          body += chunk;
        });
        request.on("end", () => {
          // neworder is set to the order sent by client
          let newOrder = JSON.parse(body);
          console.log(JSON.parse(body));
          console.log(currentVendor);

          let vendorSupplies = currentVendor.supplies;

          // iterate through supplies list in current vendor
          Object.keys(vendorSupplies).forEach((categeory) => {
            // iterates through each individual categeory
            Object.keys(vendorSupplies[categeory]).forEach((key) => {
              // iterates through each item in current new order
              Object.keys(newOrder).forEach((orderQuantity) => {
                // if item in new order matches item in current vendor's current supply, stock is reduced by purchased amount
                if (orderQuantity === key) {
                  vendorSupplies[categeory][key].stock -=
                    newOrder[orderQuantity];
                  //if sold item has not been purchased yet, add it to sold items array
                  if (!vendorSupplies[categeory][key].name.indexOf(soldItems)) {
                    soldItems[vendorSupplies[categeory][key].name] =
                      newOrder[orderQuantity];
                  } // if item has been purchased previously, increment amount sold by current purchased ammount
                  else {
                    soldItems[vendorSupplies[categeory][key].name] +=
                      newOrder[orderQuantity];
                  }
                }
              });
            });
          });
        });
        //update order totals
        totalOrders++;
        //updates sold items list in each vendor
        currentVendor["soldItems"] = soldItems;

        //increments order count by 1 every time a transaction is submitted
        if ("totalOrders" in currentVendor) {
          currentVendor["totalOrders"] += totalOrders;
        } else {
          //if it is vendors first transaction, create and add order count
          currentVendor["totalOrders"] = totalOrders;
        }
        console.log("soldItems" + soldItems);
        response.statusCode = 200;
        response.end();
      }
      //order total
      else if (request.url === "/ordertotal") {
        let body = "";
        request.on("data", (chunk) => {
          body += chunk;
        });
        request.on("end", () => {
          //total of the transaction
          totalOrderAmount += Number(body);

          //selects the current vendor
          let vendor = [];
          Object.values(vendorsList).forEach((elem) => {
            if (currentVendorName === elem.name) {
              vendor = elem;
            }
          });
          //if there has been a purchase, add total current order amount to the totalorderamount in current vendor
          if ("totalOrderAmount".indexOf(vendor) !== -1) {
            vendor["totalOrderAmount"] += Number(totalOrderAmount.toFixed(2));
          } else {
            //if there hasn't been a ppurchase yet, add totalorderamount to current vendor object
            vendor["totalOrderAmount"] = Number(totalOrderAmount.toFixed(2));
          }
          console.log(totalOrderAmount);
        });
        response.statusCode = 200;
        response.end();
      }
      // new item
      else if (request.url === "/addnewitem") {
        let body = "";
        request.on("data", (chunk) => {
          body += chunk;
        });
        request.on("end", () => {
          let newItem = JSON.parse(body);
          let vendorSupplies = currentVendor.supplies;
          let index = 0;

          console.log(newItem);
          //iterate through current vendor's categories
          Object.keys(vendorSupplies).forEach((categeory) => {
            //counts every item in vendor's supplies, to set new items id to be one moe than total items before
            Object.keys(vendorSupplies[categeory]).forEach(() => {
              index++;
            });
          });
          //sets new items id, and adds to vendors supplies
          vendorSupplies[Object.keys(newItem)][index] =
            newItem[Object.keys(newItem)];
        });
        response.statusCode = 200;
        response.end();
      }
    }
  });
  //Server listens on port 3000
  server.listen(3000);
  console.log("Server running at http://127.0.0.1:3000/");
});

//Helper function to send a 404 error
function send404(response) {
  response.statusCode = 404;
  response.write("Unknown resource.");
  response.end();
}

//Helper function to send a 500 error
function send500(response) {
  response.statusCode = 500;
  response.write("Server error.");
  response.end();
}
