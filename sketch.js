var data = {}; // Global object to hold results from the loadJSON call
var messageReceivedTotal;
var messageSentTotal;

var messageReceivedFrequency = []; // Monthly Post Frequency
var messageSentFrequency = [];

var postFrequency = [];
var commentFrequency = [];
var likeFrequency = [];

var WINDOW_WIDTH;
var WINDOW_HEIGHT;
var GRAPH_WIDTH = WINDOW_WIDTH-100;
var GRAPH_HEIGHT = WINDOW_HEIGHT- 100;
var GRAPH_OFFSET_X = 50;
var GRAPH_OFFSET_Y = WINDOW_HEIGHT- 50;

var COLOUR_BLUE = [114,181,255];
var COLOUR_PURPLE = [138,39,232];
var COLOUR_ORANGE = [232,134,31];
var COLOUR_RED = [255,42,34];
var COLOUR_YELLOW = [255,225,34];

var GRAPH_SCALES = [3000, 300];
var GRAPH_INTERVALS = [500, 50];

var currentGraphScale = 0;
var currentGraphInterval = 0;

var currentGraph = 0;
var currentGraphPercent = 0;
var currentGraphAlpha = 0;
var otherGraphPercent = 0;
var otherGraphAlpha = 0;

var hoverAlpha = 0;
var otherHoverAlpha = 0;

var transitionScale = 0;
var transitionDirection = -1;

var lastMillis;

var graphStates = {
  INITIAL_DRAW : 0,
  DISPLAY_STATIC: 1,
  TRANSITION: 2
}

var currentGraphState = 0;

var mouseIndex = -1;
var monthStrings = ["Janurary", "February", "March", "April", "May",
                    "June", "July", "August","September","October",
                    "November","December"];

var fontLight;


//transitioning graph scales
//decrease height scalar to max of "likes" over time
//fade in new y axis numbers


//simultaneously drawing graphs and fading out


//fadeout and fade in hover info

function preload() {

  fontLight = loadFont('fonts/MartelSans-ExtraLight.ttf');
  data = loadJSON('processedData.json');
}

function loadData(){
  messageReceivedFrequency = data["messageReceivedFrequency"];
  messageSentFrequency = data["messageSentFrequency"];
  postFrequency = data["postFrequency"];
  commentFrequency = data["commentFrequency"];
  likeFrequency = data["likeFrequency"];
  maxFreq = data["maxVal"]
  messageTotal = data["messageTotal"];
  messageSentTotal = data["messageSentTotal"];
}

function getMouseIndex(){
  var spacing = (GRAPH_WIDTH)/ (messageReceivedFrequency.length -1);
  //if mouse is outside graph area set index to -1;
  if ((mouseX < GRAPH_OFFSET_X || mouseX > GRAPH_OFFSET_X + GRAPH_WIDTH))// ||
      //(mouseY < (GRAPH_OFFSET_Y - GRAPH_HEIGHT) || mouseY > GRAPH_OFFSET_Y)) {
        {
        mouseIndex = -1;
      } else {
        
        //subtract x offset from mouseX, divide by spacing, then round to index
        mouseIndex = round((mouseX - GRAPH_OFFSET_X) / spacing);

      }
}



