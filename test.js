class TEST {
    constructor(ele_id) {
        this.ele_id = ele_id;
    }

    init() {
        let mySvg = document.getElementById(this.ele_id);
        this.centerX = mySvg.clientWidth/2;
        this.centerY = mySvg.clientHeight/2;       
        this.svg = d3.select('#'+this.ele_id);
    }

    test() {
        let svgDrawer = new SVGDrawer(this.ele_id, this.centerX, this.centerY);
        // boundary
        let centerR = 480;
        let spiralB = centerR/(2*Math.PI);
        let spiral1 = new Spiral(0, 1, 0);
        let spiral2 = new Spiral(0, 1, -120);
        let spiral3 = new Spiral(0, 1, -240);
        // NOTICE!!!
        let spiral4 = new Spiral(0, 1, -360);
        let circle1 = new Circle(0, 0, 50);
        let circle2 = new Circle(0, 0, centerR);
        svgDrawer.strokeSpiral(spiral1);
        svgDrawer.strokeSpiral(spiral2);
        svgDrawer.strokeSpiral(spiral3);
        svgDrawer.fillCircle(circle1, 'white', 1);
        svgDrawer.strokeCircle(circle2);
        // this.testBorderForce(svgDrawer, spiral1, spiral2, circle2, circle1);
        // this.testBorderForce(svgDrawer, spiral2, spiral3, circle2, circle1);
        // this.testBorderForce(svgDrawer, spiral3, spiral4, circle2, circle1);
        // this.testCircleForce(svgDrawer);
        // this.testTemporalForce(svgDrawer);
        // this.testForce(svgDrawer, spiral1, spiral2, circle1, circle2);
        // this.testForce(svgDrawer, spiral2, spiral3);
        // this.testForce(svgDrawer, spiral3, spiral4);

        this.testPacking(svgDrawer, spiral1, spiral2, circle1, circle2);

    }

    testBorderForce(drawer, lowerSpiral, upperSpiral, outerBorder, innerBorder) {
        // let borderCircle = new Circle(-55, 55, 20);
        // let borderCircle = new Circle(55, 55, 20);
        // let borderCircle = new Circle(284.25, 383.36, 27.49);
        // let borderCircle = new Circle(-40.84, -384.74, 15.05);
        let borderCircle = new Circle(282.68, 152.8, 19.6);
        let centerX = this.centerX;
        let centerY = this.centerY;
        let config = {
            border: {
                lowerBorder: lowerSpiral,
                upperBorder: upperSpiral,
                outerBorder: outerBorder,
                innerBorder: innerBorder,
            },
            borderWidth: 3,
            stepLength: 2,
            paddingTheta: 10,
            k: 5,
            centerR: 480
        };
        let testCircle = drawer.fillCircle(borderCircle);
        testCircle.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        function dragstarted(d) {
          d3.select(this).raise().classed("active", true);
        }

        function dragged(d) {
          let tmpX = d3.event.x - centerX;
          let tmpY = d3.event.y - centerY;
          d3.select(this).attr("cx", tmpX).attr("cy", tmpY);
          borderCircle.x = tmpX;
          borderCircle.y = tmpY;
        }

        function dragended(d) {
          borderCalculator.update(0);
          let tmpX = borderCircle.x;
          let tmpY = borderCircle.y;
          d3.select(this).classed("active", false)
            .attr('cx', tmpX)
            .attr('cy', tmpY);
        }

        // let borderCalculator = new BorderForceCalculator([borderCircle]);
        // borderCalculator.configure(config);
        // let borderCalculator = new BorderForceCalculator(config);
        // borderCalculator.loadData([borderCircle]);
        let borderCalculator = new BorderUpdator(config);
        borderCalculator.loadData([borderCircle]);

        let count = 0;

        // let testBorderEvent = setInterval(function() {
        //     // let displacement = borderCalculator.calForce(0);
        //     borderCalculator.update(0);
        //     count = count + 1;
        //     if (count == 10000) {
        //         clearInterval(testBorderEvent);
        //     }
        //     // console.log(count, displacement);
        //     // borderCircle.move(displacement);
        //     testCircle.transition()
        //         .attr('cx', borderCircle.x)
        //         .attr('cy', borderCircle.y)
        //         .duration(100);
        // }, 1000);
    }

    testCircleForce(svgDrawer) {
        let headCircle = new Circle(65, 58, 20);
        // let middCircle = new Circle(45, 45, 20);
        let middCircle = new Circle(90, 90, 20);
        let tailCircle = new Circle(27, 33, 20);
        let miniCircles = [headCircle, middCircle, tailCircle];
        let temporalCircle0 = svgDrawer.fillCircle(headCircle);
        let temporalCircle1 = svgDrawer.fillCircle(middCircle);
        let temporalCircle2 = svgDrawer.fillCircle(tailCircle);

        let config = {
            range: 5,
            padding: 1
        };

        // let circleCalculator = new CircleForceCalculator(miniCircles);
        // circleCalculator.configure(config);

        let forceLayout = new CirclesForceLayout(miniCircles, config);

        let count = 0;

        let testCircleEvent = setInterval(function() {
            // let displacement0 = circleCalculator.calForce(0);
            // headCircle.move(displacement0);
            // let displacement1 = circleCalculator.calForce(1);
            // middCircle.move(displacement1);
            // let displacement2 = circleCalculator.calForce(2);
            // tailCircle.move(displacement2);
            
            forceLayout.update();

            count = count + 1;
            
            if (count == 15) {
                clearInterval(testCircleEvent);
            }

            temporalCircle0.transition()
                .attr('cx', headCircle.x)
                .attr('cy', headCircle.y)
                .duration(100);

            temporalCircle1.transition()
                .attr('cx', middCircle.x)
                .attr('cy', middCircle.y)
                .duration(100);

            temporalCircle2.transition()
                .attr('cx', tailCircle.x)
                .attr('cy', tailCircle.y)
                .duration(100);

        }, 1000);

    }

    testTemporalForce(svgDrawer) {
        let headCircle = new Circle(65, 58, 20);
        let middCircle = new Circle(45, 45, 20);
        let tailCircle = new Circle(27, 33, 20);
        let miniCircles = [headCircle, middCircle, tailCircle];
        let temporalCircle0 = svgDrawer.fillCircle(headCircle);
        let temporalCircle1 = svgDrawer.fillCircle(middCircle);
        let temporalCircle2 = svgDrawer.fillCircle(tailCircle);

        let config = {
            padding: 2
        };

        // let temporalCalculator = new TemporalForceCalculator(miniCircles);
        // temporalCalculator.configure(config);
        let temporalUpdator = new TemporalUpdator(config);
        temporalUpdator.loadData(miniCircles);

        let count = 0;

        let testTemporalEvent = setInterval(function() {
            // let displacement0 = temporalCalculator.calForce(0);
            // let displacement1 = temporalCalculator.calForce(1);
            // let displacement2 = temporalCalculator.calForce(2);
            
            temporalUpdator.update(0);
            temporalUpdator.update(1);
            temporalUpdator.update(2);

            count = count + 1;
            // console.log(count, displacement1);
            
            if (count == 15) {
                clearInterval(testTemporalEvent);
            }
            
            // headCircle.move(displacement0);
            temporalCircle0.transition()
                .attr('cx', headCircle.x)
                .attr('cy', headCircle.y)
                .duration(100);

            // middCircle.move(displacement1);
            temporalCircle1.transition()
                .attr('cx', middCircle.x)
                .attr('cy', middCircle.y)
                .duration(100);

            // tailCircle.move(displacement2);
            temporalCircle2.transition()
                .attr('cx', tailCircle.x)
                .attr('cy', tailCircle.y)
                .duration(100);

        }, 1000);
    }

    testForce(svgDrawer, lowerSpiral, upperSpiral, innerBorder, outerBorder) {
        // let headCircle = new Circle(65, 58, 20);
        // let middCircle = new Circle(45, 45, 20);
        // let tailCircle = new Circle(27, 33, 20);

        let headCircle = new Circle(-65, 58, 15);
        let middCircle = new Circle(-45, 45, 20);
        let tailCircle = new Circle(-27, 33, 10);
        
        // let headCircle = new Circle(65, -58, 10);
        // let middCircle = new Circle(45, -45, 15);
        // let tailCircle = new Circle(27, -33, 20);

        let miniCircles = [headCircle, middCircle, tailCircle];
        let temporalCircle0 = svgDrawer.fillCircle(headCircle);
        let temporalCircle1 = svgDrawer.fillCircle(middCircle);
        let temporalCircle2 = svgDrawer.fillCircle(tailCircle);

        let config = {
            lowerSpiral: lowerSpiral,
            upperSpiral: upperSpiral,
            border: {
                lowerBorder: lowerSpiral,
                upperBorder: upperSpiral,
                innerBorder: innerBorder,
                outerBorder: outerBorder
            },
            borderWidth: 25,
            padding: 2,
        };

        // let temporalCalculator = new TemporalForceCalculator(miniCircles);
        // temporalCalculator.configure(config);

        // let circleCalculator = new CircleForceCalculator(miniCircles);
        // circleCalculator.configure(config);

        // let borderCalculator = new BorderForceCalculator(miniCircles);
        // borderCalculator.configure(config);

        let circlesUpdator = new CirclesUpdatingLayout(config);
        circlesUpdator.loadData(miniCircles);

        let count = 0;

        let testTemporalEvent = setInterval(function() {
            // let displacement0 = temporalCalculator.calForce(0);
            // let displacement1 = temporalCalculator.calForce(1);
            // let displacement2 = temporalCalculator.calForce(2);

            // let _displacement0 = circleCalculator.calForce(0);
            // let _displacement1 = circleCalculator.calForce(1);
            // let _displacement2 = circleCalculator.calForce(2);

            // let borderMove0 = borderCalculator.calForce(0);
            // let borderMove1 = borderCalculator.calForce(1);
            // let borderMove2 = borderCalculator.calForce(2);
            circlesUpdator.update();
            count = count + 1;
            
            if (count == 50) {
                clearInterval(testTemporalEvent);
            }
            
            // headCircle.move(displacement0);
            // headCircle.move(_displacement0);
            // headCircle.move(borderMove0);
            temporalCircle0.transition()
                .attr('cx', headCircle.x)
                .attr('cy', headCircle.y)
                .duration(100);

            // middCircle.move(displacement1);
            // middCircle.move(_displacement1);
            // middCircle.move(borderMove1);
            temporalCircle1.transition()
                .attr('cx', middCircle.x)
                .attr('cy', middCircle.y)
                .duration(100);

            // tailCircle.move(displacement2);
            // tailCircle.move(_displacement2);
            // tailCircle.move(borderMove2);
            temporalCircle2.transition()
                .attr('cx', tailCircle.x)
                .attr('cy', tailCircle.y)
                .duration(100);

        }, 1000);
    }

    testPacking(drawer, lowerSpiral, upperSpiral, innerBorder, outerBorder) {
        let circles = [];
        for (let i=0; i<100; i++) {
            let tmpCircle = this.genCircle(i);
            circles.push(tmpCircle);
        }

        let config = {
            'border': {
                'lowerBorder': lowerSpiral,
                'upperBorder': upperSpiral,
                'innerBorder': innerBorder,
                'outerBorder': outerBorder
            },
            'borderWidth': 3
        };

        let circlesPacker = new CirclesPacker(config);
        circlesPacker.packNodes(circles);

        let svgCircles = drawer.initCircles(circles, 'test');

    }

    genCircle(i) {
        return {
            't': 1,
            'radius': 20
        }
    }

    exit() {
        this.svg.remove();
    }

    run() {
        this.init();
        this.test();
    }

}
