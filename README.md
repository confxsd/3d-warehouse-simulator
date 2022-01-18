# Graduation Project 
## Stock Warehouse Simulation 3D

Three.js and pure vanilla js implementation of 3D warehouse stock management simulation

## Functionality list

### General
- Users can view stocks in 3D
- Doluluk oranını görebileceği bir bar
- Users can filter the view based on the popularity, weight, category of the products and out of stock products on the panel
- Users can view the total amount of the product through the height of the object
- Users can get the product information about stock items
- Users can view the slotting and collecting activities as a heatmap for a period of time and for specified locations.
- Users can view orders of the day after loading the stock.
- Günün stok yerleşimini kaydet butonuna tıklayıp yerleşimi kaydedebilir.

### Slotting
- Users can load the stock using the panel input
- Users can reload the stock anytime they want 

### Routing
- Users can initiate a routing on a stock view with existing items. In order to initiate the routing user can select the orders from a list shown in the panel.
- Users can view the routing for a particular order
- Users can also view the updated stock after collecting orders.

### Replenishment
- Users can view out of stock products (or products of which rate is below 10% ) 
- Users can initiate a replenishment request on the existing stock view
- Users can view the updated stock after replenishment.


## App features
- Communicates with another server to get information
- Can load from DB (with the help of another server) or file
- Can display in 3D
- Has a panel to make requests
- Has an info bar
- Can display stock items as boxes
- Can display stock items with their info
