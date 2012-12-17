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
define(['jquery','jquery.flot'],function(jQuery,jflot){

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

This is version 0.5 of curvedLines so it will probably not work in every case. However
the basic form of use descirbed next works (:
	
Feel free to further improve the code

____________________________________________________

how to use it:
____________________________________________________


	var d1 = [[5,5],[7,3],[9,12]];

	var options = { series: { curvedLines: {  active: true }}};
	

    $.plot($("#placeholder"), [{data = d1, lines: { show: true,curved:true}}], options);
  
_____________________________________________________

options:
_____________________________________________________

	
	active:           bool true => plugin can be used
	curved:           bool true => series will be drawn as curved line
	fit:              bool true => forces the max,mins of the curve to be on the datapoints
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
 *  v0.5   completly rewritten to let flot do the hard work. CurvedLines usage changed and will require code change but is more straightforward to use for new users (so all flot lines options (gradient fill, shadow are now supported)
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

	//if the plugin is active register processDatapoints method
        function processOptions(plot,options) {
        	if (options.series.curvedLines.active) {

        		plot.hooks.processDatapoints.push(processDatapoints);

            }
        }
        
        function processDatapoints(plot, series, datapoints) {
	  if (series.lines.curved==true){
	    if (series.lines.fill){
		
	      var pointsTop=calculateCurvePoints2(datapoints, series.curvedLines,1);
	      
	      //Make sure we've got a second y point for filling area
	      for (var j=0;j<datapoints.length;j+=3){
		if (data[j]==null) data[j]=series.yaxis.min; //If second y point is null, let it be zero (else no curve !)
	      }
	      var pointsBottom = calculateCurvePoints2(datapoints, series.curvedLines,2);
	      
	      //Merge top and bottom curve
	      datapoints.pointsize=3;
	      datapoints.points=[];
	      var j=0;
	      var k=0;
	      var i=0;
	      var ps=2;
	      while (i<pointsTop.length || j<pointsBottom.length){
		if (pointsTop[i]==pointsBottom[j]){
		  datapoints.points[k]=pointsTop[i];
		  datapoints.points[k+1]=pointsTop[i+1];
		  datapoints.points[k+2]=pointsBottom[j+1];
		  j+=ps;
		  i+=ps;
		  
		}else if (pointsTop[i]<pointsBottom[j]){
		  datapoints.points[k]=pointsTop[i];
		  datapoints.points[k+1]=pointsTop[i+1];
		  datapoints.points[k+2]=null;
		  i+=ps;
		}else{
		  datapoints.points[k]=pointsBottom[j];
		  datapoints.points[k+1]=null;
		  datapoints.points[k+2]=pointsBottom[j+1];
		  j+=ps;
		}
		k+=3;
	      }
	      
	      
	      
	
	      if (series.lines.lineWidth>0){ //Let's draw line in separate series
		var newSerie=$.extend({},series);
		newSerie.lines=$.extend({},series.lines);
		newSerie.lines.fill=undefined;
		newSerie.label=undefined;
		newSerie.lines.curved=false; //Don't redo curve point calculation as datapoint is copied to this new serie
		//We find our series to add the line just after the fill (so other series you wanted above this one will still be)
		var allSeries=plot.getData();
		for (i=0;i<allSeries.length;i++){
		  if (allSeries[i]==series){
		    plot.getData().splice(i+1,0,newSerie);
		    break;
		  }
		}
		
		series.lines.lineWidth=0;
	      }
		
	    }else if (series.lines.lineWidth>0){
	      datapoints.points=calculateCurvePoints2(datapoints, series.curvedLines,1);
	      datapoints.pointsize=2;
	    }
	  }
	}
             
        

	//no real idea whats going on here code mainly from https://code.google.com/p/flot/issues/detail?id=226
	//I don't understand what nergal computes here and to be honest I didn't even try
        function calculateCurvePoints2(datapoints, curvedLinesOptions,yPos) {

	    var points = datapoints.points, ps = datapoints.pointsize;
    	    var num = curvedLinesOptions.curvePointFactor * (points.length/ps);
	    
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

		    for (var i = 0; i < points.length; i+=ps) {

			    var front = new Array;
			    var back = new Array;
			    var curX=i;
			    var curY=i+yPos;

			    //smooth front
			    front[X] = points[curX] - 0.1;
			    if (i >= ps) {
				    front[Y] = points[curY-ps] * neigh + points[curY] * (1 - neigh);
			    } else {
				    front[Y] = points[curY];
			    }


			    //smooth back
			    back[X] = points[curX] + 0.1;
			    if ((i + ps) < points.length) {
				    back[Y] = points[curY+ps] * neigh + points[curY] * (1 - neigh);
			    } else {
				    back[Y] = points[curY];
			    }

			    //test for a saddle
			    if ((front[Y] <= points[curY] && back[Y] <= points[curY]) || //max or partial horizontal
				    (front[Y] >= points[curY] && back[Y] >= points[curY])) {  //min or partial horizontal
			      
					    //add curve points
					    xdata[j] = front[X];
					    ydata[j] = front[Y];
					    j++;

					    xdata[j] = points[curX];
					    ydata[j] = points[curY];
					    j++;

					    xdata[j] = back[X];
					    ydata[j] = back[Y];
					    j++;						
			    } else { //saddle
				    //use original point only
				    xdata[j] = points[curX];
				    ydata[j] = points[curY];
				    j++;
			    }


		    }
	    } else {
		    //just use the datapoints
		    for (var i = 0; i < data.length; i++) {
			    xdata[i] = points[curX];
			    ydata[i] = points[curY];
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
        version: '0.5'
    });
    
    
})(jQuery);
  
return jQuery.plot.plugincurvedLines;

});
