//TODO For test
let canvasSimulator = null;
let debugMoving = null;
$(document).ready(function(){
   canvasSimulator = new CanvasSimulator("ants-area");
})

let debug = false;

class MapRemember{
  constructor(map){
    this.map = map;
    this.width = map.width;
    this.height = map.height;
    this.init();
  }

  init(){ //Init the array with false values
    this.data = [];
    for(let i=0;i<this.height;++i){
      this.data[i] = [];
      for(let j=0;j<this.width;++j){
        this.data[i][j] = false;
      }
    }
  }

  addPos(i, j){
    this.data[i][j]=true;
  }

  distTo(coord1,coord2){
    return Math.sqrt((coord1[0]-coord2[0])*(coord1[0]-coord2[0])+(coord1[1]-coord2[1])*(coord1[1]-coord2[1]));
  }

  coordToId(coord){
    return this.map.width*coord[0]+coord[1];
  }

  idToCoord(id){
    return [id/this.map.width,id%this.map.width];
  }

  MarkWayToNest(i,j){
    let nodeToEvalue = [];
    let evaluatedNode = new Map();
    let visitedNode = new Set();

    let destCoordId = this.coordToId([i,j]);

    let nestCoord = [10,10];
    let nestCoordId = this.coordToId(nestCoord);

    let currentNode = null;
    let currentCoord = nestCoord;

    let estimatedNode = new EstimatedNode(nestCoord,nestCoord,0);

    nodeToEvalue.push(estimatedNode);

    let end = false;
    while(!end){
      //Sort nodeToEvaluate
      nodeToEvalue.sort(function(a, b){return a.cost - b.cost});

      //Take the first one and Remove it from the list
      currentNode = nodeToEvalue.shift();
      currentCoord = currentNode.coord;

      //Add it to the evaluated node
      evaluatedNode.set(this.coordToId(currentCoord), currentNode);

      //Manage this node :
      //look at the neightbor nodes
      for(let i=-1;i<=1;++i){
        for(let j=-1;j<=1;++j){
          if(this.map.checkCoord([currentCoord[0]+i,currentCoord[1]+j])){ //Check if the node is valid
            if(this.data[currentCoord[0]+i][currentCoord[1]+j] == true  && !visitedNode.has(this.coordToId([currentCoord[0]+i,currentCoord[1]+j]))){ //Check if the node is known and not already been evaluated
              nodeToEvalue.push(new EstimatedNode([currentCoord[0]+i,currentCoord[1]+j],currentCoord,currentNode.cost+1)); //Add the node to the node we have to evaluate
              visitedNode.add(this.coordToId([currentCoord[0]+i,currentCoord[1]+j]));
            }
          }
        }
      }

      //Check if we found our destination
      for(let i=0;i<nodeToEvalue.length;++i){
        if(this.coordToId(nodeToEvalue[i].coord) == destCoordId){
          end = true;
          evaluatedNode.set(this.coordToId(nodeToEvalue[i].coord),nodeToEvalue[i]); //Add the node to the evaluate node to be able to find is root

          i=nodeToEvalue.length; //Founded, end of the loop
        }
      }
    }

    //return the path
    let finalPath = [];

    let tempNode = evaluatedNode.get(destCoordId);
    while(this.coordToId(tempNode.coord) != this.coordToId(tempNode.previous)){ //only the first node has himself as his previous coord
      finalPath.push(tempNode.coord);
      tempNode = evaluatedNode.get(this.coordToId(tempNode.previous));
    }
    return finalPath;
  }
}

class EstimatedNode{
  /**
   * coord -> coordonées du point
   * previous -> previous point to get to this point
   * cost -> cost to get to this points
   */
  constructor(coord, previous, cost){
    this.coord = coord;
    this.previous = previous;
    this.cost = cost;
  }
}

class Ant{
  constructor(map, i, j, id){
    this.id = id;
    this.i = i;
    this.j = j;
    this.map = map;
    this.map.cells[i][j].ant = this;
    this.stuck = false;

    this.food = 0;
    this.orientation = Math.random() * 360;
    this.calculated=false;

    this.mapRemember = new MapRemember(this.map);
    this.mapRemember.addPos(this.i,this.j);
    this.deltaI=0;
    this.deltaJ=0;
  }

