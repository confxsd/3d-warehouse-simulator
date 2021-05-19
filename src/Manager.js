import Simulator from "./Simulator";
import DataController from './DataController';
const util = require("./util")


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
    const depotIds = await this.dataController.getDepots();
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
    this.toggleLoading()
  }

  async prepareLayoutData() {
    const layout = await this.dataController.getLayout(this.selectedDepotId);
    this.fillRate = layout.fillRate;

    return this.formatLayoutData(layout.data, "get");
  }

  async formatLayoutData(layoutData, type) {
    return util.toGridLayout(layoutData, type);
  }

  async initSimulation() {
    this.simulationScene = document.getElementById(this.simulationSceneId);
    this.simulationScene.style.display = "block";
    this.depotInfoContainer = document.getElementById(this.depotInfoId);

    const layoutData = await this.prepareLayoutData();

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
    this.handleZoomBtn();


    this.prepareFirstValues(this.fillRate, "depotInfo");
    this.simulator.init();
    this.isLoading = false;
  }

  toggleLoading() {
    const loadingBox = document.getElementById("Loading");
    loadingBox.classList.toggle("closed");
    this.isLoading = !this.isLoading;
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
        await this.showRouting();
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
        await this.filterLayout()
        this.toggleLoading()
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
    if (res && res.Stok) {
      await this.btnRefreshLayout();
      alert("Succesfully updated the stock value");
    } else {
      alert("Something went wrong")
    }
    this.toggleLoading();
    return res;
  }

  async showRouting() {
    const startDate = document.querySelector(`#Routing input[name="start_date"]`)
    const endDate = document.querySelector(`#Routing input[name="end_date"]`)
    const btnGet = document.querySelector(`#Routing button`)

    btnGet.addEventListener("click", async (e) => {
      // const res = await this.getRouting(startDate.value, endDate.value);
      const res = await this.getRouting("2021-04-03", "2021-04-25");
      console.log(res);
      await this.simulator.drawRouting(res[7]);
    });
  }

  handleZoomBtn() {
    const zoomBtn = document.querySelector("#ResetZoom");
    zoomBtn.addEventListener("click", (e) => {
      this.simulator.resetZoom();
    })
  }

  clearRouting(route) {
    this.simulator.clearRouting(route);
  }

  async btnRefreshLayout() {
    const layoutData = await this.prepareLayoutData();
    this.simulator.refreshLayout(layoutData);
  }

  async prepareFirstValues(fillRate, depotInfo) {
    await this.setFillRate(fillRate);
    // await this.setDepotInfo(depotInfo);
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
    const history = await this.dataController.getLocHistory(this.selectedDepotId, loc, startDate, endDate);
    return history;
  }

}

export default Manager;