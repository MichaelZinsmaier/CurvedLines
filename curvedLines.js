define(['jquery','jquery.flot'],function(jQuery,jflot){
/* The MIT License

Copyright (c) 2011 by Michael Zinsmaier and nergal.dev
Copyright (c) 2012 by Thomas Ritou

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/


/*

____________________________________________________

what it is:
____________________________________________________

curvedLines is a plugin for flot, that tries to display lines in a smoother way.
The plugin is based on nergal.dev's work https://code.google.com/p/flot/issues/detail?id=226
and further extended with a mode that forces the min/max points of the curves to be on the
points. Both modes are achieved through adding of more data points
=> 1) with large data sets you may get trouble
=> 2) if you want to display the points too, you have to plot them as 2nd data series over the lines

This is version 0.4 of curvedLines so it will probably not work in every case. However
the basic form of use descirbed next works (:
	
Feel free to further improve the code

____________________________________________________

how to use it:
____________________________________________________


	var d1 = [[5,5],[7,3],[9,12]];

	var options = { series: { curvedLines: {  active: true }}};
	

    $.plot($("#placeholder"), [{data = d1, curvedLines: { show: true}}], options);
  
_____________________________________________________

options:
_____________________________________________________

	fill: 			  bool true => lines get filled
	fillColor: 		  null or the color that should be used for filling 
	active:           bool true => plugin can be used
	show:             bool true => series will be drawn as curved line
	fit:              bool true => forces the max,mins of the curve to be on the datapoints
	lineWidth:        int  width of the line
	curvePointFactor  int  defines how many "virtual" points are used per "real" data point to
						   emulate the curvedLines
	fitPointDist:      int  defines the x axis distance of the additional two points that are used
						   to enforce the min max condition. (you will get curvePointFactor * 3 * |datapoints|
						   "virtual" points if fit is true) 
	
  
*/

/* 
 *  v0.1   initial commit
 *  v0.15  negative values should work now (outcommented a negative -> 0 hook hope it does no harm)
 *  v0.2   added fill option (thanks to monemihir) and multi axis support (thanks to soewono effendi)
 *  v0.3   improved saddle handling and added basic handling of Dates
 *  v0.4   rewritten fill option (thomas ritou) mostly from original flot code (now fill between points rather than to graph bottom), corrected fill Opacity bug
 * 
 */

(function ($) {
    
    
    
    var options = { series: { curvedLines: {  active: false,
    										  show: false,
    										  fit: false,
    										  fill: false,
    										  fillColor: null,
    										  lineWidth: 2,
    										  curvePointFactor: 20,
    										  fitPointDist: 0.0001
    									   }}};
    									   
        
    function init(plot) {

        plot.hooks.processOptions.push(processOptions);

		//if the plugin is active register draw method
        function processOptions(plot,options) {
        	if (options.series.curvedLines.active) {
        		plot.hooks.draw.push(draw);
            }
        }
             
             
        //select the data sets that should be drawn with curved lines and draws them     
        function draw(plot, ctx)  {
        	var series;           
            var sdata = plot.getData();
            var offset = plot.getPlotOffset();
            
            for (var i = 0; i < sdata.length; i++) {
                 series = sdata[i];
                 if (series.curvedLines.show) {
                     
                     axisx = series.xaxis;
        			 axisy = series.yaxis;
        	        	
	   	        	 ctx.save();
            		 ctx.translate(offset.left, offset.top);
                     ctx.lineJoin = "round";
			         ctx.strokeStyle = series.color;
				 
				 ctx.lineWidth = series.curvedLines.lineWidth;
        	         
			
			 var points,data;
			 if(series.curvedLines.fill || series.curvedLines.lineWidth) {
			   
			   //convenience check for x or y values if they are Dates if so apply .getTime()
			  //only check on first value mixing numeric and Date fields in one input array is not allowed
			  if ('map' in Array.prototype && (series.data[0][0] instanceof Date || series.data[0][1] instanceof Date)) {
				  data = series.data.map(getTimeFromDate);
			  } else {
				  //default case
				  data = series.data;
			  }
			   
			  points= calculateCurvePoints(data, series.curvedLines,1);
			 }
                     if(series.curvedLines.fill) {
                         var fillColor = series.curvedLines.fillColor == null ? series.color : series.curvedLines.fillColor;
                          var c = $.color.parse(fillColor);
                          c.a = typeof series.curvedLines.fill == "number" ? series.curvedLines.fill : 0.4;
                          c.normalize();
			         ctx.fillStyle = c.toString();
			//Make sure we've got a second y point for filling area
			for (var j=0;j<data.length;j++){
			  if (data[j].length==2) data[j][2]=0;
			 }
			 
			  var pointsFill = calculateCurvePoints(data, series.curvedLines,2);
			  
			  plotLineArea(ctx,points,pointsFill,axisx,axisy);
                     }
			 
			 if (series.curvedLines.lineWidth>0)
			    plotLine(ctx, points, axisx, axisy,2);     		         
      		         ctx.restore();	
        		}
            }
        }
        
        //helper method that convertes Dates to a numeric representation
		function getTimeFromDate(timeElement) {
			var xVal = timeElement[0];
			var yVal = timeElement[1];
			var ret = new Array;

			if (timeElement[0] instanceof Date) {
				ret[0] = xVal.getTime();
			} else {
				ret[0] = xVal;
			}

			if (timeElement[1] instanceof Date) {
				ret[1] = yVal.getTime();
			} else {
				ret[1] = yVal;
			}

			return ret;
		}
        
        function plotLineArea(ctx,points2,points3, axisx, axisy) {
                var points = points2,
                    ps = 2,
                    bottom = Math.min(Math.max(0, axisy.min), axisy.max),
                    i = 0, top, areaOpen = false,
                    ypos = 1, segmentStart = 0, segmentEnd = 0;

                // we process each segment in two turns, first forward
                // direction to sketch out top, then once we hit the
                // end we go backwards to sketch the bottom
                while (true) {
                    if (ps > 0 && i > points.length + ps)
                        break;

                    i += ps; // ps is negative if going backwards

                    var x1 = points[i - ps],
                        y1 = points[i - ps + ypos],
                        x2 = points[i], y2 = points[i + ypos];

                    if (areaOpen) {
                        if (ps > 0 && x1 != null && x2 == null) {
                            // at turning point
                            segmentEnd = i;
                            ps = -ps;
                            ypos = 1;
			    points=points3;
                            continue;
                        }

                        if (ps < 0 && i == segmentStart + ps) {
                            // done with the reverse sweep
                            ctx.fill();
                            areaOpen = false;
                            ps = -ps;
                            ypos = 1;
			    points=points2;
                            i = segmentStart = segmentEnd + ps;
                            continue;
                        }
                    }

                    if (x1 == null || x2 == null)
                        continue;

                    // clip x values
                    
                    // clip with xmin
                    if (x1 <= x2 && x1 < axisx.min) {
                        if (x2 < axisx.min)
                            continue;
                        y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.min;
                    }
                    else if (x2 <= x1 && x2 < axisx.min) {
                        if (x1 < axisx.min)
                            continue;
                        y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.min;
                    }

                    // clip with xmax
                    if (x1 >= x2 && x1 > axisx.max) {
                        if (x2 > axisx.max)
                            continue;
                        y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.max;
                    }
                    else if (x2 >= x1 && x2 > axisx.max) {
                        if (x1 > axisx.max)
                            continue;
                        y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.max;
                    }

                    if (!areaOpen) {
                        // open area
                        ctx.beginPath();
                        ctx.moveTo(axisx.p2c(x1), axisy.p2c(bottom));
                        areaOpen = true;
                    }
                    
                    // now first check the case where both is outside
                    if (y1 >= axisy.max && y2 >= axisy.max) {
                        ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.max));
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.max));
                        continue;
                    }
                    else if (y1 <= axisy.min && y2 <= axisy.min) {
                        ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.min));
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.min));
                        continue;
                    }
                    
                    // else it's a bit more complicated, there might
                    // be a flat maxed out rectangle first, then a
                    // triangular cutout or reverse; to find these
                    // keep track of the current x values
                    var x1old = x1, x2old = x2;

                    // clip the y values, without shortcutting, we
                    // go through all cases in turn
                    
                    // clip with ymin
                    if (y1 <= y2 && y1 < axisy.min && y2 >= axisy.min) {
                        x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.min;
                    }
                    else if (y2 <= y1 && y2 < axisy.min && y1 >= axisy.min) {
                        x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.min;
                    }

                    // clip with ymax
                    if (y1 >= y2 && y1 > axisy.max && y2 <= axisy.max) {
                        x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.max;
                    }
                    else if (y2 >= y1 && y2 > axisy.max && y1 <= axisy.max) {
                        x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.max;
                    }

                    // if the x value was changed we got a rectangle
                    // to fill
                    if (x1 != x1old) {
                        ctx.lineTo(axisx.p2c(x1old), axisy.p2c(y1));
                        // it goes to (x1, y1), but we fill that below
                    }
                    
                    // fill triangular section, this sometimes result
                    // in redundant points if (x1, y1) hasn't changed
                    // from previous line to, but we just ignore that
                    ctx.lineTo(axisx.p2c(x1), axisy.p2c(y1));
                    ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));

                    // fill the other rectangle if it's there
                    if (x2 != x2old) {
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));
                        ctx.lineTo(axisx.p2c(x2old), axisy.p2c(y2));
                    }
                }
            }
            
        
        //nearly the same as in the core library
		function plotLine(ctx, points, axisx, axisy,ps) {
			
            var prevx = null;
            var prevy = null;

            ctx.beginPath();
            
            for (var i = ps; i < points.length; i += ps) {
                 var x1 = points[i - ps], y1 = points[i - ps + 1];
                 var x2 = points[i], y2 = points[i + 1];

                 if (x1 == null || x2 == null)
                     continue;

                 // clip with ymin
                 if (y1 <= y2 && y1 < axisy.min) {
                 if (y2 < axisy.min)
                       continue;   // line segment is outside
                 // compute new intersection point
                 x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                 y1 = axisy.min;
                 }
                 else if (y2 <= y1 && y2 < axisy.min) {
                     if (y1 < axisy.min)
                        continue;
                     x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                     y2 = axisy.min;
                 }

                 // clip with ymax
                 if (y1 >= y2 && y1 > axisy.max) {
                     if (y2 > axisy.max)
                         continue;
                     x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                     y1 = axisy.max;
                 }
                 else if (y2 >= y1 && y2 > axisy.max) {
                     if (y1 > axisy.max)
                         continue;
                     x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                     y2 = axisy.max;
                 }

                 // clip with xmin
                 if (x1 <= x2 && x1 < axisx.min) {
                     if (x2 < axisx.min)
                         continue;
                     y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                     x1 = axisx.min;
                 }
                 else if (x2 <= x1 && x2 < axisx.min) {
                     if (x1 < axisx.min)
                         continue;
                     y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                     x2 = axisx.min;
                 }

                 // clip with xmax
                 if (x1 >= x2 && x1 > axisx.max) {
                     if (x2 > axisx.max)
                         continue;
                     y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                     x1 = axisx.max;
                 }
                 else if (x2 >= x1 && x2 > axisx.max) {
                     if (x1 > axisx.max)
                         continue;
                     y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                     x2 = axisx.max;
                 }

                 if (x1 != prevx || y1 != prevy)
                     ctx.lineTo(axisx.p2c(x1), axisy.p2c(y1));

  
                 prevx = x2;
                 prevy = y2;
                ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));
             }
 
             ctx.stroke();
		}


		//no real idea whats going on here code mainly from https://code.google.com/p/flot/issues/detail?id=226
		//I don't understand what nergal computes here and to be honest I didn't even try
        function calculateCurvePoints(data, curvedLinesOptions,yPos) {

    	    var num = curvedLinesOptions.curvePointFactor * data.length;
            var xdata = new Array;
            var ydata = new Array;

	    var X = 0;
	    var Y = yPos;

	    if (curvedLinesOptions.fit) {
		    //insert a point before and after the "real" data point to force the line
		    //to have a max,min at the data point however only if it is a lowest or highest point of the
		    //curve => avoid saddles
		    var neigh = curvedLinesOptions.fitPointDist;
		    var j = 0;

		    for (var i = 0; i < data.length; i++) {

			    var front = new Array;
			    var back = new Array;

			    //smooth front
			    front[X] = data[i][X] - 0.1;
			    if (i > 0) {
				    front[Y] = data[i-1][Y] * neigh + data[i][Y] * (1 - neigh);
			    } else {
				    front[Y] = data[i][Y];
			    }


			    //smooth back
			    back[X] = data[i][X] + 0.1;
			    if ((i + 1) < data.length) {
				    back[Y] = data[i+1][Y] * neigh + data[i][Y] * (1 - neigh);
			    } else {
				    back[Y] = data[i][Y];
			    }

			    //test for a saddle
			    if ((front[Y] <= data[i][Y] && back[Y] <= data[i][Y]) || //max or partial horizontal
				    (front[Y] >= data[i][Y] && back[Y] >= data[i][Y])) {  //min or partial horizontal
			      
					    //add curve points
					    xdata[j] = front[X];
					    ydata[j] = front[Y];
					    j++;

					    xdata[j] = data[i][X];
					    ydata[j] = data[i][Y];
					    j++;

					    xdata[j] = back[X];
					    ydata[j] = back[Y];
					    j++;						
			    } else { //saddle
				    //use original point only
				    xdata[j] = data[i][X];
				    ydata[j] = data[i][Y];
				    j++;
			    }


		    }
	    } else {
		    //just use the datapoints
		    for (var i = 0; i < data.length; i++) {
			    xdata[i] = data[i][X];
			    ydata[i] = data[i][Y];
		    }
	    }

            var n = xdata.length;

            var y2 = new Array();
            var delta = new Array();
            y2[0] = 0;
            y2[n - 1] = 0;
            delta[0] = 0;

            for(var i = 1; i < n - 1; ++i) {
                var d = (xdata[i + 1] - xdata[i - 1]);
                if(d == 0) {
                    return null;
                }

                var s = (xdata[i] - xdata[i - 1]) / d;
                var p = s * y2[i - 1] + 2;
                y2[i] = (s - 1) / p;
                delta[i] = (ydata[i + 1] - ydata[i]) / (xdata[i + 1] - xdata[i]) - (ydata[i] - ydata[i - 1]) / (xdata[i] - xdata[i - 1]);
                delta[i] = (6 * delta[i] / (xdata[i + 1] - xdata[i - 1]) - s * delta[i - 1]) / p;
           }

           for(var j = n - 2; j >= 0; --j) {
               y2[j] = y2[j] * y2[j + 1] + delta[j];
           }

           var step = (xdata[n - 1] - xdata[0]) / (num - 1);
           
           var xnew = new Array;
           var ynew = new Array;
           var result = new Array;

           xnew[0] = xdata[0];
           ynew[0] = ydata[0];


           for(j = 1; j < num; ++j) {
               xnew[j] = xnew[0] + j * step;

               var max = n - 1;
               var min = 0;

               while(max - min > 1) {
                   var k = Math.round((max + min) / 2);
                   if(xdata[k] > xnew[j]) {
                       max = k;
                   } else {
                       min = k;
                   }
               }

               var h = (xdata[max] - xdata[min]);

               if(h == 0) {
                    return null;
               }

               var a = (xdata[max] - xnew[j]) / h;
               var b = (xnew[j] - xdata[min]) / h;

               ynew[j] = a * ydata[min] + b * ydata[max] + ((a * a * a - a) * y2[min] + (b * b * b - b) * y2[max]) * (h * h) / 6;
//               if (ynew[j] < 0.01){
//                   ynew[j] = 0;
//               }
	       result.push(xnew[j]);
               result.push(ynew[j]);
            }

            return result;  	
        }




    }//end init

    $.plot.plugincurvedLines=true;

    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'curvedLines',
        version: '0.4'
    });
    
    
})(jQuery);
  
return jQuery.plot.plugincurvedLines;

});
