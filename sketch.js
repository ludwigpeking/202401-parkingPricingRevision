let img, grid;
let coreClasses = [];
let exitClasses = [];
let coreHouseholdNumbers = [];
let starts = [];
let ends = [];
//TODO
let controlledLots = [];
let openLots = [];
let soldLots = [];

let x1, y1, x2, y2;
let selection = false;
let confirmed = false;

let detachedStarts = [];
let transfers = [];
let exits = [];
let pixelMultiplier = 5;
let redPoints = [];
let clustersBlue = [];
let clustersRed = [];
let clustersYellow = [];
let clustersGreen = [];
let clustersCyan = [];

function preload() {
  img = loadImage("./image/anno.png");
}

function loadImageFromInput(event) {
  let file = event.target.files[0];
  if (file.type.startsWith("image/")) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
      // load the image and wait for it to load before running
      img = loadImage(reader.result, function () {
        console.log("image loaded", img);
        // now that the image is loaded, call run
        run();
      });
    };
  }
}

function setup() {
  run();
}

// function draw(){
//     if (selection) {
//         // image(img, 0, 0, width, height);
//         // fill(255, 0, 0, 50);
//         // noStroke();
//         // rectMode(CORNERS);
//         // rect(x1, y1, x2, y2);
//     } else if (confirmed) {
//         // image(img, 0, 0, width, height);
//         // fill(255, 0, 0, 50);
//         // noStroke();
//         // rectMode(CORNERS);
//         // rect(x1, y1, x2, y2);
//         for (let i = 0; i < ends.length; i++) {
//             const end = ends[i];
//             if (end.controlled) {
//                 fill(150);
//                 noStroke();
//                 rectMode(CENTER);
//                 rect(ends[i].x * pixelMultiplier, ends[i].y * pixelMultiplier,  ends[i].horizontal * 2.5 * pixelMultiplier + 2.5 * pixelMultiplier, - ends[i].horizontal * 2.5 * pixelMultiplier + 5 * pixelMultiplier);
//             }
//         }
//     } // else {
//     //     image(img, 0, 0, width, height);
//     //     image(textLayer, 0, 0, width, height);
//     // }
// }

