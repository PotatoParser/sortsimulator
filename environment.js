// Github Repo: https://github.com/PotatoParser/sortsimulator

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
let STOP, PAUSE;	
let _offline = offlineJSON({SIZE: 100, SLEEP: 4, bar: "#009900", compare: "#ff0000"});

(function load(){
	resize();
	createFavicon();
	changeTime(_offline.SLEEP);
	changeSize(_offline.SIZE);			
	document.querySelector(".bar").value = _offline.bar;
	document.querySelector(".compare").value = _offline.compare;
	slider("#size", changeSize);
	slider("#time", changeTime);
	window.addEventListener("resize", resize);
	window.addEventListener("keyup", e=>{
		if (e.key === ' ') document.querySelector("#play").dispatchEvent(new MouseEvent("click"));
		if (e.key === "Escape") document.querySelector("#stop").dispatchEvent(new MouseEvent("click"));
	});
	document.querySelector("#stop").addEventListener("click", ()=>{
		STOP = true;
		toggle(false);
		clear();
	});
	document.querySelector("#sizeAdjuster").addEventListener("change", ()=>{
		changeSize(Number(document.querySelector("#sizeAdjuster").value));
	});

	document.querySelector("#timeAdjuster").addEventListener("change", ()=>{
		changeTime(Number(document.querySelector("#timeAdjuster").value));
	});

	document.querySelector(".compare").addEventListener("change", ()=>{
		_offline.compare = document.querySelector(".compare").value;
	});

	document.querySelector(".bar").addEventListener("change", ()=>{
		_offline.bar = document.querySelector(".bar").value;
	});		
})();

function offlineJSON(data){
	data = data || {};
	let handle = {
		set: (obj, prop, value)=>{
			obj[prop] = value;
			localStorage.setItem("offlineJSON", JSON.stringify(obj));						
		},
		get: (obj, prop, etc)=>{
			return obj[prop];
		}
	}
	if (!localStorage.getItem("offlineJSON")) localStorage.setItem("offlineJSON", JSON.stringify(data));
	let storedData = {};
	try {
		storedData = JSON.parse(localStorage.getItem("offlineJSON"));
	} catch(e) {
		localStorage.removeItem("offlineJSON");
		localStorage.setItem("offlineJSON", JSON.stringify(data));
	}
	Object.defineProperty(storedData, "reset", {
		enumerable: false,
		value: function(){
			for (let key in data) this[key] = data[key];
			return true;
		}
	});			
	let temp = new Proxy(storedData, handle);		
	return temp;
}

function createFavicon(){
	let temp = document.createElement("canvas");
	temp.height = 128;
	temp.width = 128;
	let tempArr = randNumArr(128);
	createRect(temp, 0,0,128,128, "white");
	drawArray(temp, tempArr, 1);
	document.querySelector("link").href = temp.toDataURL();
}

function slider(query, func){
	let active;
	let element = document.querySelector(query);
	element.addEventListener("mousemove", ()=>{
		if (active) func(Number(element.value));
	});
	element.addEventListener("change", ()=>{
		func(Number(element.value));
	});
	element.addEventListener("mousedown", ()=>{
		active = true;
		func(Number(element.value));				
	});
	element.addEventListener("mouseup", ()=>{
		active = false;
		func(Number(element.value));
	});
}

function toggle(val){
	let play = document.querySelector("#play");
	PAUSE = (typeof val === 'boolean')? val : ((PAUSE) ? false : true);
	play.innerText = (PAUSE) ? "RESUME \u25b6" : "PAUSE \x7c\x7c";
	if (val === false) play.setAttribute("disabled", '');
}

function reset(){
	document.querySelector("#stop").dispatchEvent(new MouseEvent("click"));
	_offline.reset();
	changeTime(_offline.SLEEP);
	changeSize(_offline.SIZE);
	document.querySelector(".bar").value = "#009900";
	document.querySelector(".compare").value = "#ff0000";
}

async function _sort(func){
	createFavicon();
	lockAll();
	try {
		let temp = randNumArr(_offline.SIZE);
		drawArray(canvas, temp, document.querySelector("canvas").width/_offline.SIZE);
		await func(temp);
	} catch(e) {
		clear();
	} finally {
		openAll();
	}			
}

function changeTime(newTime){
	_offline.SLEEP = Math.min(Math.max(Math.floor(newTime),4), 1000);
	document.querySelector("#time").value = _offline.SLEEP;
	document.querySelector("#timeAdjuster").value = _offline.SLEEP;
}

function changeSize(newSize){
	_offline.SIZE = Math.min(Math.max(Math.floor(newSize),1), 2000);
	document.querySelector("#sizeAdjuster").value = _offline.SIZE;			
	document.querySelector("input").value = _offline.SIZE;
}

function lockAll(){
	let temp = document.querySelectorAll(".disableable");
	for (let i = 0; i < temp.length; i++) temp[i].setAttribute("disabled", '');		
	document.querySelector("#play").removeAttribute("disabled");
	STOP = false;
}

function openAll(){
	let temp = document.querySelectorAll(".disableable");
	for (let i = 0; i < temp.length; i++) temp[i].removeAttribute("disabled");		
	toggle(false);
	STOP = false;	
}

