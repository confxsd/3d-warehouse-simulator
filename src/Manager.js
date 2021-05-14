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
    this.fillRate = layout.fillRate;

    console.log("in prepare data")
    console.log(layout)
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
    console.log(layoutData)

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
      console.log(e.target.id);
      if (e.target.id === 'Refresh') {
        this.toggleLoading();
        await this.btnRefreshLayout();
        this.toggleLoading();
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

        // for (let i = 0; i < weightOptions.length; i++) {
        //   const op = weightOptions[i];
        //   op.disabled = true;
        // }

        // enabledWeightOptions.forEach((id) => {
        //   const op = document.querySelectorAll(`#${this.panelId} .filters_container .weight_category_container fieldset input`)[id - 1];
        //   op.disabled = false;
        // })

        // console.log(enabledWeightOptions)
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

    this.toggleLoading();

    const whichFilters = [];
    if (this.selectedFilters.weight.length > 0) whichFilters.push("1");
    if (this.selectedFilters.product.length > 0) whichFilters.push("2");
    if (this.selectedFilters.location) whichFilters.push("3");

    const filterRequest = {
      Depot_Id: this.selectedDepotId,
      Filters: whichFilters,
      Product_Weight: this.selectedFilters.weight,
      Product_Category: this.selectedFilters.product
    }

    const filteredLayout = await this.dataController.filterLayout(this.selectedDepotId, whichFilters, this.selectedFilters.weight, this.selectedFilters.product);

    console.log(filterRequest);
    console.log(filteredLayout);

    const layoutData = await this.formatLayoutData(filteredLayout.data, "filter");
    console.log(layoutData)
    this.simulator.refreshLayout(layoutData);

    this.toggleLoading();
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