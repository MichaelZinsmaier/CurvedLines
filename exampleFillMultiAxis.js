	$(function () {
    		
    	//<div id="fillAndMultiAxis" style="width: 800px;height: 400px;"></div>
    		
    	var d1 = [[20,20], [42,60], [54, 20], [80,80]];
    	var d2 = [[20,700], [80,300]];
  
		var options = { series: {
							 curvedLines: {
								 	 active: true 
							 }
					 },
						axis: { min:10, max: 100},
						yaxes: [{ min:10, max: 90}, { position: 'right'}]
   					};
									
		$.plot($("#fillAndMultiAxis"), 
				[
					{data: d1, lines: { show: true, fill: true, fillColor: "#C3C3C3", lineWidth: 3}, curvedLines: {apply:true}}, {data: d1,  points: { show: true }},
					{data: d2, lines: { show: true, lineWidth: 3}, curvedLines: {apply:true}, yaxis:2}, {data: d2,  points: { show: true }, yaxis:2}
				], options);
		});