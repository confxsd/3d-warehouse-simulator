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
    Object3D,
    Group,
    Raycaster,
    Vector2,
} from "three";
// import * as d3 from "d3";
import { OrbitControls } from "./OrbitControls.js";

const map = (value, x1, y1, x2, y2) =>
    ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;



class Simulator {
    constructor({ containerId, data, div }) {
        this.container = document.getElementById(containerId);
        this.renderer = new WebGLRenderer();

        this.scene = new Scene();
        this.div = div;
        this.camera = null;
        this.controls = null;
        this.data = data;
        this.size = 32;
        this.blockSize = this.size / this.div;
    }
    init() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );

        const bgcolor = new Color(0xefefef);
        this.scene.background = bgcolor;

        this.renderer.setSize(width, height);
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 32, 20);

        const gridHelper = new GridHelper(this.size, this.div);
        this.scene.add(gridHelper);

        this.createTooltip();
        this.createActionbar();
        this.isActionActive = false;

        this.initBoxes();

        this.animate();
    }

    initBoxes() {
        this.boxGroup = new Group();
        this.boxGroup.type = "box";
        // console.log(this.data);
        for (const item of this.data) {
            this.addToScene(this.boxGroup, item);
        }

        this.scene.add(this.boxGroup);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.render();
    }

    createActionbar() {
        const add = document.createElement("p");
        add.classList.add("add");
        add.textContent = "Add";

        const remove = document.createElement("remove");
        remove.classList.add("remove");
        remove.textContent = "Remove";

        const actionbar = document.createElement("div");
        actionbar.id = "Actionbar";
        actionbar.appendChild(add);
        actionbar.appendChild(remove);

        this.container.appendChild(actionbar);

        actionbar.style.position = "absolute";
        actionbar.style.top = `${-999}px`;
        actionbar.style.left = `${-999}px`;
        actionbar.style.display = "none";
        actionbar.style.background = "white";
        actionbar.style.padding = "4px 8px 12px 8px";
        actionbar.style.border = "1px solid #666";
        actionbar.style.display = "flex";
        actionbar.style.width = "90px";
        actionbar.style.justifyContent = "space-between";

        const mouse = new Vector2();
        const raycaster = new Raycaster();

        const onMouse = (event) => {
            const hideActionbar = () => {
                this.isActionActive = false;
                actionbar.style.display = "none";
                return;
            }

            if (event.type == "click") {
                hideActionbar();
            }

            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);

            const intersects = raycaster.intersectObjects(
                this.boxGroup.children
            );

            const displayActionbar = (mouse, item) => {
                this.isActionActive = true;
                const x = (mouse.x + 1) / 2 * window.innerWidth;
                const y = -(mouse.y - 1) / 2 * window.innerHeight;

                actionbar.style.top = `${y}px`;
                actionbar.style.left = `${x + 16}px`;
                actionbar.style.display = "flex";

                const handleActions = (event) => {
                    if (event.target.classList.contains("add")) {
                        alert("cannot add yet")
                        hideActionbar();
                    } else if (event.target.classList.contains("remove")) {
                        alert("cannot remove yet");
                        hideActionbar();
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

    createTooltip() {
        const title = document.createElement("p");
        title.classList.add("title");

        const size = document.createElement("p");
        size.classList.add("size");

        const tooltip = document.createElement("div");
        tooltip.id = "Tooltip";
        tooltip.appendChild(title);
        tooltip.appendChild(size);

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
                const x = (mouse.x + 1) / 2 * window.innerWidth;
                const y = -(mouse.y - 1) / 2 * window.innerHeight;

                tooltip.style.top = `${y}px`;
                tooltip.style.left = `${x + 16}px`;
                tooltip.style.display = "block";
                const title = tooltip.getElementsByClassName("title")[0];
                const size = tooltip.getElementsByClassName("size")[0];
                title.textContent = "title: " + item.title;
                size.textContent = "size: " + item.size;
            }

            if (intersects[0]) {
                const item = intersects[0].object;
                displayTooltip(mouse, item);
            } else {
                tooltip.style.display = "none";
            }
        }

        this.renderer.domElement.addEventListener("mousemove", onMouse, false);
        this.renderer.domElement.addEventListener("mouseleave", onMouse, false);
        this.renderer.domElement.addEventListener("click", onMouse, false);
    }




    // checkIntersection() {
    //     this.raycaster.setFromCamera(mouseRatio, this.camera);
    //     // calculate objects intersecting the picking ray
    //     const intersects = this.raycaster.intersectObjects(
    //         this.boxGroup.children
    //     );

    //     for (let i = 0; i < intersects.length; i++) {
    //         const box = intersects[i].object;
    //         this.displayTooltip(mouse, box.title);
    //         intersects[i].object.material.color.set(0xff0000);
    //     }
    // }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    addToScene(group, item) {
        const colorval = Math.floor(map(item.size, 1 / 4, 1, 20, 100));
        const colorhsl = `hsl(175, ${colorval}%, 48%)`;
        const color = new Color(colorhsl);
        const material = new MeshBasicMaterial({
            // color: Math.floor(Math.random() * 16777215),
            color: color,
            opacity: 0.9,
        });
        material.needsUpdate = true;

        const geometry = new BoxGeometry(
            this.blockSize,
            item.size,
            this.blockSize
        );
        geometry.dynamic = true;

        geometry.translate(
            item.x + this.blockSize / 2 - this.div / 2,
            +item.size / 2,
            item.z + this.blockSize / 2 - this.div / 2
        );

        // const edges = new EdgesGeometry(geometry);
        // const line = new LineSegments(
        //     edges,
        //     new LineBasicMaterial({ color: 0x85de95 })
        // );

        const box = new Mesh(geometry, material);
        box.name = item.x + "." + item.z;
        box.title = item.title;
        box.size = item.size;
        group.add(box);
        // this.scene.add(line);
    }
}

export default Simulator;