function drawGraphInfo() {
  textAlign(LEFT);
  
  strokeWeight(0.5);
  stroke(30);
  fill(30);
  textSize(30);
  var month = mouseIndex % 12;
  var year = floor(mouseIndex / 12) + 2008;

  var xPosition;
  if (mouseIndex > postFrequency.length/2) {
    textAlign(RIGHT);
    xPosition = mouseX - 10;
  } else {
    xPosition = mouseX + 10;
  }

  text(monthStrings[month] + " " + year, xPosition, 80);
  textSize(20);
  
  stroke(color(COLOUR_BLUE[0],COLOUR_BLUE[1],COLOUR_BLUE[2], (1 - transitionScale) * 255));
  fill(color(COLOUR_BLUE[0],COLOUR_BLUE[1],COLOUR_BLUE[2], (1 - transitionScale) * 255));
  text(messageReceivedFrequency[mouseIndex] + " messages received", xPosition, 130);

  
  stroke(color(COLOUR_PURPLE[0],COLOUR_PURPLE[1],COLOUR_PURPLE[2], (1 - transitionScale) * 255));
  fill(color(COLOUR_PURPLE[0],COLOUR_PURPLE[1],COLOUR_PURPLE[2], (1 - transitionScale) * 255));
  text(messageSentFrequency[mouseIndex] + " messages sent", xPosition, 160);

  stroke(color(COLOUR_ORANGE[0],COLOUR_ORANGE[1],COLOUR_ORANGE[2], ( transitionScale) * 255));
  fill(color(COLOUR_ORANGE[0],COLOUR_ORANGE[1],COLOUR_ORANGE[2], (transitionScale) * 255));
  text(likeFrequency[mouseIndex] + " reactions", xPosition, 130);

  stroke(color(COLOUR_YELLOW[0],COLOUR_YELLOW[1],COLOUR_YELLOW[2], ( transitionScale) * 255));
  fill(color(COLOUR_YELLOW[0],COLOUR_YELLOW[1],COLOUR_YELLOW[2], (transitionScale) * 255));
  text(commentFrequency[mouseIndex] + " comments", xPosition, 160);

  stroke(color(COLOUR_RED[0],COLOUR_RED[1],COLOUR_RED[2], ( transitionScale) * 255));
  fill(color(COLOUR_RED[0],COLOUR_RED[1],COLOUR_RED[2], (transitionScale) * 255));
  text(postFrequency[mouseIndex] + " posts", xPosition, 190);


  textSize(10);
  //text();
  noStroke();

}

//take in array, colour, alpha and percentage value
//set colour and alpha
//calculate index of last vertex to draw,
//create directional vector of last line segment
//calculate percentage of segment to draw
//repostion last vertex to correct end segment position

function drawGraphLine(graphArray, graphColor, graphAlpha, graphPercent) {

  var spacing = (GRAPH_WIDTH)/ (messageReceivedFrequency.length -1);
  var heightScalar = (GRAPH_HEIGHT) / currentGraphScale;
  strokeWeight(1.5);

  stroke(color(graphColor[0], graphColor[1],graphColor[2],graphAlpha * 255 * 0.7));

//if percent is 1 draw normally
if (graphPercent === 1) {
  beginShape();
  for (var i = 0; i < graphArray.length; i++) {
    var x = GRAPH_OFFSET_X + spacing * i;
    var y = GRAPH_OFFSET_Y - (graphArray[i]) * heightScalar;
    vertex(x, y);
  }
  endShape();
} else {
  beginShape();
  //calculate last index
  var lastIndex = graphArray.length * graphPercent;
  for (var i = 0; i < lastIndex; i++) {
    var x = GRAPH_OFFSET_X + spacing * i;
    var y = GRAPH_OFFSET_Y - (graphArray[i]) * heightScalar;
    vertex(x, y);
  }

  //draw the partial line (pl)
  //get last percentage
  var lastPercentage = lastIndex - floor(lastIndex);
  //get coordinates of the partial line
  var plx1 = GRAPH_OFFSET_X + spacing * floor(lastIndex);
  var ply1 = GRAPH_OFFSET_Y - (graphArray[floor(lastIndex)]) * heightScalar;
  var plx2 = GRAPH_OFFSET_X + spacing * ceil(lastIndex);
  var ply2 = GRAPH_OFFSET_Y - (graphArray[ceil(lastIndex)]) * heightScalar;
  //get the directional vector
  var dvx = plx2-plx1;
  var dvy = ply2-ply1;
  //get end vertex coordinate of partial line
  var plx = plx1 + (dvx * lastPercentage);
  var ply = ply1 + (dvy * lastPercentage);
  vertex(plx,ply);
  endShape();

}


}

function drawGraph(){
    drawGraphLine(messageReceivedFrequency, COLOUR_BLUE, currentGraphAlpha, currentGraphPercent);
    drawGraphLine(messageSentFrequency, COLOUR_PURPLE, currentGraphAlpha, currentGraphPercent);
    drawGraphLine(postFrequency, COLOUR_RED, otherGraphAlpha, otherGraphPercent);
    drawGraphLine(likeFrequency, COLOUR_ORANGE, otherGraphAlpha, otherGraphPercent);
    drawGraphLine(commentFrequency, COLOUR_YELLOW, otherGraphAlpha, otherGraphPercent);
}

function switchGraph(){
  currentGraphState = graphStates.TRANSITION;
  transitionDirection = -transitionDirection;
}

function keyPressed() {
  if (key === ' ') {
    switchGraph();
  }
}

