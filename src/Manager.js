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

  goToSimulationScene(selectedDepotId) {
    const depotSelectionScene = document.querySelector(`#${this.depotSelectionId}`);
    depotSelectionScene.style.display = "none";
    this.selectedDepotId = selectedDepotId;
    this.initSimulation();
  }

  async prepareLayoutData() {
    const layout = await this.dataController.getLayout(this.selectedDepotId);
    this.fillRate = layout.DepoDoluluk;
    return util.toGridLayout(layout.info);
  }

  async initSimulation() {
    this.simulationScene = document.getElementById(this.simulationSceneId);
    this.simulationScene.style.display = "block";
    this.depotInfoContainer = document.getElementById(this.depotInfoId);

    const layoutData = await this.prepareLayoutData();

    this.simulator = new Simulator({
      data: layoutData,
      containerId: this.simulatorId,
      div: 39,
      getHistory: this.getHistory,
      updateStock: this.updateStock
    });

    this.handlePanel();
    this.handleFilters();
    this.handleLayoutUpload();


    this.prepareFirstValues(this.fillRate, "depotInfo");
    this.simulator.init();

  }


  handlePanel() {
    const panel = document.getElementById(this.panelId);
    panel.addEventListener('click', (e) => {
      console.log(e.target.id);
      if (e.target.id === 'Refresh') {
        this.btnRefreshLayout();
      }
    });
  }

  handleLayoutUpload() {
    const form = document.querySelector('#UploadLayout form');
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      // const uploadedLayout = await this.dataController.uploadNewLayout(this.selectedDepotId, form);
      // console.log(uploadedLayout);
      alert("Layout updated");
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
          console.log(this.allCategories.weight[String(id + 1)])
          this.allCategories.weight[String(id + 1)].forEach(enabledProductOptions.add, enabledProductOptions);
        });

        for (let i = 0; i < productOptions.length; i++) {
          const op = productOptions[i]; 
          op.disabled = true;
        }

        enabledProductOptions.forEach((name) => {
          const op = document.querySelector(`#${this.panelId} .filters_container .product_category_container fieldset input[value=${name}]`);
          op.disabled = false;
        })

        console.log(enabledProductOptions)
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
          this.allCategories.product[name].forEach(enabledWeightOptions.add, enabledWeightOptions);
        });

        for (let i = 0; i < weightOptions.length; i++) {
          const op = weightOptions[i]; 
          op.disabled = true;
        }

        enabledWeightOptions.forEach((id) => {
          const op = document.querySelectorAll(`#${this.panelId} .filters_container .weight_category_container fieldset input`)[id - 1];
          op.disabled = false;
        })

        console.log(enabledWeightOptions)
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
          this.selectedFilters.weight.push(parseInt(e.target.id))
        } else {
          this.selectedFilters.weight = this.selectedFilters.weight.filter(item => item !== parseInt(e.target.id));
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
        this.updateFilterOptions("product")
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
    if (this.selectedFilters.weight.length > 0) whichFilters.push(1);
    if (this.selectedFilters.product.length > 0) whichFilters.push(2);
    if (this.selectedFilters.location) whichFilters.push(3);

    const filterRequest = {
      Depot_Id: this.selectedDepotId,
      Filters: whichFilters,
      Product_Weight: this.selectedFilters.weight,
      Product_Category: this.selectedFilters.product
    }
    alert("filtered");
    console.log(filterRequest);
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
    btnSubmit.addEventListener("click", (e) => {
      const { weight, product, location } = this.selectedFilters

      if (weight.length == 0 && product.length == 0 && !location) {
        alert("select some filters");
      } else {
        console.log(this.selectedFilters);
        this.filterLayout()
      }
    })

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

  async updateStock(opType, loc, amount, productId) {
    const res = await this.dataController.updateStock(this.selectedDepotId, opType, loc, amount, productId);
    return res;
  }

}

export default Manager;