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
        panelId: 'Panel',
        simulatorId: 'SimulationContainer',
        depotInfoId: 'DepotInfo',
        remoteUrl: 'http://localhost:3002'
    })

    app.init();
});