function drawHoverLine() {
  
  var spacing = (GRAPH_WIDTH)/ (messageReceivedFrequency.length -1);
     stroke(150,180);
      strokeWeight(2);
      line(GRAPH_OFFSET_X + mouseIndex * spacing, GRAPH_OFFSET_Y - GRAPH_HEIGHT, GRAPH_OFFSET_X + mouseIndex * spacing, GRAPH_OFFSET_Y);
}

function drawGraphAxes() {
  var spacing = (GRAPH_WIDTH)/ (messageReceivedFrequency.length -1);
  var heightScalar = (GRAPH_HEIGHT) / currentGraphScale;
  strokeWeight(1.5);
  stroke(30);
  line(GRAPH_OFFSET_X, GRAPH_OFFSET_Y - GRAPH_HEIGHT, GRAPH_OFFSET_X, GRAPH_OFFSET_Y);
  line(GRAPH_OFFSET_X, GRAPH_OFFSET_Y, GRAPH_OFFSET_X+ GRAPH_WIDTH, GRAPH_OFFSET_Y);
  strokeWeight(0.5);
  textSize(12);
  noStroke();
  fill(30);
  for(var i = 0; i <= 10; i++) {
    textAlign(CENTER);
    text(i + 2008, GRAPH_OFFSET_X + i * spacing * 12, GRAPH_OFFSET_Y + 10);
  }

  for (var i = 0; i <= currentGraphScale; i+=currentGraphInterval) {
    textAlign(RIGHT, CENTER);
    text(floor(i), GRAPH_OFFSET_X - 5, GRAPH_OFFSET_Y - i * heightScalar - 5);
  }
  noFill();
}

function drawButtons(){
  textAlign(CENTER);
  textSize(30);
  noStroke();
  fill(30, (1 - transitionScale) * 255);
  text("Private Messages", WINDOW_WIDTH/2, 20);
  fill(30, transitionScale * 255);
  text("Public Posts", WINDOW_WIDTH/2, 20);
  noFill();
}

function setup() {
  WINDOW_WIDTH = windowWidth;
  WINDOW_HEIGHT = windowHeight;
  smooth();
  lastMillis = millis();
  createCanvas(1600, 900);
  loadData();
  textFont(fontLight);
  maxFreq = ceil(maxFreq/500) *500;
}

//if graphstate is init draw :
//get millis since last update
//add to percentage drawn
//add to alpha
//

//if graphstate is transitioning
//start transitioning scales

function update(){
  var timeDelta = millis() - lastMillis;
  if (currentGraphState === graphStates.INITIAL_DRAW) {
    currentGraphPercent += (timeDelta / 1000);
    currentGraphAlpha += (timeDelta / 500);
    currentGraphPercent = min(1, currentGraphPercent);
    currentGraphAlpha = min(1, currentGraphAlpha);
  } else if (currentGraphState == graphStates.TRANSITION) {
    transitionScale += (timeDelta / 1000) * transitionDirection;
    transitionScale = constrain(transitionScale, 0, 1);
    if ((transitionScale == 1 && transitionDirection == 1) ||
      (transitionScale == 0 && transitionDirection == -1)) {
      //end transition
    }
  }
  currentGraphScale = lerp(GRAPH_SCALES[0], GRAPH_SCALES[1], transitionScale);
  currentGraphInterval = lerp(GRAPH_INTERVALS[0], GRAPH_INTERVALS[1], transitionScale);
  if (currentGraphState == graphStates.TRANSITION) {
    //increase other graph percent, keep current graph percent and decrease alpha
    if (transitionDirection == 1) {
      currentGraphPercent = 1;
      currentGraphAlpha = 1 - transitionScale;
      otherGraphPercent = transitionScale;
      otherGraphAlpha = min(1, (transitionScale * 2));

    } else if (transitionDirection == -1) {
      //keep other graph percent and decrease alpha, 
      otherGraphPercent = 1;
      otherGraphAlpha = transitionScale;
      currentGraphPercent = 1 - transitionScale;
      currentGraphAlpha = min(1, (1 - transitionScale * 2));

    }
  }

  lastMillis = millis();

}


function draw() {
  background(250);
  getMouseIndex();
  update();
  drawGraph();
  if (mouseIndex != -1) {
    drawGraphInfo();
    drawHoverLine();
  }
  drawGraphAxes();
  drawButtons();
}
