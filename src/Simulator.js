import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Color,
  MeshPhongMaterial,
  GridHelper,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  WireframeGeometry,
  EdgesHelper,
  AmbientLight,
  DefaultLoadingManager,
  LoadingManager,
  EdgesGeometry,
  Euler,
  LineSegments,
  MeshLambertMaterial,
  LineBasicMaterial,
  Font,
  SphereGeometry,
  TextGeometry,
  Group,
  Raycaster,
  Vector2,
  BufferGeometry,
  Line,
  PointLight,
  Vector3,
  FileLoader,
  Uint8ClampedAttribute,
  MathUtils
} from "three";

import { OrbitControls } from "./lib/OrbitControls.js";
import { OBJLoader } from "./lib/OBJLoader.js";

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

    this.defaultCameraPos = new Vector3(0, 32, 20);
    this.camera = new PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(this.defaultCameraPos.x, this.defaultCameraPos.y, this.defaultCameraPos.z);

    this.controls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );

    const ambientLight = new AmbientLight(0xfefff9, 0.90);
    this.scene.add(ambientLight);

    const pointLight = new PointLight(0xefefef, 0.20);
    this.camera.add(pointLight);

    const bgcolor = new Color(0xefefef);
    this.scene.background = bgcolor;

    this.scene.add(this.camera);

    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);


    this.hoveredbox = null;


    this.shouldRoute = true;
    this.isRouting = false;
    this.isRouted = false;


    // const gridHelper = new GridHelper(this.size.x, this.size.x);
    // this.scene.add(gridHelper);

    this.createTooltip();
    this.createActionbar();
    this.isActionActive = false;



    this.createCorridorTexts();
    this.createRoutingTexts();
    this.initBoxes(this.data);


    this.loadCollectorGuy();


    this.animate();
  }

  resetZoom() {
    this.camera.lookAt(new Vector3(0, 0, 0));
    this.camera.position.set(this.defaultCameraPos.x, this.defaultCameraPos.y, this.defaultCameraPos.z);
    this.controls.reset();
  }

  showRoutingTexts(show) {
    if (this.routingTexts) {
      if (show) {
        this.scene.add(this.routingTexts);
      } else {
        this.scene.remove(this.routingTexts);
      }
    }
  }


  createRoutingTexts() {
    if (this.routingTexts) return;

    this.routingTexts = new Group();

    const pathPoints = [];
    for (let i = 1; i <= 19; i++) {
      pathPoints.push("Yol-" + i);
    }

    const font = new Font(helvetikerFont);
    const material = new MeshBasicMaterial({
      color: new Color('rgb(0, 0, 0)'),
      opacity: 0.4,
    });

    for (let index = 0; index < pathPoints.length; index++) {
      const name = pathPoints[index];
      const geometry = new TextGeometry(name, {
        font: font,
        size: 0.4,
        height: 0.025,
      });

      geometry.computeBoundingBox();

      const p = util.locToGridPoint(name, this.size);
      const textMesh = new Mesh(geometry, material);

      textMesh.position.x = p.x - this.size.x / 2 - 0.5;
      textMesh.position.y = 0;

      if (index < 8 || index === 17) {
        textMesh.position.z = p.y - this.size.y / 2 - 1;
      } else {
        textMesh.position.z = p.y - this.size.y / 2 + 1;
      }


      textMesh.rotation.x = -Math.PI / 2;

      this.routingTexts.add(textMesh)
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
    this.clearGroup(this.boxGroup);
    this.initBoxes(layout);
  }

  initBoxes(layout) {
    this.origRoutingPath = new Group();
    this.origRoutingPath.type = "path";

    this.optRoutingPath = new Group();
    this.optRoutingPath.type = "path";

    this.boxGroup = new Group();
    this.boxGroup.type = "box";

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

        // complex logic, can be simplified
        optionsParams.appendChild(itemTitle);
        if (isEmpty) {
          if (type === "add") {
            optionsParams.appendChild(inputProductId);
            optionsParams.appendChild(btnAction);
          }
        } else {
          optionsParams.appendChild(inputAmount);
          optionsParams.appendChild(btnAction);
        }
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

              if(!util.checkDate(startDateStr) || !util.checkDate(endDateStr)) {
                alert("Wrong date format.");
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
        this.togglehoverBox(false);
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

        if (item.boxType === "standart" || item.boxType === "empty") {
          this.hoveredbox = item
          this.togglehoverBox(true);
        }

        displayTooltip(mouse, item);
      } else {
        this.togglehoverBox(false);
        tooltip.style.display = "none";
      }
    }

    this.renderer.domElement.addEventListener("mousemove", onMouse, false);
    this.renderer.domElement.addEventListener("mouseleave", onMouse, false);
    this.renderer.domElement.addEventListener("click", onMouse, false);
  }

  togglehoverBox(activated) {
    if (this.hoveredbox) {
      const toDelete = this.scene.getObjectByName("hoveredbox");

      this.scene.remove(toDelete);

      if (activated) {
        this.scene.remove(toDelete);

        const edges = new WireframeGeometry(this.hoveredbox.geometry);
        const line = new LineSegments(
          edges,
          new LineBasicMaterial({ color: 0x444444 })
        );
        this.hoveredbox = line;
        this.hoveredbox.name = "hoveredbox"
        this.scene.add(this.hoveredbox);
      }
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  addToScene(group, item) {
    let itemSize;
    let boxType;

    if (item.id === "block") {
      boxType = "block"
    } else if (item.locWeight === -1) {
      boxType = "empty"
    } else {
      boxType = "standart"
    }

    if (boxType === "block") {
      itemSize = 1;
    } else if (boxType === "empty") {
      itemSize = 0.5;
    } else {
      itemSize = util.map(item.stock, 0, 300, 0, 1);
    }

    const color = new Color(util.getColorValue(item.locWeight, itemSize, item.id));

    let material;
    if (boxType === "empty") {
      material = new MeshLambertMaterial({
        // color: Math.floor(Math.random() * 16777215),
        color: color,
        opacity: 0.6,
        transparent: true
      });
    } else {
      material = new MeshLambertMaterial({
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

    const box = new Mesh(geometry, material);
    box.title = item.id;
    box.stock = item.stock;
    box.locWeight = item.locWeight;
    box.proWeight = item.proWeight;
    box.maxQuan = item.maxQuan;
    box.proId = item.proId;
    box.boxType = boxType;

    group.add(box);
  }

  clearGroup(group) {
    group.remove(...group.children);
  }

  clearRouting() {
    console.log(this.isRouted, this.isRouting)
    if (this.isRouted && !this.isRouting) {
      this.clearGroup(this.origRoutingPath)
      this.clearGroup(this.optRoutingPath);
      this.clearGroup(this.pickupPoints);
      
      this.toggleCollectorGuy(false);
      this.isRouted = false;
      this.showRoutingTexts(false);
      this.shouldRoute = true;
    }
  }

  toggleCollectorGuy(show) {
    if (this.guyObject) {
      if (show) {
        this.scene.add(this.guyObject);
      } else {
        this.scene.remove(this.guyObject);
      }
    }
  }

  loadCollectorGuy() {
    if (this.guyObject) return;

    const onLoad = (obj) => {
      const objLoader = new OBJLoader(null);
      this.guyObject = objLoader.parse(obj);

      this.guyObject.traverse(function (obj) {
        if (obj.isMesh) {
          obj.material = new MeshLambertMaterial({ color: 0x0000aa })
        }
      });

      this.guyObject.scale.set(0.03, 0.03, 0.03);
      this.guyObject.position.x = this.size.x / 2 - 8;
      this.guyObject.position.y = 0;
      this.guyObject.position.z = -this.size.y / 2 - 4;

      console.log("Model loaded")
    }

    const onProgress = (progress) => {
      const percent = Math.floor(progress.loaded / progress.total * 100);
      console.log(`Model is loading... ${percent}%`)
    }

    const onError = (error) => {
      console.log('Model not loaded');
      console.log(error);
    }

    const loader = new FileLoader();
    loader.load('./models/collecter_guy.obj',
      onLoad,
      onProgress,
      onError,
    );
  }

  isRoutingWorking() {
    return this.isRouting || this.isRouted;
  }

  cancelRouting() {
    this.shouldRoute = false;
  }

  async drawRouting(routing, speed) {

    this.shouldRoute = true;
    
    const frames = [];
    const delay = 200 / speed //ms
    this.isRouting = true;

    this.showRoutingTexts(true);
    this.toggleCollectorGuy(true);
    this.markPickupLocs(routing.pickupLocs);

    this.scene.add(this.origRoutingPath);
    this.scene.add(this.optRoutingPath);

    const origPath = util.determineRoutePaths(routing.origPath, "orig", this.size);
    const materialOrig = new LineBasicMaterial({ color: 0xff0000, linewidth: 3 });

    const optPath = util.determineRoutePaths(routing.optPath, "opt", this.size);
    const materialOpt = new LineBasicMaterial({ color: 0x0000ff, linewidth: 3 });

    const N = Math.max(origPath.length, optPath.length);


    for (let i = 0; i < N; i++) {
      const frameActions = [];

      let p0x, p0y, p1x, p1y;
      let p;

      let points = [];

      if (optPath[i]) {
        p = optPath[i];
        p0x = p[0].x - this.size.x / 2;
        p0y = p[0].y - this.size.y / 2;
        p1x = p[1].x - this.size.x / 2;
        p1y = p[1].y - this.size.y / 2;
        points.push(new Vector3(p0x, 0, p0y));
        points.push(new Vector3(p1x, 0, p1y));

        const geometry = new BufferGeometry().setFromPoints(points);
        const line = new Line(geometry, materialOpt);

        frameActions.push(() => {
          this.optRoutingPath.add(line)
        })
      }

      if (origPath[i]) {
        points = [];
        p = origPath[i];
        p0x = p[0].x - this.size.x / 2;
        p0y = p[0].y - this.size.y / 2;
        p1x = p[1].x - this.size.x / 2;
        p1y = p[1].y - this.size.y / 2;
        points.push(new Vector3(p0x, 0, p0y));
        points.push(new Vector3(p1x, 0, p1y));

        const geometry = new BufferGeometry().setFromPoints(points);
        const line = new Line(geometry, materialOrig);

        frameActions.push(() => {
          this.origRoutingPath.add(line)
        })
      }

      frameActions.push(() => {
        if (optPath[i]) {
          this.moveCollectorGuy(optPath[i][1])
        }
      });

      frames.push(frameActions);
    }


    // Run simulation for each frame
    for (const frame of frames) {

      if (!this.shouldRoute) break;
      frame.forEach((act) => {
        act();
      })
      await util.timeout(delay);
    }

    this.isRouted = true;
    this.isRouting = false;
  }


  moveCollectorGuy(nextLoc) {
    if (!this.guyObject) return;

    const prevPos = new Vector3().copy(this.guyObject.position);
    const nextPos = new Vector3(nextLoc.x - this.size.x / 2, 0, nextLoc.y - this.size.y / 2);

    this.guyObject.lookAt(nextPos);

    let indent = 0;
    if (nextPos.z > prevPos.z) {
      console.log("down")
      indent = -0.5;
    } if (nextPos.z < prevPos.z) {
      console.log("up")
      indent = 0.5;
    }

    this.guyObject.position.set(nextPos.x + indent, 0, nextPos.z)
  }

  markPickupLocs(locs) {
    if(!this.pickupPoints) {
      this.pickupPoints = new Group();
      this.pickupPoints.type = "pickup";
      this.scene.add(this.pickupPoints);
    }
    
    const points = locs.map((l) => {
      return util.locToGridPoint(l, this.size)
    })

    const material = new MeshLambertMaterial({ color: 0xfacc33 });

    points.forEach((p) => {
      const geometry = new SphereGeometry(0.3, 32, 32);
      const sphere = new Mesh(geometry, material);
      sphere.position.x = p.x - this.size.x / 2 - 0.5;
      sphere.position.y = 1.2;
      sphere.position.z = p.y - this.size.y / 2 - 0.5;
      this.pickupPoints.add(sphere)
    })

    
  }
}

export default Simulator;
