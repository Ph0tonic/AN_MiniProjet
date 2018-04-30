//TODO For test
let canvasSimulator = null;
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

    let nestCoord = [50,50];
    let nestCoordId = this.coordToId(nestCoord);

    let currentNode = null;
    let currentCoord = nestCoord;

    let estimatedNode = new EstimatedNode(nestCoord,nestCoord,0);

    nodeToEvalue.push(estimatedNode);

    let end = false;
    while(!end){
      //Sort nodeToEvaluate
      nodeToEvalue.sort(function(a, b){return a.cost - b.cost});
      if(nodeToEvalue.length>1){
        console.log("Sort check")
        console.log(nodeToEvalue)
      }

      //Take the first one and Remove it from the list
      if(debug){
        console.log(nodeToEvalue.length);
      }
      currentNode = nodeToEvalue.shift();
      if(debug){
        console.log(nodeToEvalue.length);
      }
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
  constructor(map, i, j){
    this.i = i;
    this.j = j;
    this.map = map;
    this.map.cells[i][j].ant = this;

    this.food = 0;
    this.orientation = Math.random() * 360;
    this.calculated=false;

    this.mapRemember = new MapRemember(this.map);
    this.mapRemember.addPos(this.i,this.j);
  }

  move(){
    //TODO move ant
    let coord = null;
    if(this.food>0){
      coord = this._moveBackToNest();
      this.map.cells[this.i][this.j].pheromone = 1;
    }/*else if(this.map.cells[this.x][this.y].pheromone > 0){
      coord = this._moveFolowingPheromones();
    }*/else{
      coord = this._moveRandomly();
    }

    //Check if dest is free
    if(!this.map.cells[coord[0]][coord[1]].hasAnt()){
      //TODO clean
      this.map.cells[this.i][this.j].ant = null;
      this.i = coord[0];
      this.j = coord[1];

      this.mapRemember.addPos(this.i,this.j);
      this.map.cells[this.i][this.j].ant = this;

      //Update dependingt of cells' content
      if(this.map.cells[this.i][this.j].food>0){
        this.map.cells[this.i][this.j].food = 0;
        this.food = 1;
      }
    }
  }

  _moveBackToNest(){ //Move back to the nest using her knowledges of the terrain

    if(this.calculated != true){ //Calc shortest way to home with our knowledges, just one time
      this.calculated=true;
      this.pathToNest = this.mapRemember.MarkWayToNest(this.i,this.j);
    }

    if(this.pathToNest.length == 1){//Last point before the nest
      this.food = 0;
      this.calculated=false;
      this.pathToNest = null;
    }
    let coord = this.pathToNest.shift();

    return coord;
  }

  _moveRandomly(){ //Move randomly
    let angle = 1.;
    this.orientation += Math.random()*angle-angle/2; // Variance of rotation of the ant
    return this.getCoordsFromOrientation();
  }

  _moveFolowingPheromones(){
    //TODO
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
  }

  hasAnt(){
    return !(this.ant == null);
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
      return "red";
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
}

class CanvasSimulator{
  constructor(divId){
    this.width=100;
    this.height=100;
    this.ratio=4;
    this.intervalMS = 50;
    this.map = new MapArea(this.width, this.height, this.ratio);

    this.createCanvas(divId);

    //Réaffichage de la carte
    setInterval(this.moveAndDraw.bind(this), this.intervalMS);
    this.ant = new Ant(this.map,50,50);
  }

  createCanvas(divId){
    //let canvas = $('#ants-area');
    //this.context = canvas.getContext("2d");
    let canvas = document.getElementById(divId);
    this.context = canvas.getContext("2d");
    $("#"+divId).attr("width",this.width*this.ratio);
    $("#"+divId).attr("height",this.width*this.ratio);
  }

  init(){

  }

  moveAndDraw(){
    this.ant.move();
    this.map.draw(this.context);
  }
}
