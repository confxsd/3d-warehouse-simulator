import Simulator from "./Simulator";
import DataController from './DataController';
const util = require("../util")


class Manager {
  constructor({ depotSelectionId, simulationSceneId, panelId, simulatorId, depotInfoId, remoteUrl }) {
    this.depotSelectionId = depotSelectionId;
    this.simulationSceneId = simulationSceneId;
    this.panelId = panelId;
    this.simulatorId = simulatorId;
    this.depotInfoId = depotInfoId;
    this.remoteUrl = remoteUrl;
    this.selectedDepotId = null;

    this.selectedFilters = {
      weight: [],
      product: [],
      location: false
    }

    this.getHistory = this.getHistory.bind(this);
    this.updateStock = this.updateStock.bind(this);
  }

  init() {
    this.dataController = new DataController({
      url: this.remoteUrl
    });

    this.initDepotSelection();
  }

  async initDepotSelection() {
    let depotIds;
    try {
      depotIds = await this.dataController.getDepots();
    } catch (error) {
      console.log(error);
      alert("Network request error.");
      return;
    }

    const depotSelectionList = document.querySelector(`#${this.depotSelectionId} ul`);

    depotIds.forEach(item => {
      let depot = document.createElement("li");
      depot.textContent = item.DepoId;
      depot.addEventListener('click', (e) => {
        this.goToSimulationScene(e.target.textContent);
      })
      depotSelectionList.appendChild(depot);
    });
  }

  async goToSimulationScene(selectedDepotId) {
    const depotSelectionScene = document.querySelector(`#${this.depotSelectionId}`);
    depotSelectionScene.style.display = "none";
    this.selectedDepotId = selectedDepotId;

    this.toggleLoading()
    await this.initSimulation();
    this.setDepotId(selectedDepotId);
    this.toggleLoading()
  }

  resetSelectedFilters() {
    this.selectedFilters = {
      weight: [],
      product: [],
      location: false
    };
    this.filterSwitchProductCategory(false);
    this.filterSwitchWeightCategory(false);
    this.updateFilterOptions("weight");
    this.updateFilterOptions("product");

    const inputs = document.querySelectorAll("#MainOps .filters_container input");
    Array.from(inputs).forEach((i) => i.checked = false);
  }

  setDepotId(id) {
    const idField = document.querySelector("#DepotInfo .depot_id");
    idField.textContent = id;
  }

  formatLayoutData(layoutData, type) {
    return util.toGridLayout(layoutData, type);
  }

  async initSimulation() {
    this.simulationScene = document.getElementById(this.simulationSceneId);
    this.simulationScene.style.display = "block";
    this.depotInfoContainer = document.getElementById(this.depotInfoId);

    const layout = await this.dataController.getLayout(this.selectedDepotId);
    const layoutData = this.formatLayoutData(layout.data, "get");
    this.setFillRate(layout.fillRate);

    this.simulator = new Simulator({
      data: layoutData,
      containerId: this.simulatorId,
      size: {
        x: 39, y: 38
      },
      getHistory: this.getHistory,
      updateStock: this.updateStock,
    });

    this.handlePanel();
    this.handleFilters();
    this.handleLayoutUpload();
    this.handleReplenishmentUpload();
    this.handleZoomBtn();
    this.handleCancelRoutingBtn();
    this.handleResetFiltersBtn();
    this.handleCloseRoutingOptionsBtn();

    this.simulator.init();
    this.isLoading = false;
  }

  toggleLoading() {
    const loadingBox = document.getElementById("Loading");
    loadingBox.classList.toggle("closed");
    this.isLoading = !this.isLoading;
  }