  move(){
    this.debug = false;
    debugMoving[this.id] = true;
    this.stuck = 0;
    let coord = this.checkForFood();
    if(this.food>0){
      coord = this._moveBackToNest2();
      if(!this.map.cells[coord[0]][coord[1]].hasAnt()){
        this.map.cells[coord[0]][coord[1]].pheromone = 1;
        this.map.cells[coord[0]][coord[1]].pheromoneCoord = [this.i,this.j];
      }
    }else if(coord == false){
      if(this.map.cells[this.i][this.j].pheromone > 0){
        coord = this.map.cells[this.i][this.j].pheromoneCoord;
      }else{
        coord = this._moveRandomly();
      }
    }

    //Check if dest is free
    if(!this.map.cells[coord[0]][coord[1]].hasAnt()){

      this.map.cells[this.i][this.j].ant = null;
      this._moveAnt(coord[0], coord[1]);
      this.map.cells[this.i][this.j].ant = this;
    }else{
      if(this.food>0){
        if(this.map.cells[coord[0]][coord[1]].ant.stuck == 2){
          //console.log("exchange")
          this._exchange(coord);
        }else{
          this.stuck = 1; //Stuck moving to the nest
        }
      }else if(this.map.cells[this.i][this.j].pheromone > 0){
        if(this.map.cells[coord[0]][coord[1]].ant.stuck == 1){
          //console.log("exchange")
          this._exchange(coord);
        }else{
          this.stuck = 2; // Stuck following pheromones
        }
      }
    }
  }

  _exchange(coord){
    this.map.cells[coord[0]][coord[1]].ant._moveAnt(this.i, this.j);
    this.map.cells[this.i][this.j].ant = this.map.cells[coord[0]][coord[1]].ant;
    this._moveAnt(coord[0], coord[1]);

    this.map.cells[coord[0]][coord[1]].ant = this.map.cells[this.i][this.j].ant;
    this.map.cells[this.i][this.j].ant = this;
  }

  _moveAnt(i, j){
    this.deltaI += this.i - i;
    this.deltaJ += this.j - j;
    this.i = i;
    this.j = j;
    this.stuck = 0;

    this.mapRemember.addPos(this.i,this.j);

    if(this.deltaI==0 && this.deltaJ==0){
      this.food = 0;
    }

    if(this.food<=0){
      if(this.map.cells[this.i][this.j].food>0){
        this.map.cells[this.i][this.j].food -= 0.1;
        this.food = 0.1;
      }
    }
  }

  _moveBackToNest(){ //Move back to the nest using her knowledges of the terrain
    if(this.calculated != true){ //Calc shortest way to home with our knowledges, just one time
      this.calculated=true;
      this.pathToNest = this.mapRemember.MarkWayToNest(this.i,this.j);
      this.pathToNest.shift();
    }

    let coord = this.pathToNest.shift();
    if(this.map.cells[coord[0]][coord[1]].hasAnt()){
      this.pathToNest.unshift(coord);
    }

    if(this.pathToNest.length == 0){//Last point before the nest
      this.food = 0;
      this.calculated=false;
      this.pathToNest=null;
    }
    return coord;
  }

  _moveBackToNest2(){ //Move back to the nest using her knowledges of their moves
    let di = this.deltaI;
    let dj = this.deltaJ;
    this.orientation = Math.atan2(dj,di);

    let angle = 1.;
    this.orientation += Math.random()*angle-angle/2; // Variance of rotation of the ant
    //console.log(this.orientation)

    //let x = this.i+(this.deltaI!=0?this.deltaI/Math.abs(this.deltaI):0);
    //let y = this.j+(this.deltaJ!=0?this.deltaJ/Math.abs(this.deltaJ):0);

    return this.getCoordsFromOrientation();
  }

  checkForFood(){
    let food = [];
    for(let i=-1;i<=1;++i){
      for(let j=-1;j<=1;++j){
        if(this.map.checkCoord([i+this.i,j+this.j])){
          if(this.map.cells[this.i+i][this.j+j].hasFood()){
            food.push([this.i+i,this.j+j]);
          }
        }
      }
    }
    if(food.lenth > 0){
      return food[Math.floor(Math.random()*(food.length))];
    }
    return false;
  }

  _moveRandomly(){ //Move randomly
    let angle = 1.;

    this.orientation += Math.random()*angle-angle/2; // Variance of rotation of the ant
    return this.getCoordsFromOrientation();
  }

  getCoordsFromOrientation(){
    return this.map.boundCoord([this.i+Math.round(Math.cos(this.orientation)),this.j+Math.round(Math.sin(this.orientation))]);
  }

