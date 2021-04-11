import Simulator from "./Simulator";
import data from "./data.json";

document.addEventListener("DOMContentLoaded", () => {
    const simulator = new Simulator({
        data: data.items,
        containerId: "SimulationContainer",
        div: 32
    });
    simulator.init();
});
