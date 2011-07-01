<div id="flotOrig"></div>

<script id="source" language="javascript" type="text/javascript">
$(function () {
    		
    	var d1 = [[20,20], [42,60], [54, 20], [80,80]];
  
		var options = { series: {
							curvedLines: {
										active: true
							}
						},
						axis: { min:10, max: 100},
						yaxis: { min:10, max: 90}
   						};
									
		$.plot($("#flotOrig"), [{data: d1, curvedLines: { show: true, lineWidth: 3}}, {data: d1,  points: { show: true }}], options);
});
</script>