function run() {
  //destroy the inputs and select doms in the html, but keep the fileInput dom
  let inputs = document.getElementsByTagName("input");
  for (let i = inputs.length - 1; i >= 0; i--) {
    const input = inputs[i];
    if (input.type != "file") {
      input.remove();
    }
  }
  let selects = document.getElementsByTagName("select");
  for (let i = selects.length - 1; i >= 0; i--) {
    const select = selects[i];
    select.remove();
  }
  //destroy the button
  let buttons = document.getElementsByTagName("button");
  for (let i = buttons.length - 1; i >= 0; i--) {
    const button = buttons[i];
    button.remove();
  }
  //destroy the p dom
  let ps = document.getElementsByTagName("p");
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    p.remove();
  }
  createCanvas(img.width * pixelMultiplier, img.height * pixelMultiplier);
  textLayer = createGraphics(
    img.width * pixelMultiplier,
    img.height * pixelMultiplier
  );
  background(200);
  noStroke();

  console.log("sizes:", width, "px *", height, "px"); //show the sizes of the image
  //makeGrid() returns a 2d array of tile objects, black tiles are walls, white tiles are walkable, red tiles are start point, blue tiles are end points yellow tiles are detached start points, green tiles are transfer points, cyan tiles are exit points of the complex
  grid = makeGrid(); //color detection

  clustersBlue = []; //parking lots
  clustersRed = []; //elevators in basement
  clustersYellow = []; //detached elevators
  clustersGreen = []; //transfer elevators
  clustersCyan = []; //exits

  //find all clusters of blue points, red points, yellow points, green points, cyan points
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const tile = grid[i][j];
      if (tile.bluePoint) {
        tile.walkable = true;
        tile.bluePoint = false;
        const cluster = [tile];
        findCluster(grid, tile, cluster, "bluePoint");
        clustersBlue.push(cluster);
      }
      if (tile.redPoint) {
        tile.walkable = true;
        tile.redPoint = false;
        const cluster = [tile];
        findCluster(grid, tile, cluster, "redPoint");
        clustersRed.push(cluster);
      }
      if (tile.yellowPoint) {
        tile.walkable = true;
        tile.yellowPoint = false;
        const cluster = [tile];
        findCluster(grid, tile, cluster, "yellowPoint");
        clustersYellow.push(cluster);
      }
      if (tile.greenPoint) {
        tile.walkable = true;
        tile.greenPoint = false;
        const cluster = [tile];
        findCluster(grid, tile, cluster, "greenPoint");
        clustersGreen.push(cluster);
      }
      if (tile.cyanPoint) {
        tile.walkable = true;
        tile.cyanPoint = false;
        const cluster = [tile];
        findCluster(grid, tile, cluster, "cyanPoint");
        clustersCyan.push(cluster);
      }
    }
  }
  //show the number of each cluster

  console.log("Parking Lot Nr: ", clustersBlue.length);
  console.log("Elevator Nr: ", clustersRed.length);
  console.log("Detached Elevator Nr: ", clustersYellow.length);
  console.log("Transfer Elevator Nr: ", clustersGreen.length);
  console.log("Exits Nr: ", clustersCyan.length);
  //define objects
  ends = [];
  starts = [];
  detachedStarts = [];
  transfers = [];
  exits = [];
  //find the clusterCenter of each cluster of blue points and make it a end point
  for (let i = 0; i < clustersBlue.length; i++) {
    const cluster = clustersBlue[i];
    const clusterCenter = findClusterCenter(cluster);
    const endPoint = grid[clusterCenter.x][clusterCenter.y];
    endPoint.end = true;
    ends.push(endPoint);
    endPoint.horizontal = findClusterSize(cluster).horizontal; //horizontal or not is for parking lot diretion
  }
  //duplicate ends to openLots array
  openLots = ends.slice();
  //find the clusterCenter of each cluster of red points and make it a start point
  for (let i = 0; i < clustersRed.length; i++) {
    const cluster = clustersRed[i];
    const clusterCenter = findClusterCenter(cluster);
    const startPoint = grid[clusterCenter.x][clusterCenter.y];
    startPoint.start = true;
    starts.push(startPoint);
  }
  //find the clusterCenter of each cluster of yellow points and make it a detached start point
  for (let i = 0; i < clustersYellow.length; i++) {
    const cluster = clustersYellow[i];
    const clusterCenter = findClusterCenter(cluster);
    const detachedStartPoint = grid[clusterCenter.x][clusterCenter.y];
    detachedStartPoint.detachedStart = true;
    detachedStarts.push(detachedStartPoint);
  }
  //find the clusterCenter of each cluster of green points and make it a transfer point
  for (let i = 0; i < clustersGreen.length; i++) {
    const cluster = clustersGreen[i];
    const clusterCenter = findClusterCenter(cluster);
    const transferPoint = grid[clusterCenter.x][clusterCenter.y];
    transferPoint.transfer = true;
    transfers.push(transferPoint);
  }
  //find the clusterCenter of each cluster of cyan points and make it a exit point
  for (let i = 0; i < clustersCyan.length; i++) {
    const cluster = clustersCyan[i];
    const clusterCenter = findClusterCenter(cluster);
    const exitPoint = grid[clusterCenter.x][clusterCenter.y];
    exitPoint.exit = true;
    exits.push(exitPoint);
  }

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    for (let j = 0; j < ends.length; j++) {
      const end = ends[j];
      // const path = findPathJPS(grid, start, end);
      const dist = simpleManhattanDistance(start, end);
      start.dists.push(dist);
    }
  }
  //find the manhattan dists from each detached starts to transfer points
  for (let i = 0; i < detachedStarts.length; i++) {
    detachedStarts[i].distsToTransfer = [];
    const detachedStart = detachedStarts[i];
    for (let j = 0; j < transfers.length; j++) {
      const transfer = transfers[j];
      const distToTransfer = simpleManhattanDistance(detachedStart, transfer);
      detachedStart.distsToTransfer.push(distToTransfer);
    }
  }
  //find the manhattan dists from each transfer points to ends
  for (let i = 0; i < transfers.length; i++) {
    const transfer = transfers[i];
    for (let j = 0; j < ends.length; j++) {
      const end = ends[j];
      const dist = simpleManhattanDistance(transfer, end);
      transfer.dists.push(dist);
    }
  }
  //detached starts' dists to ends is the minimum of dists to transfer points + dists from transfer points to ends, find the minimum and push it to the dists
  for (let i = 0; i < detachedStarts.length; i++) {
    const detachedStart = detachedStarts[i];
    detachedStart.dists = [];
    for (let j = 0; j < ends.length; j++) {
      const end = ends[j];
      let minDist = 100000;
      for (let k = 0; k < transfers.length; k++) {
        const transfer = transfers[k];
        const dist = detachedStart.distsToTransfer[k] + transfer.dists[j];
        if (dist < minDist) {
          minDist = dist;
        }
      }
      detachedStart.dists.push(minDist);
    }
  }

  //put all detached starts into the starts array, so all starts are in the same array
  for (let i = 0; i < detachedStarts.length; i++) {
    const detachedStart = detachedStarts[i];
    starts.push(detachedStart);
  }

  //calculate all manhattan dists from all starts to all exits, and push them to a new distsToExits array
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    start.distsToExits = [];
    for (let j = 0; j < exits.length; j++) {
      const exit = exits[j];
      const dist = simpleManhattanDistance(start, exit);
      start.distsToExits.push(dist);
    }
  }

  listOfExits = [
    "易得 easy", // 5 mins
    "中等 moderate", // 10 mins
    "困难 difficult", // 15 mins
  ];
  //add selection doms to the exit points in the canvas
  for (let i = 0; i < exits.length; i++) {
    const exit = exits[i];
    exit.metersLoss = 800;
    exitClasses[i] = 1; //default is moderate
    const select = createSelect();
    select.position(exit.x * pixelMultiplier, exit.y * pixelMultiplier + 60);
    select.option("易得 easy");
    select.option("中等 moderate");
    select.option("困难 difficult");
    select.style("font-size", "8px");
    select.style("background-color", "transparent");
    select.style("border", "none");
    select.style("outline", "none");
    select.style("color", "#cccccc");
    select.value("中等 moderate");
    select.changed(mySelectEvent);
    // select.style('color', 'transparent');
    select.style("text-shadow", "2px 2px 0px black");
    // define the core class based on the selection

    function mySelectEvent() {
      exitClasses[i] = listOfExits.indexOf(select.value());
      exit.metersLoss = 80 * 5 * (1 + exitClasses[i]);
      //put text of the selection on the canvas near the exit point
    }
  }

  listOfCustomers = [
    "刚需 surviving",
    "首置 modest",
    "首改 comfortable",
    "再改 affluent",
    "高改 wealthy",
  ];
  //add selection doms to the start points in the canvas
  coreClasses = [];

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const select = createSelect();
    select.position(start.x * pixelMultiplier, start.y * pixelMultiplier + 60);
    select.option("刚需 surviving");
    select.option("首置 modest");
    select.option("首改 comfortable");
    select.option("再改 affluent");
    select.option("高改 wealthy");
    select.style("font-size", "8px");
    select.style("background-color", "transparent");
    select.style("border", "none");
    select.style("outline", "none");
    select.style("color", "#cccccc");
    select.value("首置 modest"); //default is modest
    coreClasses[i] = 1; //this index follows the default value
    select.changed(mySelectEvent);

    //make the dom very small
    select.size(AUTO, AUTO);

    // select.style('color', 'transparent');
    select.style("text-shadow", "1px 1px 0px black");
    // define the core class based on the selection

    function mySelectEvent() {
      coreClasses[i] = listOfCustomers.indexOf(select.value());
      //put text of the selection on the canvas near start point
    }
  }
  //add an input to change the percentageBar
  let percentageBarInput = createInput("出售比例要求");
  percentageBarInput.position(width - 100, 50);
  percentageBarInput.size(100);
  percentageBarInput.style("font-size", "8px");
  percentageBarInput.style("color", "black");
  percentageBarInput.style("background-color", "#ee6666");

  percentageBarInput.input(changePercentageBar);
  function changePercentageBar() {
    percentageBar = percentageBarInput.value();
  }
  //add number input doms to the start points in the canvas
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const input = createInput();
    input.position(
      start.x * pixelMultiplier - 10,
      start.y * pixelMultiplier + 75
    );
    input.size(15, 10);
    input.style("font-size", "8px");
    input.style("color", "black");
    input.style("background-color", "#ee6666");
    input.value(36);
    //add shadow to input cell not text
    coreHouseholdNumbers[i] = 36; //customized for Tsingtao
    input.input(myInputEvent);
    function myInputEvent() {
      coreHouseholdNumbers[i] = input.value();
    }
  }

  const p = createP(
    "使用说明：<br>1）按照要求处理好图片：用蓝色标记车位，红色标记核心筒，黑色代表墙壁，把图片尺寸调整到每个像素代表现实中0.5米。<br>  请注意图片处理的精度会影响计算结果。本版是试用版。<br>2) 请选择处理好的图片，代替上面的示例图片。<br>3) 选择核心筒的内产品的类型，“首改”大致代表120㎡左右的户型，对应的客户家庭月收入在2万元左右。<br>4) 输入核心筒内户数，比如54。<br>5) 点击“开始模拟”按钮，即可开始模拟。"
  );
  p.style("font-size", "8px");
  p.position(img.width + 10, 120);

  //create a button to start the buying simulation
  const button = createButton("开始模拟 start buying simulation");
  button.position(img.width + 10, 100).style("background-color", "pink");
  button.mousePressed(startBuyingSimulation);

  const salesControlButton = createButton("请选择销控车位 sales control, ");
  salesControlButton.position(img.width + 10, 10);
  salesControlButton.mousePressed(salesControl);

  //add a button to confirm the selection
  const confirmButton = createButton("确认销控范围 confirm");
  confirmButton.position(img.width + 10, 40);
  confirmButton.mousePressed(confirmControlledLots);

  const resetButton = createButton("重置 reset");
  resetButton.position(img.width + 10, 70).style("background-color", "grey");
  resetButton.mousePressed(resetSalesControl);
}

