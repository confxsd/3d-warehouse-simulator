// DataVisual: documentation: https://github.com/mariodelgadosr/dataVisual

import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Color,
  GridHelper,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  EdgesHelper,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial,
  Font,
  TextGeometry,
  Group,
  Raycaster,
  Vector2,
  BufferGeometry,
  Line,
  Vector3
} from "three";
// import * as d3 from "d3";
import { OrbitControls } from "./OrbitControls.js";

const helvetikerFont = require('./assets/helvetiker.json')
const util = require("./util");


class Simulator {
  constructor({ containerId, data, size, getHistory, updateStock }) {
    this.container = document.getElementById(containerId);
    this.renderer = new WebGLRenderer();

    this.scene = new Scene();
    this.camera = null;
    this.controls = null;
    this.data = data;
    this.size = size;
    this.blockSize = 1;
    this.getHistory = getHistory;
    this.updateStock = updateStock;

    this.font = null;
  }


  init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera = new PerspectiveCamera(50, width / height, 0.1, 1000);
    this.controls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );

    const bgcolor = new Color(0xefefef);
    this.scene.background = bgcolor;

    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 32, 20);

    const gridHelper = new GridHelper(this.size.x, this.size.x);
    // this.scene.add(gridHelper);

    this.createTooltip();
    this.createActionbar();
    this.isActionActive = false;



    this.createCorridorTexts();
    this.createRoutingTexts();
    this.initBoxes(this.data);




    this.animate();
  }


  createRoutingTexts() {
    const routingPoints = ["Yol-1", "Yol-2", "Yol-3", "Yol-4", "Yol-5", "Yol-6", "Yol-7", "Yol-8"].reverse()

    const font = new Font(helvetikerFont);
    const material = new MeshBasicMaterial({
      color: new Color('rgb(0, 0, 0)'),
      opacity: 0.4,
    });

    for (let index = 0; index < routingPoints.length; index++) {
      const name = routingPoints[index];
      const geometry = new TextGeometry(name, {
        font: font,
        size: 0.4,
        height: 0.025,
      });

      geometry.computeBoundingBox();

      const textMesh = new Mesh(geometry, material);
      textMesh.position.x = (index + 1) * 4 - this.size.x / 2 + 0.5;
      textMesh.position.y = 0;
      textMesh.position.z = -this.size.y / 2 - 1;

      textMesh.rotation.x = -Math.PI / 2;

      this.scene.add(textMesh)
    }
  }

  createCorridorTexts() {
    const corridorNames = util.allCorridorNames();

    const font = new Font(helvetikerFont);

    const material = new MeshBasicMaterial({
      color: new Color('rgb(0, 0, 0)'),
      opacity: 0.4,
    });

    for (let index = 0; index < corridorNames.length; index++) {
      const name = corridorNames[index];
      const geometry = new TextGeometry(name, {
        font: font,
        size: 1,
        height: 0.025,
      });

      geometry.computeBoundingBox();

      const textMesh = new Mesh(geometry, material);
      textMesh.position.x = index * 4 - this.size.x / 2 + 0.75;
      textMesh.position.y = 0.1;
      textMesh.position.z = 0;

      textMesh.rotation.x = -Math.PI / 2;

      this.scene.add(textMesh)
    }
  }

  refreshLayout(layout) {
    this.boxGroup.children = [];
    this.initBoxes(layout);
  }

  initBoxes(layout) {
    this.routingPaths = new Group();
    this.routingPaths.type = "paths";

    this.boxGroup = new Group();
    this.boxGroup.type = "box";
    // console.log(this.data);
    for (const item of layout) {
      this.addToScene(this.boxGroup, item);
    }

    this.scene.add(this.boxGroup);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.render();
  }

  createActionbar(item) {
    const optionsList = document.createElement("div");
    optionsList.className = "options_list"

    const optionsParams = document.createElement("div");
    optionsParams.className = "options_params"

    const add = document.createElement("p");
    add.classList.add("add");
    add.textContent = "Add";

    const remove = document.createElement("p");
    remove.classList.add("remove");
    remove.textContent = "Remove";


    const history = document.createElement("p");
    history.classList.add("history");
    history.textContent = "History";

    const actionbar = document.createElement("div");
    actionbar.id = "Actionbar";

    optionsList.appendChild(add);
    optionsList.appendChild(remove);
    optionsList.appendChild(history);

    actionbar.appendChild(optionsList);
    actionbar.appendChild(optionsParams);

    this.container.appendChild(actionbar);

    // actionbar.style.position = "absolute";
    // actionbar.style.top = `${-999}px`;
    // actionbar.style.left = `${-999}px`;
    // actionbar.style.display = "none";
    // actionbar.style.background = "white";
    // actionbar.style.display = "flex";
    // actionbar.style.justifyContent = "space-between";
    // actionbar.style.flexDirection = "row";

    const mouse = new Vector2();
    const raycaster = new Raycaster();

    const onMouse = (event) => {

      const hideOptionParams = () => {
        optionsParams.innerHTML = ""
        optionsParams.style.display = "none"
      }

      const hideActionbar = () => {
        this.isActionActive = false;
        actionbar.style.display = "none";
        hideOptionParams();
      }


      if (event.type == "click") {
        hideActionbar();
        return;
      }

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);

      const intersects = raycaster.intersectObjects(
        this.boxGroup.children
      );

      const displayHistoryOptions = (title, cb) => {
        optionsParams.innerHTML = ""
        optionsParams.style.display = "flex";

        const itemTitle = document.createElement("p");
        itemTitle.textContent = title;

        const inputStart = document.createElement("input");
        inputStart.name = "input_start_date"
        inputStart.placeholder = "Start (YYYY-MM-DD)"

        const inputEnd = document.createElement("input");
        inputEnd.name = "input_end_date"
        inputEnd.placeholder = "End (YYYY-MM-DD)"

        const btnGet = document.createElement("button")
        btnGet.textContent = "Get"

        btnGet.addEventListener("click", (e) => {
          const startDateStr = inputStart.value;
          const endDateStr = inputEnd.value;

          cb(startDateStr, endDateStr);
        })

        optionsParams.appendChild(itemTitle);
        optionsParams.appendChild(inputStart);
        optionsParams.appendChild(inputEnd);
        optionsParams.appendChild(btnGet);
      }

      const displayStockUpdateOptions = (type, item, cb) => {
        optionsParams.innerHTML = ""
        optionsParams.style.display = "flex";

        const itemTitle = document.createElement("p");
        itemTitle.textContent = item.title;

        const inputAmount = document.createElement("input");
        inputAmount.name = "input_amount"
        inputAmount.placeholder = "Amount"

        const inputProductId = document.createElement("input");
        inputProductId.name = "input_product_id"
        inputProductId.placeholder = "Product Id"


        const btnAction = document.createElement("button")
        if (type === "add") {
          btnAction.textContent = "Add"
        } else if (type === "remove") {
          btnAction.textContent = "Remove"
        }

        const isEmpty = item.stock === 0;

        btnAction.addEventListener("click", (e) => {
          let amount = inputAmount.value;
          let productId = null

          if (type === "add" && isEmpty) {
            amount = "0";
            productId = inputProductId.value;
          }
          cb(amount, productId);
        })

        optionsParams.appendChild(itemTitle);

        if (!isEmpty) {
          optionsParams.appendChild(inputAmount);
        } else if (type === "add") {
          optionsParams.appendChild(inputProductId);
        }

        optionsParams.appendChild(btnAction);
      }

      const displayActionbar = (mouse, item) => {
        this.isActionActive = true;
        const x = (mouse.x + 1) / 2 * window.innerWidth;
        const y = -(mouse.y - 1) / 2 * window.innerHeight;

        actionbar.style.top = `${y}px`;
        actionbar.style.left = `${x + 16}px`;
        actionbar.style.display = "flex";

        const handleActions = async (event) => {
          if (event.target.classList.contains("add")) {
            displayStockUpdateOptions("add", item, async (amountStr, productId) => {
              const amount = parseInt(amountStr);
              if (!amountStr) {
                alert("Invalid value")
                return
              }
              if (amount < 0) {
                alert("Amount should be positive")
                return
              }
              if (item.stock + amount > item.maxQuan) {
                console.log(item.stock, amount, item.maxQuan)
                alert("Amount exceeds max quantity")
                return
              }

              const res = await this.updateStock("add", item.title, amount, productId);

              hideActionbar();
            })
          } else if (event.target.classList.contains("remove")) {
            displayStockUpdateOptions("remove", item, async (amountStr) => {
              if (item.stock === 0) {
                alert("Cannot remove from empty location")
                return;
              }
              const amount = parseInt(amountStr);
              if (!amountStr) {
                alert("Invalid value")
                return
              }
              if (amount <= 0) {
                alert("Amount should be positive")
                return
              }
              if (amount > item.stock) {
                console.log(item.stock, amount, item.maxQuan)
                alert("Amount exceeds stock quantity")
                return
              }

              const res = await this.updateStock("remove", item.title, amount);
              console.log(res)

              hideActionbar();
            })
          } else if (event.target.classList.contains("history")) {
            displayHistoryOptions(item.title, async (startDateStr, endDateStr) => {

              const pattern = /^(\d{4})(\/|-)(\d{1,2})(\/|-)(\d{1,2})$/

              const startDateMatch = startDateStr.match(pattern);
              const endDateMatch = endDateStr.match(pattern);

              if (!startDateMatch || !endDateMatch) {
                alert("Invalid dates")

                // hideActionbar();
                return;
              }

              const endDate = new Date(endDateStr);
              if (endDate - new Date() >= 0) {
                alert("End date cannot exceed today");
                // hideActionbar();
                return;
              }

              const history = await this.getHistory(item.title, startDateStr, endDateStr);
              console.log(startDateStr, endDateStr);
              console.log(history);
              this.showLocHistory(history);
              hideActionbar();
            })

          }
        }

        actionbar.addEventListener("click", handleActions, {
          once: true
        });
      }

      const hideTooltip = () => {
        const tooltip = document.getElementById("Tooltip");
        tooltip.style.display = "none";
      }

      if (intersects[0]) {
        const item = intersects[0].object;
        hideTooltip();
        displayActionbar(mouse, item);
      } else {
        hideActionbar();

      }
    }

    this.renderer.domElement.addEventListener("click", onMouse, false);
    this.renderer.domElement.addEventListener("contextmenu", onMouse, false);

  }

  showLocHistory(history) {
    const popup = document.getElementById("LocHistoryPopup");
    const closeBtn = document.querySelector("#LocHistoryPopup .close");
    const tableContainer = document.querySelector("#LocHistoryPopup .table_container")
    popup.classList.remove("closed");

    const historyListElem = this.constructHistoryTable(history);
    tableContainer.appendChild(historyListElem);

    closeBtn.addEventListener("click", (e) => {
      tableContainer.textContent = "";
      popup.classList.add("closed");
    });
  }

  constructHistoryTable(history) {
    const table = document.createElement("table");

    // header
    const tr = document.createElement("tr");
    Object.keys(history[0]).forEach((val) => {
      const th = document.createElement("th");
      th.textContent = val;
      tr.appendChild(th);
    })
    table.appendChild(tr);

    // rest of the table
    history.forEach(item => {
      const tr = document.createElement("tr");

      Object.keys(item).forEach(val => {
        const td = document.createElement("td");
        td.textContent = item[val];
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });

    return table;
  }

  createTooltip() {
    const locId = document.createElement("p");
    locId.classList.add("loc_id");

    const stock = document.createElement("p");
    stock.classList.add("stock");

    const locWeight = document.createElement("p");
    locWeight.classList.add("loc_weight");

    const proWeight = document.createElement("p");
    proWeight.classList.add("pro_weight");

    const maxQuan = document.createElement("p");
    maxQuan.classList.add("max_quan");

    const proId = document.createElement("p");
    proId.classList.add("pro_id");

    const tooltip = document.createElement("div");
    tooltip.id = "Tooltip";

    tooltip.appendChild(locId);
    tooltip.appendChild(locWeight);
    tooltip.appendChild(proWeight);
    tooltip.appendChild(maxQuan);
    tooltip.appendChild(stock);
    tooltip.appendChild(proId);

    this.container.appendChild(tooltip);

    tooltip.style.position = "absolute";
    tooltip.style.top = `${0}px`;
    tooltip.style.left = `${0}px`;
    tooltip.style.display = "none";
    tooltip.style.background = "white";
    tooltip.style.padding = "4px 8px 12px 8px";
    tooltip.style.border = "1px solid #666";

    const mouse = new Vector2();
    const raycaster = new Raycaster();

    const onMouse = (event) => {
      if (this.isActionActive) return;

      if (event.type == "mouseleave") {
        // this.boxGroup.traverse((box) => {
        //     box.remove(line);
        // })
        tooltip.style.display = "none";
        return;
      }

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);

      const intersects = raycaster.intersectObjects(
        this.boxGroup.children
      );

      const displayTooltip = (mouse, item) => {
        if (item.title === "block") return;

        const x = (mouse.x + 1) / 2 * window.innerWidth;
        const y = -(mouse.y - 1) / 2 * window.innerHeight;

        tooltip.style.top = `${y}px`;
        tooltip.style.left = `${x + 16}px`;
        tooltip.style.display = "block";

        const locId = tooltip.getElementsByClassName("loc_id")[0];
        const locWeight = tooltip.getElementsByClassName("loc_weight")[0];
        const proWeight = tooltip.getElementsByClassName("pro_weight")[0];
        const maxQuan = tooltip.getElementsByClassName("max_quan")[0];
        const stock = tooltip.getElementsByClassName("stock")[0];
        const proId = tooltip.getElementsByClassName("pro_id")[0];

        locId.textContent = "Loc Id: " + item.title;
        stock.textContent = "Stock: " + item.stock;

        if (item.stock !== 0) {
          maxQuan.style.display = "block"
          locWeight.style.display = "block"
          proWeight.style.display = "block"
          proId.style.display = "block"

          maxQuan.textContent = "Max Quantity: " + item.maxQuan;
          locWeight.textContent = "Loc weight: " + item.locWeight;
          proWeight.textContent = "Pro Weight: " + item.proWeight;
          proId.textContent = "Product Id: " + item.proId;
        } else {
          maxQuan.style.display = "none"
          locWeight.style.display = "none"
          proWeight.style.display = "none"
          proId.style.display = "none"
        }
      }

      const intersected = intersects[0];


      if (intersected) {
        const item = intersected.object;

        const edges = new EdgesGeometry(item.geometry);
        const line = new LineSegments(
          edges,
          new LineBasicMaterial({ color: 0x444444 })
        );
        line.type = "hoverbox";

        // this.scene.add(line);

        displayTooltip(mouse, item);
      } else {
        // this.scene.traverse((obj) => {
        //     console.log(obj)
        //     if(obj.type === "hoverbox") {
        //         this.scene.remove(obj);
        //     }
        // })
        tooltip.style.display = "none";
      }
    }

    this.renderer.domElement.addEventListener("mousemove", onMouse, false);
    this.renderer.domElement.addEventListener("mouseleave", onMouse, false);
    this.renderer.domElement.addEventListener("click", onMouse, false);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  addToScene(group, item) {
    let itemSize;
    let itemType;

    if (item.id === "block") {
      itemType = "block"
    } else if (item.locWeight === -1) {
      itemType = "empty"
    } else {
      itemType = "standart"
    }

    if (itemType === "block") {
      itemSize = 1;
    } else if (itemType === "empty") {
      itemSize = 0.5;
    } else {
      itemSize = util.map(item.stock, 0, 300, 0, 1);
    }

    const color = new Color(util.getColorValue(item.locWeight, itemSize, item.id));

    let material;
    if (itemType === "empty") {
      material = new MeshBasicMaterial({
        // color: Math.floor(Math.random() * 16777215),
        color: color,
        opacity: 0.6,
        transparent: true
      });
    } else {
      material = new MeshBasicMaterial({
        // color: Math.floor(Math.random() * 16777215),
        color: color,
        opacity: 1
      });
    }

    material.needsUpdate = true;

    const geometry = new BoxGeometry(
      this.blockSize,
      itemSize,
      this.blockSize
    );
    geometry.dynamic = true;
    geometry.translate(
      item.x - this.size.x / 2 - 0.5,
      +itemSize / 2,
      item.z - this.size.y / 2 - 0.5
    );

    // const edges = new EdgesGeometry(geometry);
    // const line = new LineSegments(
    //     edges,
    //     new LineBasicMaterial({ color: 0x999999 })
    // );

    const box = new Mesh(geometry, material);
    box.title = item.id;
    box.stock = item.stock;
    box.locWeight = item.locWeight;
    box.proWeight = item.proWeight;
    box.maxQuan = item.maxQuan;
    box.proId = item.proId;
    // box.add(line);

    group.add(box);
  }

  clearRouting() {
    this.routingPaths.children = []
  }

  async drawRouting(route) {
    this.scene.add(this.routingPaths);

    const material = new LineBasicMaterial({ color: 0xff0000, linewidth: 3 });

    const paths = util.determineRoutePaths(route, this.size.x);
    for (let i = 0; i < paths.length; i++) {
      const p = paths[i];
      const points = [];

      const p0x = p[0].x - 0.5;
      const p0y = p[0].y - 0.5;
      const p1x = p[1].x - 0.5;
      const p1y = p[1].y - 0.5;

      points.push(new Vector3(p0x, 0.1, p0y));
      points.push(new Vector3(p1x, 0.1, p1y));

      const geometry = new BufferGeometry().setFromPoints(points);
      const line = new Line(geometry, material);
      this.routingPaths.add(line);

      await new Promise(r => setTimeout(r, 2000));
    }

    console.log(paths)

  }
}

export default Simulator;
