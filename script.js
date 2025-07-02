const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

canvas.width = WIDTH;
canvas.height = HEIGHT;

const CELL_WIDTH = 8;
const CELL_HEIGHT = 8;

const GRID_WIDTH = Math.ceil(WIDTH/CELL_WIDTH);
const GRID_HEIGHT = Math.ceil(HEIGHT/CELL_HEIGHT);

const OFFSET_X = Math.floor((WIDTH - GRID_WIDTH*CELL_WIDTH) / 2);
const OFFSET_Y = Math.floor((HEIGHT - GRID_HEIGHT*CELL_HEIGHT) / 2);

let grid = Array.from({ length: GRID_HEIGHT }, () => {
	return Array.from({ length: GRID_WIDTH }, () => 0)
});

const GameOfLife = [
	{
		color: "hsl(0, 0%, 10%)",
		rules: {
			"1:=3": 1,
		}
	},
	{
		color: "hsl(0, 0%, 90%)",
		rules: {
			"1:<2|>3": 0,
			"1:=2|=3": 1,
		}
	},
];

const BriansBrain = [
	{
		color: "hsl(0, 0%, 10%)",
		rules: {
			"1:=2": 1,
		}
	},
	{
		color: "hsl(0, 0%, 90%)",
		rules: {
			"default": 2,
		}
	},
	{
		color: "hsl(0, 0%, 50%)",
		rules: {
			"default": 0
		}
	},
]

const Seeds = [
	{
		color: "hsl(0, 0%, 10%)",
		rules: {
			"1:=2": 1,
		}
	},
	{
		color: "hsl(0, 0%, 90%)",
		rules: {
			"default": 0
		}
	}
]

const WireWorld = [
	// 0: Empty
	{
		color: "hsl(0, 0%, 10%)",
		rules: {},
	},
	// 1: Electron Head 
	{
		color: "hsl(224, 100%, 50%)",
		rules: {
			"default": 2,
		},
	},
	// 2: Electron Tail 
	{
		color: "hsl(0, 100%, 50%)",
		rules: {
			"default": 3,
		},
	},
	// 3: Conductor
	{
		color: "hsl(48, 100%, 50%)",
		rules: {
			"1:=1|=2": 1
		},
	}
]

let currentRule = null;
function changeRule(newRule) {
	currentRule = newRule;
	for(let y = 0; y < GRID_HEIGHT; y++) {
		for(let x = 0; x < GRID_WIDTH; x++) {
			grid[y][x] = Math.min(grid[y][x], currentRule.length-1);
		}
	}

}

changeRule(GameOfLife);

const ruleSelect = document.getElementById("ruleSelect");
const playPauseBtn = document.getElementById("playPauseBtn");
const stepBtn = document.getElementById("stepBtn");
const speedRange = document.getElementById("speedRange");
const speedValue = document.getElementById("speedValue");
const randomizeBtn = document.getElementById("randomizeBtn");
const clearBtn = document.getElementById("clearBtn");

// Populate rule select 
const rules = {
	"Game of Life": GameOfLife,
	"Brian's Brain": BriansBrain,
	"Seeds": Seeds,
	"WireWorld": WireWorld,
}

ruleSelect.innerHTML = "";

for(const rule of Object.keys(rules)) {
	const option = document.createElement("option");
	option.value = rule;
	option.innerHTML = rule;
	ruleSelect.appendChild(option);

	if (currentRule == rules[rule]) ruleSelect.value = rule;
}

ruleSelect.addEventListener("input", (_) => {
	changeRule(rules[ruleSelect.value]);
})

let simulating = false;

function updatePlayPauseBtn() {
	if(simulating) {
		playPauseBtn.innerText = "Pause";
	} else {
		playPauseBtn.innerText = "Play";
	}
}

playPauseBtn.addEventListener("click", (_) => {
	simulating = !simulating;
	updatePlayPauseBtn();
})

stepBtn.addEventListener("click", (_) => {
	grid = updateGrid();
})

let speed = 1;

