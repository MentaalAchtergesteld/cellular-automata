const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const WIDTH = 512;
const HEIGHT = 512;

canvas.width = WIDTH;
canvas.height = HEIGHT;

const CELL_WIDTH = 8;
const CELL_HEIGHT = 8;

const GRID_WIDTH = Math.floor(WIDTH/CELL_WIDTH);
const GRID_HEIGHT = Math.floor(HEIGHT/CELL_HEIGHT);

let grid = Array.from({ length: GRID_HEIGHT }, () => {
	return Array.from({ length: GRID_WIDTH }, () => 0)
});

const GoL = [
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
]

let currentRule = GoL;

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

function getNextState(x, y) {
	let current = grid[y][x];
	let rules = currentRule[current].rules;

	let neighbours = calculateNeighbours(x, y);

	for(const [rule, resultStr] of Object.entries(rules)) {
		const result = parseInt(resultStr);
		const [targetStateStr, conditionsStr]	= rule.split(":");
		const targetState = parseInt(targetStateStr);
		const conditions = conditionsStr.split("|");

		for(const condition of conditions) {
			const n = parseInt(condition.slice(1));
			switch (condition[0]) {
				case "=":
					if (neighbours[targetState] == n) return result;
					break;
				case "<": 
					if (neighbours[targetState] <  n) return result;
					break;
				case ">":
					if (neighbours[targetState] > n) return result;
					break;
			}
		}
	}

	return current; 
}

function updateGrid() {
	console.log("Hi");
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
			if (grid[y][x] == 1) {
				ctx.fillStyle = "hsl(0, 0%, 90%)";
			} else {
				ctx.fillStyle = "hsl(0, 0%, 10%)";
			}

			ctx.fillRect(x*CELL_WIDTH, y*CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
		}
	}
}

let simulating = false;

window.addEventListener("keyup", (e) => {
	if (e.key == " ") {
		e.preventDefault();
		simulating = !simulating;
	}
}, { passive: false });

canvas.addEventListener("click", (e) => {
	const rect = canvas.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;

	const x = Math.floor(mouseX / CELL_WIDTH);
	const y = Math.floor(mouseY / CELL_HEIGHT);

	if(x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
		grid[y][x] = grid[y][x] == 1 ? 0 : 1;
	}
});

function loop(_) {
	if(simulating) grid = updateGrid();
	render();
	requestAnimationFrame(loop)
}

requestAnimationFrame(loop);
