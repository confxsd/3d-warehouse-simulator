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

const mouse = new Vector2();

function onMouseMove(event) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

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

        this.raycaster = new Raycaster();
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

        this.tooltip = this.createTooltip();
        this.container.appendChild(this.tooltip);

        this.initBoxes();
        window.addEventListener("mousemove", onMouseMove, false);
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

    createTooltip() {
        const divText = document.createElement("p");
        const div = document.createElement("div");
        div.appendChild(divText);

        div.style.position = "absolute";
        div.style.top = `${0}px`;
        div.style.left = `${0}px`;
        div.style.display = "none";
        return div;
    }

    displayTooltip(mouse, item) {
        const x = ((mouse.x + 1) / 2) * window.innerWidth;
        const y = (-(mouse.y - 1) / 2) * window.innerHeight;

        this.tooltip.style.top = `${x}px`;
        this.tooltip.style.left = `${y}px`;
        this.tooltip.style.display = "block";
        const p = this.tooltip.getElementsByTagName("p");
        p.textContent = item;
    }

    checkIntersection() {
        this.raycaster.setFromCamera(mouse, this.camera);
        // calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(
            this.boxGroup.children
        );

        for (let i = 0; i < intersects.length; i++) {
            const box = intersects[i].object;
            this.displayTooltip(mouse, box.title);
            intersects[i].object.material.color.set(0xff0000);
        }
    }

    render() {
        this.checkIntersection();
        this.renderer.render(this.scene, this.camera);
    }

    addToScene(group, item) {
        const colorval = Math.floor(map(item.size, 1 / 4, 1, 40, 140));
        const colorhsl = `hsl(130, ${colorval}%, 60%)`;
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
        group.add(box);
        // this.scene.add(line);
    }
}

export default Simulator;
