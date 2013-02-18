$(function () {
  
  //<div id="flotFit" style="width: 800px;height: 400px;"></div>
  
   var d1 = [[20,20], [42,60], [54, 30], [80,80]];
  
   var options = { series: {
						curvedLines: {
								active: true
						}
					},
					xaxis: { min:10, max: 100},
					yaxis: { min:10, max: 90}
   				};

    $.plot($("#flotFit"), [{data: d1, lines: { show: true, lineWidth: 3}, curvedLines: {apply:true, fit: true, fitPointDist: 0.000001}}, {data: d1,  points: { show: true }}], options);
});