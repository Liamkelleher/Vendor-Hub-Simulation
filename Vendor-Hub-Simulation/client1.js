/* The three variables (vendor01, vendor02, vendor03), containing the office supplies data are left in this file so that the base code works.
You should remove these for your A2 implementation, as all data should come from the server */

//This should also be removed. The vendor names should also come from the server.
// let vendors = {
//   Staples: vendor01,
//   Indigo: vendor02,
//   "Grand and Toy": vendor03,
// };
let vendors = [];
//The drop-down menu
let select = document.getElementById("vendor-select");
//Stores the currently selected vendor index to allow it to be set back when switching vendors is cancelled by user
let currentSelectIndex = select.selectedIndex;

//Stores the current vendor to easily retrieve data. The assumption is that this object is following the same format as the data included above. If you retrieve the vendor data from the server and assign it to this variable, the client order form code should work automatically.
let currentVendor;
//Stored the order data. Will have a key with each item ID that is in the order, with the associated value being the number of that item in the order.
let order = {};
//total value of order
let total = 0;

//Called on page load. Initialize the drop-down list, add event handlers, and default to the first vendor.
function init() {
  //   currentSelectIndex = 0;
  console.log(currentSelectIndex);

  //   document.getElementById("vendor-select").innerHTML =
  genSelList();
  document.getElementById("vendor-select").onchange = selectVendor;
  selectVendor();
}

//Generate new HTML for a drop-down list containing all vendors.
//For A2, you will likely have to make an XMLHttpRequest from here to retrieve the array of vendor names.
function genSelList() {
  let result = '<select name="vendor-select" id="vendor-select">';

  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      vendors = JSON.parse(this.responseText);
      console.log(vendors);

      Object.keys(vendors).forEach((elem) => {
        let vendorName = vendors[elem].name;
        console.log(vendorName);

        result += `<option value="${vendorName}">${vendorName}</option>`;
      });
      result += "</select>";
      document.getElementById("vendor-select").innerHTML = result;
    }
  };
  xhttp.open("GET", "/vendors", true);
  xhttp.send();
  //return result;
}

//Helper function. Returns true if object is empty, false otherwise.
function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
}

//Called when drop-down list item is changed.
//For A2, you will likely have to make an XMLHttpRequest here to retrieve the supplies list data for the selected vendor
function selectVendor() {
  let result = true;

  //If order is not empty, confirm the user wants to switch vendors
  if (!isEmpty(order)) {
    result = confirm(
      "Are you sure you want to clear your order and switch vendor?"
    );
  }

  //If switch is confirmed, load the new vendor data
  if (result) {
    //Get the selected index and set the current vendor
    // let selected = select.options[select.selectedIndex].value;
    currentSelectIndex = select.selectedIndex;
    if (currentSelectIndex == -1 && select.selectedIndex == -1) {
      currentSelectIndex = 0;
      select.value = select.value[currentSelectIndex];
    }
    // currentVendor = vendors[selected];
    console.log(select.value);

    //In A2, current vendor will be data you received from the server
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        currentVendor = JSON.parse(this.responseText);
        console.log(currentVendor);

        //Update the page contents to contain the new supply list
        document.getElementById("left").innerHTML =
          getCategoryHTML(currentVendor);
        document.getElementById("middle").innerHTML =
          getSuppliesHTML(currentVendor);

        //Clear the current oder and update the order summary
        order = {};
        updateOrder();

        //Update the vendor info on the page
        let info = document.getElementById("info");
        info.innerHTML =
          "<h1>" +
          currentVendor.name +
          "</h1>" +
          "<br>Minimum Order: $" +
          currentVendor.min_order +
          "<br>Delivery Fee: $" +
          currentVendor.delivery_fee +
          "<br><br>";
      }
    };
    console.log(select.value);

    // xhttp.open("GET", "/order/" + currentSelectIndex, true);
    xhttp.open("GET", "/order/" + select.value, true);
    xhttp.send();
  } else {
    //If user refused the change of vendor, reset the selected index to what it was before they changed it
    let select = document.getElementById("vendor-select");
    select.selectedIndex = currentSelectIndex;
  }
}

