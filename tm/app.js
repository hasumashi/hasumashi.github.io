// $(function () {
// 	$('[data-toggle="tooltip"]').tooltip()
// })


function saveSVG() {
	var svgData = $("#graph-editor svg")[0].outerHTML;
	var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
	var svgUrl = URL.createObjectURL(svgBlob);
	var downloadLink = document.createElement("a");
	downloadLink.href = svgUrl;
	downloadLink.download = "graph.svg";
	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
}




function simulate() {
	var tape = prompt('Enter tape value:');
	var pos = prompt('Enter starting head position:');
	var stateName = prompt('Enter starting state name:');
	var startState = $('g.state-node text tspan').filter(function(){
		return $(this).text() === stateName;
	});
	if (startState.length !== 1) {
		alert("Couldn't find state with specified name.");
	} else {
		startState = startState.closest('g.state-node');
		console.log('strtinState:', startState);
		runMachine(startState.get(0).instance, tape, pos);
	}
}

function runMachine(startState, tape, pos) {
	tape = tape.split('');
	var currentState = startState;
	pos = parseInt(pos);

	while (machineCtrl[currentState].__halting !== true) {
		var input = tape[pos];
		var rule = machineCtrl[currentState][input];
		tape[pos] = rule.output;
		console.log('-----');
		console.log('tape:', tape);
		console.log('currentState:', currentState);
		console.log('pos:', pos);
		console.log('in:', input);
		console.log('rule:', rule);
		console.log('output:', rule.output, tape[pos]);
		pos += parseInt(rule.move);
		currentState = rule.nextState;
	}

	var endState = $(currentState.node).find('tspan').text();
	tape = tape.join('');
	console.log('=====');
	console.log('FINISHED: state', endState);
	console.log(' tape =', tape);
}



machineCtrl = {};

