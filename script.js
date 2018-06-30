let canvasSimulator = null;
$(document).ready(function(){
  canvasSimulator = new CanvasSimulator("ants-area");
  $('#start').click(function(){
    let val = parseInt($('#nb-ants').val());
    if(val>0&&val<201){
      canvasSimulator.start(val);
    }
  });
  $('#break').click(function(){
    canvasSimulator.stop();
  });
  $('#resume').click(function(){
    canvasSimulator.resume();
  });
  $('#reset').click(function(){
    canvasSimulator.reset();
  });
})

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
    this.view = 3;
    this.map.cells[i][j].ant = this;
    this.stuck = false;

    this.food = 0;
    this.orientation = Math.random() * 360;
    this.calculated=false;

    this.deltaI=0;
    this.deltaJ=0;
  }

  move(){
    this.stuck = 0;
    let coord = this._checkForFood();
    if(this.food>0){
      coord = this._moveBackToNest();
      if(!this.map.cells[coord[0]][coord[1]].hasAnt()){
        this.map.cells[coord[0]][coord[1]].pheromone = 1;
        this.map.cells[coord[0]][coord[1]].pheromoneCoord = [this.i,this.j];
      }
    }else if(coord == false){
      coord = this._checkForPheromone();
      if(coord == null){
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
          this._exchange(coord);
        }else{
          this.stuck = 1; //Stuck moving to the nest
        }
      }else if(this.map.cells[this.i][this.j].pheromone > 0){
        if(this.map.cells[coord[0]][coord[1]].ant.stuck == 1){
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

  _moveBackToNest(){ //Move back to the nest using her knowledges of the direction of the nest
    let di = this.deltaI;
    let dj = this.deltaJ;
    this.orientation = Math.atan2(dj,di);

    let angle = 1.;
    this.orientation += Math.random()*angle-angle/2; // Variance of rotation of the ant

    return this.getCoordsFromOrientation();
  }

  _checkForFood(){
    let food = [];
    let freeFood = [];
    for(let i=-1;i<=1;++i){
      for(let j=-1;j<=1;++j){
        if(this.map.checkCoord([i+this.i,j+this.j])){
          if(this.map.cells[this.i+i][this.j+j].hasFood()){
            if(this.map.cells[this.i+i][this.j+j].hasAnt()){
              freeFood.push([this.i+i,this.j+j])
            }else{
              food.push([this.i+i,this.j+j]);
            }
          }
        }
      }
    }

    if(food.length > 0){
      return food[Math.floor(Math.random()*(food.length))];
    }
    return false;
  }

  _checkForPheromone(){
    let last = this.map.cells[this.i][this.j].pheromone;
    let current=0;
    let delta=0;
    let i=false;
    let j=false;
    for (let k = this.i-1; k <= this.i+1; k++) {
      for (let l = this.j-1; l <= this.j+1; l++) {
        if(this.map.checkCoord([k,l])){
          current = this.map.cells[k][l].pheromone;
          delta = last-current;
          if(current!=0){
            if (last == 0 && delta < 0 || last != 0 && delta > 0) { //Use gradiant
              i = k;
              j = l;
            }
          }
        }
      }
    }
    if(i==false||j==false){
      return null;
    }
    return [i,j];
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
    this.addFood(10, 150, 150);
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
  return !(coord[0]>=this.height ||
    coord[0]<0 ||
    coord[1]>=this.width ||
    coord[1]<0);
  }

  addFood(radius, ii, jj){
    console.log("Food addition")
    for(let i=-radius;i<radius;++i){
      for(let j=-radius;j<radius;++j){
        let dist = Math.floor(Math.sqrt(i*i+j*j));
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
    this.canvasState = Object.freeze({"CREATION":1, "RUNNING":2, "BREAK":3});
    this.divId = divId;
    this.width=200;
    this.height=200;
    this.ratio=4;
    this.intervalMS = 5;
    this.map = new MapArea(this.width, this.height, this.ratio);

    this.createCanvas(divId);
    this.switchState(this.canvasState.CREATION);
    setInterval(this.draw.bind(this), this.intervalMS);

    this.ants = [];
    this.antMax = 100;
    this.move = null;
  }

  start(maxAnt){
    this.antMax = maxAnt;
    //Ant moving
    this.switchState(this.canvasState.RUNNING);
    this.move = setInterval(this.moveAnts.bind(this), this.intervalMS*2);
  }

  stop(){
    clearInterval(this.move);
    this.switchState(this.canvasState.BREAK)
  }

  resume(){
    this.start();
  }

  reset(){
    this.map = new MapArea(this.width, this.height, this.ratio);

    this.switchState(this.canvasState.CREATION);

    this.ants = [];
    this.antMax = 200;
    this.move = null;
  }

  moveAnts(){
    for(let i=0;i<this.ants.length;i++){
      let ant = this.ants[i];
      ant.move();
    }
    this.map.pheromoneUpdate();
    this.antCreate();
  }

  antCreate(){
    if(this.ants.length < this.antMax){
      let ant = new Ant(this.map,10,10,this.ants.length);
      this.ants.push(ant);
    }else{
      clearInterval(this.antCreation);
    }
  }

  switchState(state){
    this.state = state;
    if(state == this.canvasState.RUNNING){
      $('#start').addClass("d-none");
      $('#reset').addClass("d-none");
      $('#break').removeClass("d-none");
      $('#resume').addClass("d-none");
    }else if(state == this.canvasState.CREATION){
      $('#start').removeClass("d-none");
      $('#reset').addClass("d-none");
      $('#break').addClass("d-none");
      $('#resume').addClass("d-none");
    }else if(state == this.canvasState.BREAK){
      $('#start').addClass("d-none");
      $('#reset').removeClass("d-none");
      $('#break').addClass("d-none");
      $('#resume').removeClass("d-none");
    }
  }

  createCanvas(divId){
    let canvas = document.getElementById(divId);
    this.context = canvas.getContext("2d");
    $("#"+divId).attr("width",this.width*this.ratio);
    $("#"+divId).attr("height",this.width*this.ratio);
  }

  draw(){
    this.map.draw(this.context);
  }
}