speedRange.addEventListener("input", (_) => {
	speedValue.innerText = speedRange.value;
	speed = 1/parseInt(speedRange.value)
})

randomizeBtn.addEventListener("click", (_) => {
	for(let y = 0; y < GRID_HEIGHT; y++) {
		for(let x = 0; x < GRID_WIDTH; x++) {
			grid[y][x] = Math.floor(Math.random() * currentRule.length);
		}
	}
})

clearBtn.addEventListener("click", (_) => {
	for(let y = 0; y < GRID_HEIGHT; y++) {
		for(let x = 0; x < GRID_WIDTH; x++) {
			grid[y][x] = 0;
		}
	}
})

function calculateNeighbours(x, y) {
	let neighbours = Array.from({ length: currentRule.length }, () => 0);

	for(let dy = -1; dy <= 1; dy++) {
		for(let dx = -1; dx <= 1; dx++) {
			if(dy == 0 && dx == 0) continue;

			let nx = dx + x;
			if(nx < 0) nx+=GRID_WIDTH;
			if(nx >= GRID_WIDTH) nx-=GRID_WIDTH

			let ny = dy + y;
			if(ny < 0) ny+=GRID_HEIGHT;
			if(ny >= GRID_HEIGHT) ny-=GRID_HEIGHT;

			let neighbour = grid[ny][nx];
			if (neighbour < currentRule.length) neighbours[neighbour]++;
		}
	}

	return neighbours;
}

function checkCondition(condition, targetState, neighbours) {
	const n = parseInt(condition.slice(1));

	switch (condition[0]) {
			case "=":
				return neighbours[targetState] == n;
			case "<": 
				return neighbours[targetState] <  n;
			case ">":
				return neighbours[targetState] >  n;
			default:
				return false;
	}
}

function checkRule(rule, neighbours) {
	const [targetStateStr, conditionsStr] = rule.split(":");
	const targetState = parseInt(targetStateStr);
	const conditions = conditionsStr.split("|")

	return conditions.some(c => checkCondition(c, targetState, neighbours));
}

function getNextState(x, y) {
	let current = grid[y][x];
	let rules = currentRule[current].rules;

	let neighbours = calculateNeighbours(x, y);

	for(const [rule, resultStr] of Object.entries(rules)) {
		if (rule == "default") continue;
		const result = parseInt(resultStr);

		if (checkRule(rule, neighbours)) return result;
	}

	return rules["default"] ?? current; 
}

function updateGrid() {
	const newGrid = [];

	for(let y = 0; y < GRID_HEIGHT; y++) {
		newGrid[y] = [];
		for(let x = 0; x < GRID_WIDTH; x++) {
			newGrid[y][x] = getNextState(x, y);
		}
	}

	return newGrid;
}

function render() {
	for(let y = 0; y < GRID_HEIGHT; y++) {
		for(let x = 0; x < GRID_WIDTH; x++) {
			ctx.fillStyle = currentRule[grid[y][x]].color ?? "hsl(0, 0%, 10%)";
			ctx.fillRect(x*CELL_WIDTH+OFFSET_X, y*CELL_HEIGHT+OFFSET_Y, CELL_WIDTH, CELL_HEIGHT);
		}
	}
}

window.addEventListener("keyup", (e) => {
	if (e.key == " ") {
		e.preventDefault();
		simulating = !simulating;
		updatePlayPauseBtn();
	}
}, { passive: false });

canvas.addEventListener("click", (e) => {
	const rect = canvas.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;

	const x = Math.floor(mouseX / CELL_WIDTH);
	const y = Math.floor(mouseY / CELL_HEIGHT);

	if(x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
		let next = (grid[y][x] + 1) % currentRule.length;
		grid[y][x] = next;
	}
});

let last = performance.now();
let acc = 0;
function loop(now) {
	const dt = (now - last) / 1000;
	last = now;

	if (simulating) {
		acc += dt;
		while (acc > speed) {
			acc -= speed;
			if(simulating) grid = updateGrid();
		}
	}

	render();
	requestAnimationFrame(loop)
}

requestAnimationFrame(loop);