//Given a vendor object, produces HTML for the left column
function getCategoryHTML(vend) {
  let supplies = vend.supplies;
  let result = "<h3>Categories</h3><br>";
  Object.keys(supplies).forEach((key) => {
    result += `<a href="#${key}">${key}</a><br>`;
  });
  return result;
}

//Given a vendor object, produces the supplies HTML for the middle column
function getSuppliesHTML(vend) {
  let supplies = vend.supplies;
  let result = "";
  //For each category in the supply list
  Object.keys(supplies).forEach((key) => {
    result += `<b>${key}</b><a name="${key}"></a><br>`;
    //For each item in the category
    Object.keys(supplies[key]).forEach((id) => {
      item = supplies[key][id];
      result += `${item.name} (\$${item.price}, stock=${item.stock}) <img src='add.png' style='height:20px;vertical-align:bottom;' onclick='addItem(${item.stock}, ${id})'/> <br>`;
      result += item.description + "<br><br>";
    });
  });
  return result;
}

//Responsible for adding one of the items with given id to the order, updating the summary, and alerting if "Out of stock"
function addItem(stock, id) {
  if (order.hasOwnProperty(id) && stock == order[id]) {
    alert("Out if stock!");
    return;
  } else if (order.hasOwnProperty(id)) {
    order[id] += 1;
  } else {
    order[id] = 1;
  }
  updateOrder();
}

//Responsible for removing one of the items with given id from the order and updating the summary
function removeItem(id) {
  if (order.hasOwnProperty(id)) {
    order[id] -= 1;
    if (order[id] <= 0) {
      delete order[id];
    }
  }
  updateOrder();
}

//Reproduces new HTML containing the order summary and updates the page
//This is called whenever an item is added/removed in the order
function updateOrder() {
  let result = "";
  let subtotal = 0;

  //For each item ID currently in the order
  Object.keys(order).forEach((id) => {
    //Retrieve the item from the supplies data using helper function
    //Then update the subtotal and result HTML
    let item = getItemById(id);
    subtotal += item.price * order[id];
    result += `${item.name} x ${order[id]} (${(item.price * order[id]).toFixed(
      2
    )}) <img src='remove.png' style='height:15px;vertical-align:bottom;' onclick='removeItem(${id})'/><br>`;
  });

  //Add the summary fields to the result HTML, rounding to two decimal places
  result += `<br>Subtotal: \$${subtotal.toFixed(2)}<br>`;
  result += `Tax: \$${(subtotal * 0.1).toFixed(2)}<br>`;
  result += `Delivery Fee: \$${currentVendor.delivery_fee.toFixed(2)}<br>`;
  total = subtotal + subtotal * 0.1 + currentVendor.delivery_fee;
  result += `Total: \$${total.toFixed(2)}<br>`;

  //Decide whether to show the Submit Order button or the "Order X more" label
  if (subtotal >= currentVendor.min_order) {
    result += `<button type="button" id="submit" onclick="submitOrder()">Submit Order</button>`;
  } else {
    result += `Add \$${(currentVendor.min_order - subtotal).toFixed(
      2
    )} more to your order.`;
  }

  document.getElementById("right").innerHTML = result;
}

//Simulated submitting the order
//For A2, you will likely make an XMLHttpRequest here
function submitOrder() {
  let xhttp = new XMLHttpRequest();
  let xhttp2 = new XMLHttpRequest();

  xhttp.onreadystatechange = function () {
    //should not update its list until it receives a response from the server indicating that the request was successful.
    if (this.readyState == 4 && this.status == 200) {
      alert("Order placed!");
      order = {};
      selectVendor();
    }
  };

  console.log(total);
  xhttp.open("POST", "/submit", true);
  xhttp2.open("POST", "/ordertotal", true);
  xhttp.send(JSON.stringify(order));
  xhttp2.send(JSON.stringify(total));
}

//Helper function. Given an ID of an item in the current vendors' supply list, returns that item object if it exists.
function getItemById(id) {
  let categories = Object.keys(currentVendor.supplies);
  for (let i = 0; i < categories.length; i++) {
    if (currentVendor.supplies[categories[i]].hasOwnProperty(id)) {
      return currentVendor.supplies[categories[i]][id];
    }
  }
  return null;
}
