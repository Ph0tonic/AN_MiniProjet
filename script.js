
$(document).ready(function(){
  let canvasSimulator = new CanvasSimulator("ants-area");
})

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

  addPos(x, y){
    this.data[x][y]=true;
  }
}

class Ant{
  constructor(map, x, y){
    this.x = x;
    this.y = y;
    this.map = map;
    this.food = 0;
    this.mapRemember = new MapRemember(this.map);
    this.map.cells[x][y].ant = this;
    this.orientation = Math.random() * 360;
  }

  move(){
    //TODO move ant
    let coord = null;
    if(this.food>0){
      coord = this._moveBackToNest();
    }else if(this.map.cells[this.x][this.y].pheromone > 0){
      coord = this._moveFolowingPheromones();
    }else{
      coord = this._moveRandomly();
    }

    coord = this._moveRandomly();

    //Check if dest is free
    if(!this.map.cells[coord[0]][coord[1]].hasAnt()){
      this.map.cells[this.x][this.y].ant = null;
      this.x = coord[0];
      this.y = coord[1];
      this.mapRemember.addPos(this.x,this.y);
      this.map.cells[this.x][this.y].ant = this;
    }

    return;

  }

  _moveBackToNest(){
    //TODO
  }

  _moveRandomly(){
    let angle = 1.;
    this.orientation += Math.random()*angle-angle/2; // Variance of rotation of the ant
    return this.getCoordsFromOrientation();
  }

  _moveFolowingPheromones(){
    //TODO
  }

  getCoordsFromOrientation(){
    return this.map.boundCoord([this.x+Math.round(Math.cos(this.orientation)),this.y+Math.round(Math.sin(this.orientation))]);
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
    if(this.pheromone>0){
      return "red";
    }
    return false;
  }
}

class Map{
  constructor(width, height, ratio){
    this.ratio = ratio;
    this.width = width;
    this.height = height;
    this.init();
    this.addFood(200, 25, 75, 75);
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
    if(coord[0]>=this.width)coord[0]=this.width-1;
    if(coord[0]<0)coord[0]=0;
    if(coord[1]>=this.height)coord[1]=this.height-1;
    if(coord[1]<0)coord[1]=0;
    return coord;
  }

  addFood(quantity, radius, x, y){
    this.cells[x][y].food = quantity;
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
    this.map = new Map(this.width, this.height, this.ratio);

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