function makeGrid() {
  console.log("makeGrid");
  const grid = [];
  for (let i = 0; i < width; i++) {
    grid.push([]);
    for (let j = 0; j < height; j++) {
      let c = img.get(i, j); //get color of each pixel

      // console.log(i,j, c);
      if (c[0] < 100 && c[1] < 100 && c[2] < 100) {
        //black, walls, columns, not walkable
        grid[i].push({
          x: i,
          y: j,
          walkable: false,
          bluePoint: false,
          redPoint: false,
          yellowPoint: false,
          greenPoint: false,
          cyanPoint: false,
          dists: [],
        });
        fill(0);
        rect(
          i * pixelMultiplier,
          j * pixelMultiplier,
          1 * pixelMultiplier,
          1 * pixelMultiplier
        );
      } else if (c[0] - c[1] > 100 && c[0] - c[2] > 100) {
        //red, cores in basement
        grid[i].push({
          x: i,
          y: j,
          walkable: true,
          bluePoint: false,
          redPoint: true,
          yellowPoint: false,
          greenPoint: false,
          cyanPoint: false,
          level: round(c[1] / 25),
          dists: [],
        });
        fill(255, 0, 0);
        rect(
          i * pixelMultiplier,
          j * pixelMultiplier,
          1 * pixelMultiplier,
          1 * pixelMultiplier
        );
        redPoints.push(grid[i][j]);
      } else if (c[0] < 100 && c[1] < 100 && c[2] > 200) {
        //blue , parking lots
        grid[i].push({
          x: i,
          y: j,
          walkable: true,
          bluePoint: true,
          redPoint: false,
          yellowPoint: false,
          greenPoint: false,
          cyanPoint: false,
          dists: [],
        });
        fill(0, 0, 255);
        rect(
          i * pixelMultiplier,
          j * pixelMultiplier,
          1 * pixelMultiplier,
          1 * pixelMultiplier
        );
      } else if (c[0] > 200 && c[1] > 200 && c[2] < 50) {
        //yellow, detached cores
        grid[i].push({
          x: i,
          y: j,
          walkable: true,
          bluePoint: false,
          redPoint: false,
          yellowPoint: true,
          greenPoint: false,
          cyanPoint: false,
          dists: [],
        });
        fill(255, 255, 0);
        rect(
          i * pixelMultiplier,
          j * pixelMultiplier,
          1 * pixelMultiplier,
          1 * pixelMultiplier
        );
      } else if (c[0] < 50 && c[1] > 200 && c[2] < 50) {
        //green, transfer cores
        grid[i].push({
          x: i,
          y: j,
          walkable: true,
          bluePoint: false,
          redPoint: false,
          yellowPoint: false,
          greenPoint: true,
          cyanPoint: false,
          dists: [],
        });
        fill(0, 255, 0);
        rect(
          i * pixelMultiplier,
          j * pixelMultiplier,
          1 * pixelMultiplier,
          1 * pixelMultiplier
        );
      } else if (c[0] < 50 && c[1] > 200 && c[2] > 200) {
        //cyan, neighborhood exits
        grid[i].push({
          x: i,
          y: j,
          walkable: true,
          bluePoint: false,
          redPoint: false,
          yellowPoint: false,
          greenPoint: false,
          cyanPoint: true,
          dists: [],
        });
        fill(0, 255, 255);
        rect(
          i * pixelMultiplier,
          j * pixelMultiplier,
          1 * pixelMultiplier,
          1 * pixelMultiplier
        );
      } else {
        //white, walkable, open space
        grid[i].push({
          x: i,
          y: j,
          walkable: true,
          bluePoint: false,
          redPoint: false,
          yellowPoint: false,
          greenPoint: false,
          cyanPoint: false,
          dists: [],
        });
        fill(150);
        rect(
          i * pixelMultiplier,
          j * pixelMultiplier,
          1 * pixelMultiplier,
          1 * pixelMultiplier
        );
      }
    }
  }
  //store the current canvas
  img = get(0, 0, width, height);
  return grid;
}