$(document).ready(function() {

	let counter = 1;
	var graphEditor = $('#graph-editor');
	var draw = SVG('graph-editor');

	// draw background pattern
	// var pattern = draw.pattern(16, 16, function(add) {
	// 	add.circle(2,2).fill('#ccc').move(8,8);
	// }); // another pattern: dots
	var pattern = draw.pattern(26, 26, function(add) {
		add.image('https://www.toptal.com/designers/subtlepatterns/patterns/tiny_grid.png')
	});
	var background = draw.rect(graphEditor.width(), graphEditor.height()).fill(pattern);

	// graphEditor.resize(function() {
	// 	background.size(this.width(), this.height());
	// });

	// create new state node
	background.dblclick(function(event) {
		// console.log(event);
		var moveX = event.offsetX - 25;
		var moveY = event.offsetY - 25;
		var color = event.ctrlKey ? '#BADA55' : '#000';

		var stateNode = draw.group();
		var circle = draw.circle(50, 50)
			.attr({
				'fill': '#fff',
				'fill-opacity': 0.4
			})
			.stroke({color: color, width: 2})
			// .style('cursor', 'hand')
			.move(moveX, moveY);
		stateNode.add(circle);

		/*var circle = draw.circle(50, 50)
			.fill('none')
			.stroke({color: color, width: 2})
			// .style('cursor', 'pointer')
			.move(moveX, moveY);
		stateNode.add(circle);*/

		// --handleCircle--
		// var handleCircle = draw.circle(1)
		// 	.fill("#009688")

		// circle.on('mouseenter', function(e) {
		// 	console.log(e);
		// 	handleCircle.move(e.offsetX, e.offsetY).animate(150).radius(5);
		// })
		// circle.on('mouseleave', function(e) {
		// 	console.log(e);
		// 	handleCircle.animate(150).radius(0);
		// })
		// --handleCircle-- /

		var text = draw.text('' + counter++)
			.fill(color)
			.font({
				size: 20,
				anchor: 'middle'
			})
			.move(event.offsetX, event.offsetY - 10);
		stateNode.add(text);

		// stateNode.style('cursor', 'move');
		stateNode.addClass('state-node');
		stateNode.draggable();
		
		if (event.ctrlKey) {
			stateNode.addClass('halting');
			machineCtrl[stateNode] = {
				__halting: true
			}
		}
	});

	// show dot when hovering node stroke
	// graphEditor.on('mousemove', 'g.state-node', function(e) {
		// console.log(e);
	// });

	// draw arrow lines
	graphEditor.on('mousedown', 'g.state-node', function(e) {
		if (e.button !== 0)
			return;

		clickedNode = e.currentTarget.instance;

		var newLine = draw.line(clickedNode.cx(), clickedNode.cy(), e.offsetX, e.offsetY)
			.stroke({width: 1})
			.marker('end', 10, 10, function (add) {
				add.path('M7.5 4.33L0 8.66L0 0z'); // triangle
			})
			.opacity(0.5);

			console.log(clickedNode.cx());

		graphEditor.mousemove(function (moveEv) {
			function calcScale(cx, cy, cr) {
				var r = Math.sqrt((cx - clickedNode.cx())**2 + (cy - clickedNode.cy())**2);
				return (r - cr) / r;
			}

			// console.log(moveEv);
			var mouseX = moveEv.offsetX;
			var mouseY = moveEv.offsetY;

			// var hoveredNode = graphEditor.find('g.state-node:hover')//.get(0).instance;
			var hoveredNode = SVG.select('g.state-node:hover');
			console.log(hoveredNode);
			if (!hoveredNode.members.length) {
				newLine.finish();

				var scale = calcScale(mouseX, mouseY, 26);
				newLine.attr({
					x1: mouseX - (mouseX - clickedNode.cx()) * scale,
					y1: mouseY - (mouseY - clickedNode.cy()) * scale,
					x2: mouseX,
					y2: mouseY
				});
			} else {
				var bbox = hoveredNode.bbox();
				console.log(bbox);
				// var cx = bbox.x + bbox.width/2;
				// var cy = bbox.y + bbox.height/2;
				var cr = (bbox.width / 2) + 4;
				console.log(bbox.cx, bbox.cy);

				var scale = calcScale(bbox.cx, bbox.cy, cr);
				newLine.animate(50, '<>').attr({
					x2: clickedNode.cx() + (bbox.cx - clickedNode.cx()) * scale,
					y2: clickedNode.cy() + (bbox.cy - clickedNode.cy()) * scale
				});
			}

		});

		graphEditor.mouseup(function(e) {
			newLine.finish();

			var hoveredNode = SVG.select('g.state-node:hover');
			if (!hoveredNode.members.length) {
				newLine
					.animate(70)
					.opacity(0)
					.after(function(situation) {
						newLine.remove();
					});
			} else {
				newLine.animate(90).opacity(1);
				console.log('saving link... (being implemented…)');
				var config = prompt("Enter link configuration [input/output/move]:");
				config = config.split('/');
				if (machineCtrl.hasOwnProperty(clickedNode) === false) 
					machineCtrl[clickedNode] = {};
				machineCtrl[clickedNode][config[0]] = {
					output: config[1],
					move: config[2],
					nextState: hoveredNode.members[0]
				};

				console.log(clickedNode);
				console.log(hoveredNode.members[0]);
				console.log('========');
			}
			
			graphEditor.off('mousemove');
			graphEditor.off('mouseup');
		})
	});

	// custom context menus
	function createContextMenu(options) {
		function eventHandler(event) {
			event.preventDefault();
			console.log(event);

			$('.context-menu .menu-title').text(options.title);

			$('.context-menu .dropdown-item').remove();
			options.actions.forEach(function(action) {
				var button = $('<button class="dropdown-item" type="button">');
				if (action.icon != undefined)
					button.html(`<i class="icon-${action.icon}"></i>${action.name}`);
				else
					button.text(action.name);

				button.appendTo('.context-menu');
				button.click(function(buttonEvent) {
					action.callback(event, buttonEvent);
				});
			});
			
			$('.context-menu')
				.toggle()
				.css({
					'left': event.pageX,
					'top': event.pageY
				});
		}

		if (options.element != undefined)
			options.element.on('contextmenu', eventHandler);
		else
			graphEditor.on('contextmenu', options.selector, eventHandler);
	}

	$(document).click(function() {
		$('.context-menu').hide();
	});

	createContextMenu({
		title: 'Graph Editor',
		element: background,
		actions: [
			{
				name: 'Clear',
				icon: 'cancel',
				callback: function() {
					graphEditor.find('g.state-node').remove();
				}
			}
		]
	});

	createContextMenu({
		title: 'State node',
		selector: 'g.state-node',
		actions: [
			{
				name: 'Delete',
				icon: 'cancel',
				callback: (e) => {
					e.currentTarget.remove()
				}
			},
			{
				name: 'Rename',
				icon: 'pencil',
				callback: (e) => {
					let currentText = $(e.currentTarget).find('text').text();
					let renamed = window.prompt(`Rename node "${currentText}"`);
					if (renamed)
						$(e.currentTarget).find('text tspan').text(renamed);
				}
			}
		]
	});

});