  hasFood(){
    return (this.food>0);
  }
}

class Cell{
  constructor(){
    this.ant = null;
    this.food = 0;
    this.pheromone = 0;
    this.pheromoneCoord = null;
  }

  hasAnt(){
    return !(this.ant == null);
  }

  hasFood(){
    return this.food > 0;
  }

  getColor(){
    if(this.hasAnt()){
      if(this.ant.hasFood()){
          return "green";
      }
      return "black";
    }
    if(this.food>0){
      return "rgba(255,0,0,"+this.food+")";
    }
    if(this.pheromone>0){
      return "rgba(0,0,255,"+this.pheromone+")";
    }
    return false;
  }
}

class MapArea{
  constructor(width, height, ratio){
    this.ratio = ratio;
    this.width = width;
    this.height = height;
    this.init();
    this.addFood(10, 75, 75);
  }

  init(){
    this.cells = [];
    for(let i=0;i<this.height;++i){
      this.cells[i] = [];
      for(let j=0;j<this.width;++j){
        this.cells[i][j] = new Cell();
      }
    }
  }

  boundCoord(coord){
    if(coord[0]>=this.height)coord[0]=this.height-1;
    if(coord[0]<0)coord[0]=0;
    if(coord[1]>=this.width)coord[1]=this.width-1;
    if(coord[1]<0)coord[1]=0;
    return coord;
  }

  checkCoord(coord){
    return !( coord[0]>=this.height ||
              coord[0]<0 ||
              coord[1]>=this.width ||
              coord[1]<0);
  }

  addFood(radius, ii, jj){
    console.log("Food addition")
    for(let i=-radius;i<radius;++i){
      for(let j=-radius;j<radius;++j){
        let dist = Math.sqrt(i*i+j*j);
        if(dist<radius && this.checkCoord([ii+i,jj+j])){
          this.cells[ii+i][jj+j].food = Math.pow(1/(dist+0.1),0.4); // Avoid infinity
        }
      }
    }
  }

  draw(context){
    context.fillStyle="#dfe4ea";
    context.fillRect(0, 0, this.ratio*this.width, this.ratio*this.height);
    //this.draw();
    let color = false;
    for(let i=0;i<this.height;++i){
      for(let j=0;j<this.width;++j){
        color = this.cells[i][j].getColor();
        if(color != false){
          context.fillStyle=color;
          context.fillRect(i*this.ratio,j*this.ratio,1*this.ratio,1*this.ratio);
        }
      }
    }
    //context.fill();
  }

  pheromoneUpdate(){
    for(let i=0;i<this.height;++i){
      for(let j=0;j<this.width;++j){
        this.cells[i][j].pheromone *= 0.96;
        if(this.cells[i][j].pheromone<0.05){
          this.cells[i][j].pheromone = 0;
        }
      }
    }
  }
}

class CanvasSimulator{
  constructor(divId){
    this.width=100;
    this.height=100;
    this.ratio=4;
    this.intervalMS = 2;
    this.map = new MapArea(this.width, this.height, this.ratio);

    this.createCanvas(divId);

    //Réaffichage de la carte
    this.antCreation = setInterval(this.antCreate.bind(this), this.intervalMS*2);
    setInterval(this.draw.bind(this), this.intervalMS);
    setInterval(this.map.pheromoneUpdate.bind(this.map), this.intervalMS);

    this.ants = [];
    debugMoving = []
    this.antMax = 100;
  }

  antCreate(){
    if(this.ants.length < this.antMax){
      let ant = new Ant(this.map,10,10,this.ants.length);
      this.ants.push(ant);
      debugMoving.push(true);
      setInterval(ant.move.bind(ant),this.intervalMS);
    }else{
      clearInterval(this.antCreation);
    }
  }

  createCanvas(divId){
    //let canvas = $('#ants-area');
    //this.context = canvas.getContext("2d");
    let canvas = document.getElementById(divId);
    this.context = canvas.getContext("2d");
    $("#"+divId).attr("width",this.width*this.ratio);
    $("#"+divId).attr("height",this.width*this.ratio);
  }

  draw(){
    this.map.draw(this.context);
  }

  moveAnts(){
    this.ant.move();
  }
}

function test() {
  for(let i=0;i<debugMoving.length;++i){
    debugMoving[i] = false;
  }
}
