import Simulator from "./Simulator";
import DataController from './DataController';
import data from "./data.json";

class Manager {
    constructor({ panelId, simulatorId, depotInfoId, remoteUrl }) {
        this.panelId = panelId;
        this.simulatorId = simulatorId;
        this.depotInfoId = depotInfoId;
        this.remoteUrl = remoteUrl;
    }

    init() {
        this.panel = document.getElementById(this.panelId);
        this.depotInfoContainer = document.getElementById(this.depotInfoId);

        this.simulator = new Simulator({
            data: data.items,
            containerId: this.simulatorId,
            div: 32
        });
        this.dataController = new DataController({
            url: this.remoteUrl
        });


        this.prepareFirstValues();
        this.simulator.init();

        this.panel.addEventListener('click', (e) => {
            console.log(e.target.id);
            if(e.target.id === 'refresh') {
                // this.refresh();
                alert('refresh clicked');
            }
        });
    }

    async prepareFirstValues() {
        await this.setFillRate();
        await this.setDepotInfo();
    }

    async setFillRate() {
        const fillRateVal = await this.dataController.getFillRate();
        const fillRateBox = this.depotInfoContainer.querySelector('.fill_rate span');
        fillRateBox.textContent = `${fillRateVal}%`;
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