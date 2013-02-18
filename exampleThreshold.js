$(function () {
    		
    	//<div id="flotOrig" style="width: 800px;height: 400px;"></div>
	
    		
    	var d1 = [[20,20], [42,60], [54, 20], [80,80]];
  
		var options = { series: {
							curvedLines: {
										active: true
							},
							threshold: { below: 40, color: "rgb(0, 0, 0)" }
						},
						axis: { min:10, max: 100},
						yaxis: { min:10, max: 90}
   						};
									
		$.plot($("#flotOrig"), [{data: d1, lines: { show: true, lineWidth: 3}, curvedLines: {apply:true}}, {data: d1,  points: { show: true }}], options);
});