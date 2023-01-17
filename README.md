----------------------------------------
Author:
----------------------------------------
Liam Kelleher

----------------------------------------
Purpose: 
----------------------------------------
- To develop a server capable of serving order form resources that allows a user to browse office supplies for several vendors, 
add items from a vendor to an order, and simulate placing an order. 
- Server is responsible for tracking some sales data for each vendor and providing that sales data in HTML format when requested.
- Supports purchasing simulation for products, ability to change vendor to access different products.
- Uses server-side programming with AJAX.


----------------------------------------
Before Running program, do the following:
----------------------------------------
NPM installs: 
1. (In the terminal) npm install pug

Execution: 
1. (in the terminal) node server.js 
2. (Go to this link in your web browser to view the server application) http://127.0.0.1:3000/


----------------------------------------
New functions and their purposes:
----------------------------------------
Client.js:

newItemHTML() -> is responsible for displaying the html for adding new items to vendors. It takes into account the current vendor's supplies and puts the categories in a 'select' list. The rest of the input fields and labels are created by adding each html element to a result variable, which is returned when this function is called

AddNewItem() -> is responsible for taking the input from the user and combining each element into one 'item' object. A POST request is sent to the server which contains the stringified value of the newItem Object.


server.js:

When the server loads, it first reads, from the vendors directory, each vendor.JSON object and stores all relevant information in the files to the server.

----------------------------------------
GET REQUESTS:
----------------------------------------
Once the server is ready stop start, a GET request to /index.html is sent. This will load the homepage of the site which renders the index.pug file and displays a simple welcome page

GET request to /order will read the orderform.html file and load its content to the server

GET request to the url that starts with /order/ will initially load the first index of the select vendors list,  and every time changed it will fetch the corresponding vendor and display it's contents. Ex: its supplies, items etc..
This also sets currentVendor to that selected and initializes default values for the statistics 

GET request to /stats will load the statistics page by reading the stats.pug file. Information used by the template engine inside the file is sent in through keys and values added to each vendor object. Ex, avg order amount, total orders, most popular item, and total order amount.

GET requests to /vendors, /client.js/ /styles.css, /add.png, and /remove.png simply reads each file from the folder and each file is loaded to the server.

----------------------------------------
POST REQUESTS:
----------------------------------------
/submit request is responsible for saving the purchased data to server. It parses the stringified order from the client and performed various operations to update stock, and vendor statistics

/ordertotal retrieves the total of the transaction and updates/adds this information to the vendor object

/addnewitem retrieves the values inputted from the user, parses it and adds it to the current vendor supplies list as a new item.

		<img width="1173" alt="Screenshot 2023-01-17 at 11 40 16 AM" src="https://user-images.githubusercontent.com/91279431/212962458-00866607-84d7-4013-9311-38d56dd704db.png">

		
		