function findCluster(grid, tile, cluster, color) {
  const neighbors = getNeighbors(grid, tile);
  for (let i = 0; i < neighbors.length; i++) {
    const neighbor = neighbors[i];
    if (neighbor[color]) {
      neighbor.walkable = true;
      neighbor[color] = false;
      cluster.push(neighbor);
      findCluster(grid, neighbor, cluster, color);
    }
  }
}

//calculate the average expands of the clusters in x and y directions
//NOT YET USED
function findClusterSize(cluster) {
  let xMin = 100000;
  let xMax = 0;
  let yMin = 100000;
  let yMax = 0;
  for (let i = 0; i < cluster.length; i++) {
    const tile = cluster[i];
    if (tile.x < xMin) {
      xMin = tile.x;
    }
    if (tile.x > xMax) {
      xMax = tile.x;
    }
    if (tile.y < yMin) {
      yMin = tile.y;
    }
    if (tile.y > yMax) {
      yMax = tile.y;
    }
  }
  const xSize = xMax - xMin;
  const ySize = yMax - yMin;
  //longer side is x, shorter side is y
  if (xSize > ySize) {
    return { xSize, ySize, horizontal: true };
  } else {
    return { xSize: ySize, ySize: xSize, horizontal: false };
  }
}

function findClusterCenter(cluster) {
  let xSum = 0;
  let ySum = 0;
  for (let i = 0; i < cluster.length; i++) {
    const tile = cluster[i];
    xSum += tile.x;
    ySum += tile.y;
  }
  const x = Math.round(xSum / cluster.length);
  const y = Math.round(ySum / cluster.length);
  return { x: x, y: y };
}

