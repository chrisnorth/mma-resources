/*
	Draggable line
*/
(function(root){
	if(!root.Graph){
		console.error('No Graph to attach to. Make sure graph.js is included first.');
	}else{
		var selected = "";
		function Draggable(graph){
			this.dragging = false;
			this.selected = "";
			var _obj = this;

			function findNearestSeries(e){
				var i,d,dx,dy,px,idx,min,dist,ok,data,s,m;
				min = 20;
				dist = 1e100;
				var matches = [];
				var series = graph.series;
				var pos = getPos(e);
				px = {'x':pos.px,'y':pos.py};

				for(s in series){
					if(series[s]){
						dist = 1e100;
						d = -1;
						idx = -1;
						// Get pixel coordinates of data
						data = graph.dataToGraph(series[s].getData(0));
						for(i = 1; i < data.length; i++){
							d = distanceToLineSegment(data[i-1],data[i],px);
							if(d < dist){
								idx = i;
								dist = d;
							}
						}
						if(idx >= 0) matches.push({'dist':dist,'series':s});
					}
				}

				dist = 1e100;
				idx = "";
				for(m = 0; m < matches.length; m++){
					s = matches[m].series;
					if(matches[m].dist < dist && graph.series[s]._draggable){
						dist = matches[m].dist;
						idx = s;
					}
				}
				return idx;
			}

			function getPos(e){
				var x,y;

				// Get position
				if(e.type.match("touch")){
					x = e.touches[0].clientX;
					y = e.touches[0].clientY;
				}else{
					x = e.clientX;
					y = e.clientY;
				}
				var pos = graph.getValueAt(x,y);
				pos._x = x;
				pos._y = y;
				return pos;
			}
			
			this.move = function(e){
				if(!this.selected){ return; }
				if(graph.series[this.selected]){
					if(typeof graph.series[this.selected]._draggable.opt.drag==="function") graph.series[this.selected]._draggable.opt.drag.call(graph, e, graph.series[this.selected], getPos(e));
				}
				return;
			};
			this.start = function(e){
				var selected = findNearestSeries(e);
				if(graph.series[selected] && graph.series[selected]._draggable){
					this.selected = selected;
					if(typeof graph.series[this.selected]._draggable.opt.dragstart==="function") graph.series[this.selected]._draggable.opt.dragstart.call(graph, e, graph.series[this.selected]);
				}
				return;
			};
			this.end = function(e){
				if(graph.series[this.selected] && graph.series[this.selected]._draggable){
					if(typeof graph.series[this.selected]._draggable.opt.dragend==="function") graph.series[this.selected]._draggable.opt.dragend.call(graph, e, graph.series[this.selected]);
				}
				this.selected = "";
			};

			this.enable = function(s,opt){
				s._draggable = {'enabled':true,'opt':opt||{}};
				return this;
			};

			// Only add events once per Graph
			graph.el.addEventListener("mousedown", function(e){ e.preventDefault(); e.stopPropagation(); _obj.start(e); });
			graph.el.addEventListener("mousemove", function(e){ e.preventDefault(); e.stopPropagation(); _obj.move(e); });
			graph.el.addEventListener("mouseup", function(e){ e.preventDefault(); e.stopPropagation(); _obj.end(e); });

			graph.el.addEventListener("touchstart", function(e){ e.preventDefault(); e.stopPropagation(); _obj.start(e); });
			graph.el.addEventListener("touchmove", function(e){ e.preventDefault(); e.stopPropagation(); _obj.move(e); });
			graph.el.addEventListener("touchend", function(e){ e.preventDefault(); e.stopPropagation(); _obj.end(e); });

			return this;
		};
		function distanceSquaredToLineSegment2(lx1, ly1, ldx, ldy, lineLengthSquared, px, py){
			var t; // t===0 at line pt 1 and t ===1 at line pt 2
			if (!lineLengthSquared) {
			  // 0-length line segment. Any t will return same result
			  t = 0;
			}else{
			  t = ((px - lx1) * ldx + (py - ly1) * ldy) / lineLengthSquared;

			  if(t < 0) t = 0;
			  else if (t > 1) t = 1;
			}
			var lx = lx1 + t * ldx, ly = ly1 + t * ldy, dx = px - lx, dy = py - ly;
			return dx*dx + dy*dy;   
		}
		function distanceSquaredToLineSegment(lx1, ly1, lx2, ly2, px, py){
			var ldx = lx2 - lx1, ldy = ly2 - ly1, lineLengthSquared = ldx*ldx + ldy*ldy;
			return distanceSquaredToLineSegment2(lx1, ly1, ldx, ldy, lineLengthSquared, px, py);
		}
		function distanceToLineSegment(l1, l2, p){
			if(l1.x==l2.x && l1.y==l2.y){
				dx = (p.x - l1.x);
				dy = (p.y - l2.y);
				return Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2));
			}else{
				return Math.sqrt(distanceSquaredToLineSegment(l1.x, l1.y, l2.x, l2.y, p.x, p.y));
			}
		}
		root.Graph.prototype.makeDraggable = function(series,opt){
			var _obj = this;
			if(!opt) opt = {};

			if(!this._draggable) this._draggable = new Draggable(this);
			
			this._draggable.enable(series,opt);

			return this;
		};

	}
})(window || this);
