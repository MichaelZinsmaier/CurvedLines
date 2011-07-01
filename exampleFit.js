<div id="flotFit"></div>

<script id="source" language="javascript" type="text/javascript">
$(function () {
   var d1 = [[20,20], [42,60], [54, 30], [80,80]];
  
   var options = { series: {
						curvedLines: {
								active: true
						}
					},
					xaxis: { min:10, max: 100},
					yaxis: { min:10, max: 90}
   				};

    $.plot($("#flotFit"), [{data: d1, curvedLines: { show: true,  fit: true, fitPointDist: 0.000001, lineWidth: 3}}, {data: d1,  points: { show: true }}], options);
});
</script>