function getNeighbors(grid, tile) {
  const neighbors = [];
  const x = tile.x;
  const y = tile.y;
  if (x > 0) {
    neighbors.push(grid[x - 1][y]);
  }
  if (x < grid.length - 1) {
    neighbors.push(grid[x + 1][y]);
  }
  if (y > 0) {
    neighbors.push(grid[x][y - 1]);
  }
  if (y < grid[0].length - 1) {
    neighbors.push(grid[x][y + 1]);
  }
  return neighbors;
}

function removeFromArray(arr, elt) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] === elt) {
      arr.splice(i, 1);
    }
  }
}

function simpleManhattanDistance(start, end) {
  const d = Math.abs(start.x - end.x) + Math.abs(start.y - end.y);
  return d;
}

//to iterate pathfinding , clean up the grid and reset the start and end points
function resetGridJPS(grid) {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      grid[i][j].f = 0;
      grid[i][j].g = 0;
      grid[i][j].h = 0;
      grid[i][j].previous = undefined;
    }
  }
}

//draw all the doms' value on the textLayer at the doms' position
function drawDomsValue() {
  //shadow first for visibility
  textLayer.fill(0, 100);
  textLayer.noStroke();
  textLayer.textSize(pixelMultiplier * 2);
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    textLayer.text(
      listOfCustomers[coreClasses[i]],
      start.x * pixelMultiplier + 1,
      (start.y - 2) * pixelMultiplier + 1
    );
    textLayer.text(
      coreHouseholdNumbers[i] + "户",
      start.x * pixelMultiplier + 1,
      (start.y - 2) * pixelMultiplier + 3 * pixelMultiplier + 1
    );
  }
  for (let i = 0; i < exits.length; i++) {
    const exit = exits[i];
    textLayer.text(
      listOfExits[exitClasses[i]],
      exit.x * pixelMultiplier + 1,
      exit.y * pixelMultiplier + 1
    );
  }
  textLayer.fill(255);
  textLayer.noStroke();
  textLayer.textSize(pixelMultiplier * 2);
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    textLayer.text(
      listOfCustomers[coreClasses[i]],
      start.x * pixelMultiplier,
      (start.y - 2) * pixelMultiplier
    );
    textLayer.text(
      coreHouseholdNumbers[i] + "户",
      start.x * pixelMultiplier,
      (start.y - 2) * pixelMultiplier + 3 * pixelMultiplier
    );
  }
  for (let i = 0; i < exits.length; i++) {
    const exit = exits[i];
    textLayer.text(
      listOfExits[exitClasses[i]],
      exit.x * pixelMultiplier,
      exit.y * pixelMultiplier
    );
  }
  image(textLayer, 0, 0, width, height);
}

