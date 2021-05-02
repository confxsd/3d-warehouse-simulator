import Simulator from "./Simulator";
import DataController from './DataController';
import data from "./data.json";
const util = require("./util")
const layout = require("../layout.json")


class Manager {
    constructor({ depotSelectionId, simulationSceneId, panelId, simulatorId, depotInfoId, remoteUrl }) {
        this.depotSelectionId = depotSelectionId;
        this.simulationSceneId = simulationSceneId;
        this.panelId = panelId;
        this.simulatorId = simulatorId;
        this.depotInfoId = depotInfoId;
        this.remoteUrl = remoteUrl;
        this.selectedDepotId = null;
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
        // const layout = await this.dataController.getLayout(this.selectedDepotId);

        return util.toGridLayout(layout.info);
    }

    async initSimulation() {
        this.panel = document.getElementById(this.panelId);
        this.simulationScene = document.getElementById(this.simulationSceneId);
        this.simulationScene.style.display = "block";
        this.depotInfoContainer = document.getElementById(this.depotInfoId);

        const layoutData = await this.prepareLayoutData();

        this.simulator = new Simulator({
            data: layoutData,
            containerId: this.simulatorId,
            div: 39
        });

        this.panel.addEventListener('click', (e) => {
            console.log(e.target.id);
            if (e.target.id === 'refresh') {
                // this.refresh();
                alert('refresh clicked');
            }
        });

        this.prepareFirstValues(layout.DepoDoluluk, "depotInfo");
        this.simulator.init();

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

}

export default Manager;