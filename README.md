## What it is ##

CurvedLines is a plugin for flot, which displays lines in a smooth curved way. This is achieved by adding additional points in between the "real" data points. See the test files for examples.
Feel free to add additional features and correct errors.

Regards Michael


## Hermite Splines v1.x.y ##

With the new version 1.x.y the original curve computation (nergal.dev's code) has been replaced by a new algorithm which computes hermite splines.
In general the result should be closer to the data however the old implementation is still accessible through the legacyOverride option.

The approximation with local third-degree polynoms solves some existing issues. The problematic parameters curvePointFactor and fitPointDist are both gone
and I hope that the new nrSplinePoints needs less manual adjustment (basically only wiht zoom) and is easier to understand.

The old fit option has been replaced with monotonicFit, which if set, enforces the use of the Fritsch-Carlson method (anti wiggle no overshooting / undershooting).
 
## Hands on ##

 how to use it:
 ____________________________________________________

 var d1 = [[5,5],[7,3],[9,12]];

 var options = { series: { curvedLines: {  active: true }}};

 $.plot($("#placeholder"), [{data: d1, lines: { show: true}, curvedLines: {apply: true}}], options);

 _____________________________________________________

 options:
 _____________________________________________________

 active:           bool true => plugin can be used
 apply:            bool true => series will be drawn as curved line
 monotonicFit:	    bool true => uses monotone cubic interpolation (preserve monotonicity)
 tension:          int          defines the tension parameter of the hermite spline interpolation (no effect if monotonicFit is set)
 nrSplinePoints:   int 			      defines the number of sample points (of the spline) in between two consecutive points

 deprecated options from flot prior to 1.0.0:
 ------------------------------------------------
 legacyOverride	   bool true => use old default
    OR
 legacyOverride    optionArray
 {
 	 fit: 	             bool true => forces the max,mins of the curve to be on the datapoints
 	 curvePointFactor	  int  		      defines how many "virtual" points are used per "real" data point to
 	                									        emulate the curvedLines (points total = real points * curvePointFactor)
  	fitPointDist: 	    int       	 	defines the x axis distance of the additional two points that are used
  						   		   	                  to enforce the min max condition.
  }
