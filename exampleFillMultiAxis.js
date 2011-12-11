<div id="fillAndMultiAxis"></div>

<script id="source" language="javascript" type="text/javascript">
	$(function () {
    		
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
					{data: d1, curvedLines: { show: true, fill: true, fillColor: "#C3C3C3", lineWidth: 3}}, {data: d1,  points: { show: true }},
					{data: d2, curvedLines: { show: true, lineWidth: 3}, yaxis:2}, {data: d2,  points: { show: true }, yaxis:2}
				], options);
		});
</script>