async function pausing(){
	return new Promise((resolve, reject)=>{
		let stop = document.querySelector("#stop"), play = document.querySelector("#play");
		let temp = ()=>{
			play.removeEventListener("click", other);					
			reject();
		};
		let other = ()=>{
			stop.removeEventListener("click", temp);
			resolve();
		}
		stop.addEventListener("click", temp, {once: true});
		play.addEventListener("click", other, {once: true});
	});
}

function resize(){
	let temp = document.querySelector("canvas");
	let min = Math.min(window.innerWidth*0.5, window.innerHeight);
	temp.width = min*0.95;
	temp.height = min*0.95;
}

async function sleep(ms){
	return new Promise(async (resolve, reject)=>{
		let stop = document.querySelector("#stop");
		if (STOP) reject();
		let stopper = ()=>reject();		
		stop.addEventListener("click", stopper, {once: true});
		if (PAUSE) {
			try {
				await pausing();
			} catch(e) {
				reject();
			}
		}
		let temp = setTimeout(()=>{
			stop.removeEventListener("click", stopper);
			resolve();
		}, ms);
	});
}

async function graph(arr){
	await sleep(_offline.SLEEP);
	clear();
	drawArray(canvas, arr, document.querySelector("canvas").width/_offline.SIZE);
}

async function compare(arr, value){
	await graph(arr);
	compareBar(arr, value);		
}

async function compareBar(arr, value){
	let canvasSize = (document.querySelector("canvas").width/_offline.SIZE)
    createRect(canvas, canvasSize*value, 0, canvasSize, arr[value]*canvasSize, document.querySelector(".compare").value);
}

async function selectionSort(arr) {
	for (let i = 0; i < arr.length; i++) {
        let min = arr[i];
        let minIndex = i;
        for (let j = i; j < arr.length; j++) {
        	await compare(arr, j);
            if (min > arr[j]) {
                min = arr[j];
                minIndex = j;
            }
        }
        arr[minIndex] = arr[i];
        arr[i] = min;
        await graph(arr);
    }
}
async function insertionSort(arr){
    for (let i = 0; i < arr.length; i++) {
        let max = arr[i];
        for (let j = i; j >= 0; j--) {
        	await compare(arr, j);
            if (j === 0 && !(max > arr[j])) {
                for (let k = i; k > j; k--) {
                    arr[k] = arr[k-1];
                }
                arr[j] = max;
                break;
            } else if (max > arr[j]) {
                for (let k = i; k > j; k--) {
                    arr[k] = arr[k-1];
                }
                arr[j+1] = max;
                break;
            }
        }
        await graph(arr);
    }
}

async function mergeSort(arr, index, length) {		
	if (!index && !length) {
		index = 0;
		length = arr.length;
	}
	if (length > 2) {
		let half = Math.ceil(length/2);
		await mergeSort(arr, index, half);
		await mergeSort(arr, index+half, length-half);
		await combine(arr, index, half, index+half, length-half);
	} else if (length === 2){
		await compare(arr, index);				
		if (arr[index] > arr[index+1]) {
			let temp = arr[index+1];
			arr[index+1] = arr[index];
			arr[index] = temp;
		}
	}
	await graph(arr);	
}

async function combine(arr, index1, length1, index2, length2) {
	let in1 = 0;
	let in2 = 0;
	let arr1 = [];
	let arr2 = [];
	for (let i = 0; i < length1; i++) arr1.push(arr[index1+i]);
	for (let i = index2; i < index2+length2; i++) arr2.push(arr[i]);
	while (!(in1 === length1 || in2 === length2)) {
		await compare(arr, index1+in1+in2);
		if (arr1[in1] > arr2[in2]) {
			arr[index1+in1+in2] = arr2[in2];
			in2++;
		} else {
			arr[index1+in1+in2] = arr1[in1];
			in1++;
		}		
	}
	if (in1 !== length1) {
		for (let i = in1; i < length1; i++) arr[index1+in2+i] = arr1[i];
	} else {
		for (let i = in2; i < length2; i++) arr[index1+in1+i] = arr2[i];		
	}
	return arr;
}

async function bogoSort(arr) {
	while(!sorted(arr)) {
		let rand1 = Math.floor(Math.random()*(arr.length));
		let rand2 = Math.floor(Math.random()*(arr.length));
		await compare(arr, rand1);
		await compare(arr, rand2);
		let temp = arr[rand1];
		arr[rand1] = arr[rand2];
		arr[rand2] = temp;
		await graph(arr);
	}
}

function sorted(arr) {
	for (let i = 0; i < arr.length-1; i++) if (arr[i] > arr[i+1]) return false;
	return true;
}

function randNumArr(size) {
	let arr = [], rand, temp;
	for (let i = 0; i < size; i++) arr[i] = i+1;
	for (let i = size-1; i > 0; i--) {
		rand = Math.floor(Math.random()*(i+1));
		temp = arr[i];
		arr[i] = arr[rand];
		arr[rand] = temp;
	}
	return arr;
}

function createRect(canvas, x,y, width, height, color) {
	let ctx = canvas.getContext("2d");
	ctx.fillStyle = color || document.querySelector(".bar").value;
	ctx.fillRect(x,canvas.width-height-y,width,height);
}

function drawArray(canvas, arr, size){
	for (let i = 0; i < arr.length; i++) createRect(canvas, size*i, 0, size, arr[i]*size);
}

function clear(backup){
	let ctx2 = (backup) ? document.querySelector("canvas").getContext("2d") : ctx;
	ctx2.clearRect(0,0,document.querySelector("canvas").width,document.querySelector("canvas").width);
}