function startSelection() {
  selection = true;
  confirmed = false;
}

function confirmSelection() {
  if (selection) {
    confirmed = true;
    selection = false;
  }
}

function mousePressed() {
  if (selection) {
    x1 = mouseX;
    y1 = mouseY;
  }
}

function mouseDragged() {
  if (selection) {
    x2 = mouseX;
    y2 = mouseY;
  }
}

function mouseReleased() {
  if (selection) {
    x2 = mouseX;
    y2 = mouseY;
    pushControlledLots();
  }
}

function confirmControlledLots() {
  confirmed = true;
  selection = false;
  salesControlActive = true;
}

function salesControl() {
  console.log("salesControl");
  selection = true;
  confirmed = false;
}

function pushControlledLots() {
  let pushed = 0;
  for (let i = 0; i < openLots.length; i++) {
    const end = openLots[i];
    if (
      end.x * pixelMultiplier > x1 &&
      end.x * pixelMultiplier < x2 &&
      end.y * pixelMultiplier > y1 &&
      end.y * pixelMultiplier < y2
    ) {
      end.controlled = true;
      //move end to controlledLots Array and remove it from ends Array
      controlledLots.push(end);
      removeFromArray(openLots, end);
      pushed++;
      //draw the pushed lots in light grey
      fill(220);
      noStroke();
      rectMode(CENTER);
      rect(
        end.x * pixelMultiplier,
        end.y * pixelMultiplier,
        end.horizontal * 2.5 * pixelMultiplier + 2.5 * pixelMultiplier,
        -end.horizontal * 2.5 * pixelMultiplier + 5 * pixelMultiplier
      );
    }
  }
  console.log(pushed, "pushed: ");
}

function resetSalesControl() {
  salesControlActive = false;
  customersLeft = customers.slice();
  customersUsed = [];
  openLots = ends.slice();
  //put controlledLots back to ends
  for (let i = 0; i < controlledLots.length; i++) {
    const controlledLot = controlledLots[i];
    openLots.push(controlledLot);
  }
  controlledLots = [];
  image(img, 0, 0);
}

function openControlledLots() {}
