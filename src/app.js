import Manager from "./core/Manager";

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.classList.add("demo-mode");
  const app = new Manager({
    depotSelectionId: 'SceneDepotSelection',
    simulationSceneId: 'SceneSimulation',
    panelId: 'Panel',
    simulatorId: 'SimulationContainer',
    depotInfoId: 'DepotInfo',
  })

  app.init();
});