  handleResetFiltersBtn() {
    const btn = document.querySelector("#MainOps span.reset");

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      this.resetSelectedFilters();
    })
  }


  handlePanel() {
    const panel = document.getElementById(this.panelId);
    panel.addEventListener('click', async (e) => {
      if (e.target.id === 'Reload') {
        this.toggleLoading();
        await this.btnRefreshLayout();
        this.toggleLoading();
      }
      else if (e.target.id === 'BtnRouting') {
        await this.initRouting();
      }
      else if (e.target.id === 'BtnRoutingClear') {
        this.clearRouting();
      }
    });
  }

  handleLayoutUpload() {
    const form = document.querySelector('#UploadLayout form');
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fileInput = form.querySelector("input[type=file]");
      if (!fileInput.files || fileInput.files.length !== 1) {
        alert("Select a json file");
        return;
      }

      this.toggleLoading();

      const file = fileInput.files[0];
      try {
        const uploadedLayout = await this.dataController.uploadNewLayout(this.selectedDepotId, file);
        const formattedLayoutData = await this.formatLayoutData(uploadedLayout.info, "get");
        this.simulator.refreshLayout(formattedLayoutData);
        this.toggleLoading();
        alert("Layout updated");
      } catch (error) {
        console.log(error)
        alert("Something went wrong");
        this.toggleLoading();
      }


    })
  }

  handleReplenishmentUpload() {
    const form = document.querySelector('#UploadReplenisment form');
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fileInput = form.querySelector("input[type=file]");
      if (!fileInput.files || fileInput.files.length !== 1) {
        alert("Select an .xlsx file");
        return;
      }
      const file = fileInput.files[0];

      this.toggleLoading();

      try {
        const res = await this.dataController.uploadReplenishmentData(this.selectedDepotId, file);

        if (res && res.indexOf("success") === -1) {
          console.log(res);
          alert("Something went wrong");
        }

        await this.btnRefreshLayout();
      } catch (error) {
        console.log(error)
        alert("Something went wrong");
      }

      this.toggleLoading();
    })
  }


  filterSwitchWeightCategory(checked) {
    const container = document.querySelector(`#${this.panelId} .filters_container .weight_category_container`);
    if (checked) {
      container.style.display = "block";
    } else {
      this.selectedFilters.weight = [];
      container.style.display = "none";
    }
  }

  filterSwitchProductCategory(checked) {
    const container = document.querySelector(`#${this.panelId} .filters_container .product_category_container`);
    if (checked) {
      container.style.display = "block";
    } else {
      this.selectedFilters.product = [];
      container.style.display = "none";
    }
  }

  updateFilterOptions(type) {
    const weightOptions = document.querySelectorAll(`#${this.panelId} .filters_container .weight_category_container fieldset input`);
    const productOptions = document.querySelectorAll(`#${this.panelId} .filters_container .product_category_container fieldset input`);

    if (type === "weight") {
      if (this.selectedFilters.weight.length === 0) {
        for (let i = 0; i < productOptions.length; i++) {
          const op = productOptions[i]; op.disabled = false;
        }
      } else {
        let enabledProductOptions = new Set();
        this.selectedFilters.weight.forEach((id) => {
          this.allCategories.weight[id].forEach(enabledProductOptions.add, enabledProductOptions);
        });

        for (let i = 0; i < productOptions.length; i++) {
          const op = productOptions[i];

          if ([...enabledProductOptions].indexOf(op.value) === -1) {
            op.disabled = true;
            op.checked = false;
          } else {
            op.disabled = false;
          }
        }
      }

    }
    else if (type === "product") {
      if (this.selectedFilters.product.length === 0) {
        for (let i = 0; i < weightOptions.length; i++) {
          const op = weightOptions[i];
          op.disabled = false;
        }

      } else {
        let enabledWeightOptions = new Set();
        this.selectedFilters.product.forEach((name) => {
          console.log(name, this.allCategories.product[name])
          this.allCategories.product[name].map(p => String(p)).forEach(enabledWeightOptions.add, enabledWeightOptions);
        });


        for (let i = 0; i < weightOptions.length; i++) {
          const op = weightOptions[i];

          if ([...enabledWeightOptions].indexOf(op.value) === -1) {
            op.disabled = true;
            op.checked = false;
          } else {
            op.disabled = false;
          }
        }
      }
    }
  }

  filterConstructOptions() {
    const weightCategories = this.allCategories.weight;
    const productCategories = this.allCategories.product;

    const weightContainer = document.querySelector(`#${this.panelId} .filters_container .weight_category_container fieldset`);
    const productContainer = document.querySelector(`#${this.panelId} .filters_container .product_category_container fieldset`);

    let id = 0
    Object.keys(weightCategories).forEach((name) => {
      const inputElem = document.createElement("input");
      inputElem.type = "checkbox"
      inputElem.name = "weight_category_filter"
      inputElem.id = id
      inputElem.value = name

      const labelElem = document.createElement("label")
      labelElem.textContent = name
      labelElem.htmlFor = id

      inputElem.addEventListener("click", (e) => {
        if (e.target.checked) {
          this.selectedFilters.weight.push(e.target.value)
        } else {
          this.selectedFilters.weight = this.selectedFilters.weight.filter(item => item !== e.target.value);
        }
        this.updateFilterOptions("weight")
      })

      weightContainer.appendChild(inputElem)
      weightContainer.appendChild(labelElem)
      id += 1
    });



    id = 0
    Object.keys(productCategories).forEach((name) => {
      const inputElem = document.createElement("input");
      inputElem.type = "checkbox"
      inputElem.name = "product_category_filter"
      inputElem.id = id
      inputElem.value = name

      const labelElem = document.createElement("label")
      labelElem.textContent = name
      labelElem.htmlFor = id

      inputElem.addEventListener("click", (e) => {
        if (e.target.checked) {
          this.selectedFilters.product.push(e.target.value)
        } else {
          this.selectedFilters.product = this.selectedFilters.product.filter(item => item !== e.target.value);
        }
        this.updateFilterOptions("product") //TODO: discuss this later on
      })

      const br = document.createElement("br")

      productContainer.appendChild(inputElem)
      productContainer.appendChild(labelElem)
      productContainer.appendChild(br)
      id += 1
    });
  }

  async filterLayout() {
    const whichFilters = [];
    if (this.selectedFilters.weight.length > 0) whichFilters.push("1");
    if (this.selectedFilters.product.length > 0) whichFilters.push("2");
    if (this.selectedFilters.location) whichFilters.push("3");

    const filteredLayout = await this.dataController.filterLayout(this.selectedDepotId, whichFilters, this.selectedFilters.weight, this.selectedFilters.product);
    const formattedLayoutData = await this.formatLayoutData(filteredLayout.data, "filter");
    this.setFillRate(filteredLayout.fillRate);

    this.simulator.refreshLayout(formattedLayoutData);
  }

  async prepareCategories() {
    const categories = await this.dataController.getCategories(this.selectedDepotId);
    return {
      product: categories.Categories,
      weight: categories.Weigths
    }
  }

  async handleFilters() {
    this.allCategories = await this.prepareCategories();
    this.filterConstructOptions();

    const filters = document.querySelectorAll(`#${this.panelId} .filters_container input`);
    filters.forEach((filter) => {
      filter.addEventListener("click", (e) => {
        const item = e.target;

        if (item.id === "weight_category") {
          this.filterSwitchWeightCategory(item.checked);
        }
        else if (item.id === "product_category") {
          this.filterSwitchProductCategory(item.checked);
        } else if (item.id === "location_weight") {
          this.selectedFilters.location = item.checked;
        }
      })
    })

    const btnSubmit = document.querySelector(`#${this.panelId} .filters_container button`);
    btnSubmit.addEventListener("click", async (e) => {
      const { weight, product, location } = this.selectedFilters

      if (weight.length == 0 && product.length == 0 && !location) {
        alert("select some filters");
      } else {
        this.toggleLoading()
        try {
          await this.filterLayout()
          this.toggleLoading()
        } catch (error) {
          console.log(error);
          this.toggleLoading()
          alert("Server didn't response")
        }
      }
    })

  }

  async getRouting(startDate, endDate) {
    try {
      const res = await this.dataController.getRouting(this.selectedDepotId, startDate, endDate);
      return res;
    } catch (error) {
      throw error;
    }
  }

  async updateStock(type, loc, amount, productId) {
    let opType;
    if (type === "add") {
      opType = "Add"
    } else if (type === "remove") {
      opType = "Delete"
    }

    this.toggleLoading();

    const res = await this.dataController.updateStock(this.selectedDepotId, opType, loc, amount, productId);
    if (res) {
      await this.btnRefreshLayout();
    } else {
      alert("Something went wrong")
    }

    this.toggleLoading();
    return res;
  }

  async initRouting() {
    const startDate = document.querySelector(`#Routing input[name="start_date"]`)
    const endDate = document.querySelector(`#Routing input[name="end_date"]`)

    if (!util.checkDate(startDate.value) || !util.checkDate(endDate.value)) {
      alert("Wrong date format");
      return;
    }

    this.toggleLoading();

    try {
      const res = await this.getRouting(startDate.value, endDate.value);
      if (res.length === 0) {
        alert("No order found.")
        this.toggleLoading();
        return;
      }

      this.toggleLoading();

      const ordersMapped = res.map((r) => {
        return { [r.name]: r };
      })
      this.showRoutingOptions();
      this.fillRoutingOrderSelection(ordersMapped);
    } catch (error) {
      console.log(error);
      if (res) console.log(res);
      alert("Network request error.");
      this.toggleLoading();
    }
  }

  showRoutingOptions() {
    const routingOptions = document.querySelector("#Routing .options");
    routingOptions.style.display = "block";
  }

  hideRoutingOptions() {
    const routingOptions = document.querySelector("#Routing .options");
    const list = routingOptions.getElementsByClassName("list")[0];
    routingOptions.style.display = "none";
    list.innerHTML = "";
  }

  async drawRouting(order) {
    this.clearRouting();

    if (this.simulator.isRoutingWorking()) {
      return;
    }

    this.togglePanelActivity();
    this.toggleCancelRoutingBtn();
    this.hideRoutingOptions();

    this.updateRoutingInfo({ origLen: order.origLen.toFixed(1), optLen: order.optLen.toFixed(1), orderName: order.name });
    const speed = document.querySelector(`#Routing input[name="speed"]:checked`)
    await this.simulator.drawRouting(order, parseInt(speed.id));

    this.toggleCancelRoutingBtn();
    this.togglePanelActivity();
  }

  fillRoutingOrderSelection(orders) {
    const routingOptions = document.querySelector("#Routing .options");
    routingOptions.style.display = "block";

    const routingOrderList = document.querySelector("#Routing .list");
    routingOrderList.innerHTML = "";

    orders.forEach((o) => {
      const name = Object.keys(o)[0];
      const order = o[name];
      const p = document.createElement("p");
      p.innerHTML = "&#9654; " + name;
      p.addEventListener("click", (e) => {
        this.drawRouting(order);
      });

      routingOrderList.appendChild(p);
    })
  }

  handleZoomBtn() {
    const zoomBtn = document.querySelector("#ResetZoom");
    zoomBtn.addEventListener("click", (e) => {
      this.simulator.resetZoom();
    })
  }

  handleCancelRoutingBtn() {
    const cancelBtn = document.querySelector("#CancelRouting");
    cancelBtn.addEventListener("click", (e) => {
      this.simulator.cancelRouting();
    })
  }

  toggleCancelRoutingBtn() {
    const cancelBtn = document.querySelector("#CancelRouting");
    
    if (cancelBtn.style.display === "block") {
      cancelBtn.style.display = "none"
    } else {
      cancelBtn.style.display = "block"
    }
  }

  clearRouting() {
    this.simulator.clearRouting();
    this.hideRoutingOptions();
    this.hideRoutingInfo();
  }

  async btnRefreshLayout() {
    const layout = await this.dataController.getLayout(this.selectedDepotId);
    const layoutData = this.formatLayoutData(layout.data, "get");
    this.simulator.refreshLayout(layoutData);
    this.setFillRate(layout.fillRate);
  }


  handleCloseRoutingOptionsBtn() {
    const btn = document.querySelector("#Routing .options .title .close");
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      this.hideRoutingOptions();
    })
  }

  async updateRoutingInfo({ orderName, origLen, optLen }) {
    const diff = (origLen - optLen).toFixed(1);
    const diffPercentage = (diff / origLen * 100).toFixed(1);

    const routingInfo = document.querySelector('#Title .routing_info');
    routingInfo.style.display = "block";

    const orderNameField = routingInfo.getElementsByClassName("order_name")[0];
    const origLenField = routingInfo.getElementsByClassName("orig_len")[0];
    const optLenField = routingInfo.getElementsByClassName("opt_len")[0];
    const diffField = routingInfo.getElementsByClassName("diff")[0];
    const diffPercentageField = routingInfo.getElementsByClassName("diff_percentage")[0];

    orderNameField.textContent = orderName;
    origLenField.textContent = origLen;
    optLenField.textContent = optLen;
    diffField.textContent = diff;
    diffPercentageField.textContent = diffPercentage;
  }

  hideRoutingInfo() {
    const routingInfo = document.querySelector('#Title .routing_info');
    routingInfo.style.display = "none";
  }

  async setFillRate(fillRate) {
    const fillRateBox = this.depotInfoContainer.querySelector('.fill_rate span');
    fillRateBox.textContent = `${fillRate.toFixed(1)}%`;
    fillRateBox.style.width = `${fillRate.toFixed(1)}%`;
  }

  async setDepotInfo() {
    const depotInfo = await this.dataController.getDepotInfo();

    const depotIdBox = this.depotInfoContainer.querySelector('.id span');
    const depotNameBox = this.depotInfoContainer.querySelector('.name span');

    depotIdBox.textContent = `${depotInfo.id}`;
    depotNameBox.textContent = `${depotInfo.name}`;
  }

  async getHistory(loc, startDate, endDate) {
    this.toggleLoading();

    try {
      const history = await this.dataController.getLocHistory(this.selectedDepotId, loc, startDate, endDate);
      this.toggleLoading();
      return history;
    } catch (error) {
      console.log(error);
      this.toggleLoading();
      alert("Something went wrong")
    }
  }

  togglePanelActivity() {
    const hider = document.querySelector("#MainOps div:first-child");
    if (hider.style.display === "block") {
      hider.style.display = "none";
    } else {
      hider.style.display = "block";
    }
  }

}

export default Manager;