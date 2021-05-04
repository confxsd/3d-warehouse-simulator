import Simulator from "./Simulator";
import Manager from "./Manager";

document.addEventListener("DOMContentLoaded", () => {
    const app = new Manager({
        depotSelectionId: 'SceneDepotSelection',
        simulationSceneId: 'SceneSimulation',
        panelId: 'Panel',
        simulatorId: 'SimulationContainer',
        depotInfoId: 'DepotInfo',
        remoteUrl: 'https://hc-simulaiton.azurewebsites.net/api'
    })

    app.init();
});
