class CirclesUpdatingLayout {
    constructor(config) {
        this.numberOfUpdatingPasses = 1;
        this.borderUpdator = new BorderUpdator(config);
        this.circleUpdator = new CircleUpdator(config);
        this.temporalUpdator = new TemporalUpdator(config);
    }

    loadData(circles) {
        this.circles = circles;
        this.borderUpdator.loadData(circles);
        this.circleUpdator.loadData(circles);
        this.temporalUpdator.loadData(circles);
    }

    update() {
        for (let k=0; k<this.numberOfUpdatingPasses; k++) {
            this.updateCirclesInOnePass();
        }
    }

    updateCirclesInOnePass() {
        for (let i=0, len=this.circles.length; i<len; i++) {
            this.circleUpdator.update(i);
            this.borderUpdator.update(i);
            this.temporalUpdator.update(i);
        }
    }

}



class Calculator {
    constructor(config) {
        this.config = config;
        this.origin = new Vector(0, 0);
    }

    // distance between two points.
    static distance(point1, point2) {
        let dx = point2.x - point1.x;
        let dy = point2.y - point1.y;
        return Math.hypot(dx, dy);
    }

    // angle between the vector p1->p2 and horizontal axis, which ranges from 0 to 2PI.
    static angle(point1, point2) {
        let dx = point2.x - point1.x;
        let dy = point2.y - point1.y;
        let angle = Math.atan2(dy, dx);
        if (angle < 0) {
            angle = angle + 2 * Math.PI;
        }
        return angle;
    }
}


class CircleUpdator extends Calculator {
    loadData(circles) {
        this.circles = circles;
        this.padding = 2;
    }

    update(circleID) {
        let circle = this.circles[circleID];
        for (let i=0, len=this.circles.length; i<len; i++) {
            if (i == circleID) continue;
            let tmpCircle = this.circles[i];
            this.updateTwoCircles(circle, tmpCircle);
        }
    }

    updateTwoCircles(circleX, circleY) {
        let distXY = Calculator.distance(circleX, circleY);
        let forceMag = (circleX.radius + circleY.radius) + this.padding - distXY;
        if (forceMag > 0) {
            let movingRatioOfX = this.calMovingRatio(circleX, circleY);
            let forceMagOfX = forceMag * movingRatioOfX;
            let forceMagOfY = forceMag - forceMagOfX;
            let forceDirOfX = Calculator.angle(circleY, circleX);
            let forceDirOfY = Calculator.angle(circleX, circleY);
            let forceOfX = new Force(forceMagOfX, forceDirOfX);
            circleX.move(forceOfX);
            let forceOfY = new Force(forceMagOfY, forceDirOfY);
            circleY.move(forceOfY);
        }
    }

    calMovingRatio(circleX, circleY) {
        var circleXRadiusSquare = Math.pow(circleX.radius, 2);
        var circleYRadiusSquare = Math.pow(circleY.radius, 2);
        var total = circleXRadiusSquare + circleYRadiusSquare;
        return circleYRadiusSquare / total;
    }

}


class BorderUpdator extends Calculator {
    constructor(config) {
        super(config);
        this.scale = 180 / Math.PI;
        this.lowerBorder = this.config.border.lowerBorder;
        this.upperBorder = this.config.border.upperBorder;
        this.lowerT = Math.abs(this.lowerBorder.t);
        this.upperT = Math.abs(this.upperBorder.t);
        this.outerR = this.config.border.outerBorder.radius;
        this.innerR = this.config.border.innerBorder.radius;
        this.midline = this.genMidline();
    }

    genMidline() {
        var a = this.lowerBorder.a;
        var b = this.lowerBorder.b;
        var t = 0;
        let middleT = (this.lowerT+this.upperT) / 2 + 180;
        if (middleT >= 360) {
            t = 360 - middleT;
        } else {
            t = -middleT;
        }
        return new Spiral(a, b, t);
    }

    loadData(circles) {
        this.circles = circles;
    }

    update(circleID) {
        let circle = this.circles[circleID];
        this.distOfCircle = Calculator.distance(this.origin, circle);
        this.angleOfCircle = Calculator.angle(this.origin, circle) * this.scale;
        let outerBorderForce = this.calOuterBorderForce(circle);
        circle.move(outerBorderForce);
        let lowerBorderForce = this.calLowerBorderForce(circle);
        circle.move(lowerBorderForce);
        let upperBorderForce = this.calUpperBorderForce(circle);
        circle.move(upperBorderForce);
        let innerBorderForce = this.calInnerBorderForce(circle);
        circle.move(innerBorderForce);
    }

