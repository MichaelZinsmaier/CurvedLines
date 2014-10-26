!function() {
	
	var TestSetup = function(div, lineParameter, replotFunctions) {
		div.append("<div id='normalParameters' class='parameterBox'></div>");
			$("#normalParameters").append("<input class='parameterInput' id='apply' type='checkbox' onchange='TestSetup.applyChanged()'>apply</input>");

		div.append("<div id='legacyParameters' class='parameterBox'></div>");
			$("#legacyParameters").append("<input class='parameterInput' id='useLegacy' type='checkbox' onchange='TestSetup.useLegacyChanged()'>use legacy options</input>");
			$("#legacyParameters").append("<input class='parameterInput' id='legacyFit' type='checkbox' onchange='TestSetup.legacyFitChanged()'>fit</input>");
			$("#legacyParameters").append("<input class='parameterInput' id='legacyPointFactor' type='text' onchange='TestSetup.legacyPointFactorChanged()'>point factor</input>");
			$("#legacyParameters").append("<input class='parameterInput' id='legacyFitPointDist' type='text' onchange='TestSetup.legacyFitPointDistChanged()'>fit point dist</input>");


		var parameter = lineParameter;			
		var changing = false;
		
		function replotAll(parameter, replotFunctions) {
			for (var i = 0; i < replotFunctions.length; i++)  {
				replotFunctions[i](parameter);
			}
		}
		
		function init(parameter) {
			if (changing) return;			
			changing = true;
			{
				var defaultParam = {
					active : false,
					apply : false,
					monotonicFit : false,
					tension : 0.0,
					legacyOverride : undefined
				};
								
				var combinedParam = jQuery.extend(defaultParam, parameter);
				
				if (combinedParam.legacyOverride == true) {
					combinedParam.legacyOverride = {
						fit : false,
						curvePointFactor : 20,
						fitPointDist : undefined
					};
					parameter.legacyOverride = {
						fit : false,
						curvePointFactor : 20,
						fitPointDist : undefined
					};

				}
			
				$("#apply").prop("checked", combinedParam.apply);
				
				var withLegacy = (typeof combinedParam.legacyOverride != 'undefined' && combinedParam.legacyOverride != false);
				var fit = withLegacy ? combinedParam.legacyOverride.fit : false;
				var pointFactor = withLegacy ? combinedParam.legacyOverride.curvePointFactor : '20';
				var fitDist = withLegacy ? combinedParam.legacyOverride.fitPointDist : '';
				
				$("#useLegacy").prop("checked", withLegacy);
				$("#legacyFit").prop("checked", fit);
				$("#legacyPointFactor").val(pointFactor);
				$("#legacyFitPointDist").val(fitDist);
							
				replotAll(parameter, replotFunctions);
			}
			changing = false;			
		}		
		
		TestSetup.applyChanged = function() {
			if (changing) return;			
			changing = true;
			{
				parameter.apply = $("#apply").prop("checked");
				replotAll(parameter, replotFunctions);
			}
			changing = false;
		};
		
		TestSetup.useLegacyChanged = function() {
			if (changing) return;			
			changing = true;
			{
				if ($("#useLegacy").prop("checked")) {
					parameter.legacyOverride = {
						fit : false,
						curvePointFactor : 20,
						fitPointDist : undefined
					};
				} else {
					parameter.legacyOverride = undefined;
				}		
						
				$("#legacyFit").prop("checked", false);
				$("#legacyPointFactor").val(20);
				$("#legacyFitPointDist").val('');
				replotAll(parameter, replotFunctions);
			}
			changing = false;
		};
		
		TestSetup.legacyFitChanged = function() {
			if (changing) return;			
			changing = true;
			{
				if ($("#useLegacy").prop("checked")) {
					parameter.legacyOverride.fit = $("#legacyFit").prop("checked");
					replotAll(parameter, replotFunctions);
				}
			}
			changing = false;
		};
		
		TestSetup.legacyPointFactorChanged = function() {
			if (changing) return;			
			changing = true;
			{
				if ($("#useLegacy").prop("checked")) {
					parameter.legacyOverride.curvePointFactor = $("#legacyPointFactor").val();
					replotAll(parameter, replotFunctions);
				}
			}
			changing = false;
		};
				
		TestSetup.legacyFitPointDistChanged = function() {
			if (changing) return;			
			changing = true;
			{
				if ($("#useLegacy").prop("checked")) {
					var text = $("#legacyFitPointDist").val();
					if (text == '') {
						parameter.legacyOverride.fitPointDist = undefined;
					} else {
						parameter.legacyOverride.fitPointDist = text;						
					}

					replotAll(parameter, replotFunctions);
				}
			}
			changing = false;
		};
				
		init(parameter);
	};

	this.TestSetup = TestSetup;
}();