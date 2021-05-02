import Simulator from "./Simulator";
import Manager from "./Manager";
import data from "./data.json";

document.addEventListener("DOMContentLoaded", () => {
    // const simulator = new Simulator({
    //     data: data.items,
    //     containerId: "SimulationContainer",
    //     div: 32
    // });
    // simulator.init();
    
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
