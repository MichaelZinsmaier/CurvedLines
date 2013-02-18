$(function() {

	//<div id="exampleFlotWithDates" style="width: 800px;height: 400px;"></div>

	var d1 = [[new Date(2000, 8, 1, 10), 20], [new Date(2000, 8, 1, 12), 60], [new Date(2000, 8, 1, 14), 30], [new Date(2000, 8, 1, 22), 80]];

	var options = {
		series : {
			curvedLines : {
				active : true
			}
		},
		xaxis : {
			mode : "time",
			minTickSize : [1, "hour"],
			min : (new Date(2000, 8, 1)),
			max : (new Date(2000, 8, 2))
		},
		yaxis : {
			min : 10,
			max : 90
		}
	};

	$.plot($("#exampleFlotWithDates"), [{
		data : d1,
		lines : {
			show : true
		},
		curvedLines : {
			apply : true,
		}
	}, {
		data : d1,
		points : {
			show : true
		}
	}], options);
});