    calLowerBorderForce(circle) {
        let borderWidth = this.config.borderWidth;

        let distOfCircle = this.distOfCircle;
        let angle = this.angleOfCircle;
        let distOfBorder = this.lowerBorder.getRadius(angle);

        // true - inside the border
        // false - outside the border
        let flag = true;
        
        if (distOfCircle+circle.radius+borderWidth > distOfBorder) {
            flag = false;
        }

        if (angle > this.lowerT && angle < this.upperT) {
            let distOfMidline = this.midline.getRadius(angle);
            if (distOfCircle > distOfMidline && distOfCircle < this.outerR) {
                flag = true;
            }
        }
        
        let forceMag = 0;
        let forceDir = 0;

        if (!flag) {
            forceMag = distOfCircle+circle.radius+borderWidth - distOfBorder;
            forceDir = Calculator.angle(circle, this.origin);
        }

        return new Force(forceMag, forceDir);
    }

    calUpperBorderForce(circle) {
        let borderWidth = this.config.borderWidth;

        let distOfCircle = this.distOfCircle;
        let angle = this.angleOfCircle;
        let distOfBorder = this.upperBorder.getRadius(angle);

        let flag = true;

        if (distOfCircle < distOfBorder+circle.radius+borderWidth) {
            flag = false;
        }

        if (angle > this.lowerT && angle < this.upperT) {
            let distOfMidline = this.midline.getRadius(angle);
            if (distOfCircle < distOfMidline) {
                flag = true;
            }
        }

        let forceMag = 0;
        let forceDir = 0;

        if (!flag) {
            forceMag = distOfBorder + circle.radius + borderWidth - distOfCircle;
            forceDir = angle / this.scale;
        }

        return new Force(forceMag, forceDir);
    }

    calInnerBorderForce(circle) {
        let innerR = this.innerR;
        let distOfCircle = this.distOfCircle;
        var forceMag = innerR + circle.radius - distOfCircle;
        if (forceMag > 0) {
            var forceDir = this.angleOfCircle / this.scale;
        } else {
            forceMag = 0;
            forceDir = 0;
        }
        return new Force(forceMag, forceDir);
    }

    calOuterBorderForce(circle) {
        let outerR = this.outerR;
        let distOfCircle = this.distOfCircle;
        var forceMag = distOfCircle + circle.radius - outerR;
        if (forceMag > 0) {
            var forceDir = Calculator.angle(circle, this.origin);
        } else {
            forceMag = 0;
            forceDir = 0;
        }
        return new Force(forceMag, forceDir);
    }
}


class TemporalUpdator extends Calculator {
    loadData(circles) {
        this.circles = circles;
    }

    update(circleID) {
        var preNode, curNode, latNode;
        if (circleID == 0) {
            curNode = this.circles[circleID];
            latNode = this.circles[circleID+1];
            this.updateHeadAndTailCircles(curNode, latNode);
        } else if (circleID == this.circles.length-1) {
            preNode = this.circles[circleID-1];
            curNode = this.circles[circleID];
            this.updateHeadAndTailCircles(preNode, curNode);
        } else {
            preNode = this.circles[circleID-1];
            curNode = this.circles[circleID];
            latNode = this.circles[circleID+1];
            this.updateHeadAndTailCircles(preNode, curNode);
            this.updateHeadAndTailCircles(curNode, latNode);
        }
    }

    updateHeadAndTailCircles(headNode, tailNode) {
        let padding = this.config.padding;
        var headNodeDist = Calculator.distance(this.origin, headNode);
        var tailNodeDist = Calculator.distance(this.origin, tailNode);
        var deltaDist = headNodeDist - tailNodeDist + padding;
        if (deltaDist > 0) {
            var movingRatioOfHeadNode = this.calMovingRatio(headNode, tailNode);
            var forceMagOfHeadNode = deltaDist * movingRatioOfHeadNode;
            var forceDirOfHeadNode = Calculator.angle(headNode, this.origin);
            var forceOfHeadNode = new Force(forceMagOfHeadNode, forceDirOfHeadNode);
            headNode.move(forceOfHeadNode);
            var forceMagOfTailNode = deltaDist - forceMagOfHeadNode;
            var forceDirOfTailNode = Calculator.angle(this.origin, tailNode);
            var forceOfTailNode = new Force(forceMagOfTailNode, forceDirOfTailNode);
            tailNode.move(forceOfTailNode);
        }
    }

    calMovingRatio(headNode, tailNode) {
        var headNodeRadiusSquare = Math.pow(headNode.radius, 2);
        var tailNodeRadiusSquare = Math.pow(tailNode.radius, 2);
        var total = headNodeRadiusSquare + tailNodeRadiusSquare;
        return tailNodeRadiusSquare / total;
    }
}