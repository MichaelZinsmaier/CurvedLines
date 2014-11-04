### What it is ###

CurvedLines is a plugin for flot, which displays lines in a smooth curved way. This is achieved by adding additional points in between the "real" data points. See the test files for examples.
Feel free to add additional features and correct errors.

Regards Michael


### Hermite Splines v1.x.y ###

With the new version 1.x.y the original curve computation (nergal.dev's code) has been replaced by a new algorithm which computes hermite splines.
In general the result should be closer to the data however the old implementation is still accessible through the legacyOverride option.

The approximation with local third-degree polynoms solves some existing issues. The problematic parameters curvePointFactor and fitPointDist are not longer needed 
and I hope that the new nrSplinePoints parameter needs less manual adjustment (basically only if you use zooming or large segments) and is easier to understand.

The old fit option has been replaced with monotonicFit, which if set, enforces the use of the Fritsch-Carlson method (anti wiggle no overshooting / undershooting).
 
### Hands on ###

 * * * * * * * * * * * * * * * * * * * * * * * *
 how to use it:
 * * * * * * * * * * * * * * * * * * * * * * * * 
```
 var d1 = [[5,5],[7,3],[9,12]];
 var options = { series: { curvedLines: {  active: true }}};
 $.plot($("#placeholder"), [{data: d1, lines: { show: true}, curvedLines: {apply: true}}], options);
```
 
 * * * * * * * * * * * * * * * * * * * * * * * *
 options:
 * * * * * * * * * * * * * * * * * * * * * * * * 

| parameter      | type | effect                                                                                           |
|----------------|------|--------------------------------------------------------------------------------------------------|
| active         | bool | true => plugin can be used                                                                       |
| apply          | bool | true => series will be drawn as curved line                                                      |
| monotonicFit   | bool | true => uses monotone cubic interpolation (preserve monotonicity)                                |
| tension        | double  | [0,1] defines the tension parameter of the hermite spline interpolation (only if monotonicFit = false) |
| nrSplinePoints | int  | defines the number of sample points (of the spline) in between two consecutive points            |  

 deprecated options from curvedLines prior to 1.0.0:
 * * * * * * * * * * * * * * * * * * * * * * * *

to use the old curve computation algorithm with default parameters simply set legacyOverride to true

| parameter      | type | effect                                                                                                                                      |
|----------------|------|---------------------------------------------------------------------------------------------------------------------------------------------|
| legacyOverride | bool | true => use old default                                                                                                                     |

or to get more control set a parameter object with the old parameters as members

| parameter      | type | effect                                                                                                                                      |
|----------------|------|---------------------------------------------------------------------------------------------------------------------------------------------|
| fit            | bool | true => forces the max,mins of the curve to be on the datapoints                                                                            |
| curvePointFactor        | int  | defines how many "virtual" points are used per "real" data point to emulate the curvedLines (points total = real points * curvePointFactor) |
| fitPointDist   | double  | defines the x axis distance of the additional two points that are used to enforce the min max condition.                                    |

```
 ... lines: { show: true},
     curvedLines: {
                   apply: true,
                   legacyOverride: {
                                    fit: true
                                    }
                   } ...
```
