class DataLoader {
    constructor(data) {
        this.originalDataset = data;
        this.minTimestamp = 1e12;
        this.maxTimestamp = 0;
        this.totalValue = 0;
        this.totalSquareValue = 0;
        this._datasets = {};
        this._uncertainties = {};
        this._weights = {};
        this.convert();
    }

    get datasets() {
        return this._datasets;
    }

    get uncertainties() {
        return this._uncertainties;
    }

    get weights() {
        return this._weights;
    }

    convert() {
        for (let key in this.originalDataset) {
            let dataOfSingleAttribute = this.originalDataset[key];
            this.convertSingleAttribute(key, dataOfSingleAttribute.data);
            this.convertUncertainty(key, dataOfSingleAttribute.uncertainty);
            this.convertWeight(key, dataOfSingleAttribute.weight);
        }
    }

    convertSingleAttribute(key, data) {
        var convertedPoints = this.initializeConvertedPoints();
        // this.normalizePointsInSingleAttribute(data);
        for (let key in data) {
            let _point = data[key];
            var point = this.convertSinglePoint(key, _point);
            this.extendConvertedPoints(convertedPoints, point);
        }
        this._datasets[key] = convertedPoints;
    }

    initializeConvertedPoints() {
        var anchor = {'value': 0};
        return [anchor];
    }

    convertSinglePoint(key, _point) {
        let value = parseInt(_point.old);
        let estimate = Math.ceil(_point.new);
        let sTime = parseFloat(_point.sTime);
        let eTime = parseFloat(_point.eTime);
        let values = _point.values;
        let estimates = _point.estimates;
        return {'name': key, 'value': value, 'estimate': estimate, 'sTime': sTime, 'eTime': eTime, 'values': values, 'estimates': estimates};
    }

    extendConvertedPoints(points, point) {
        for (let i=0, len=points.length; i<len; i++) {
            var tmpPoint = points[i];
            if (point.value >= tmpPoint.value) {
                points.splice(i, 0, point);
                break;
            }
        }
    }

    normalizePointsInSingleAttribute(data) {
        for (let key in data) {
            let _point = data[key];
            let timestamp = _point.time;
            let value = _point.old;
            this.setMinTimestamp(timestamp);
            this.setTotalValue(value);
            this.calTotalSquareValue(value);
        }        
    }

    setMinTimestamp(time) {
        let timestamp = parseFloat(time);
        if (timestamp < this.minTimestamp) {
            this.minTimestamp = timestamp;
        }
    }

    setTotalValue(value) {
        let tmpValue = parseInt(value);
        this.totalValue += tmpValue;
    }

    calTotalSquareValue(value) {
        let tmpValue = parseInt(value);
        this.totalSquareValue += tmpValue*tmpValue;
    }

    convertUncertainty(key, score) {
        this._uncertainties[key] = score;
    }

    convertWeight(key, weights) {
        this._weights[key] = weights;
    }
}



class CirclesGenerator {
    constructor(nodes, border) {
        this.nodes = nodes;
        this.border = border;
        this.lowerBorder = border.lowerBorder;
        this.upperBorder = border.upperBorder;
        this.outerBorder = border.outerBorder;
        this.innerBorder = border.innerBorder;
        this.lowerValue = 15;
        this.upperValue = Infinity;
        this.softAreaRatio = 0.3;
        this.circles = [];
    }

    get groups() {
        return this.circleGroups;
    }

    run() {
        this.setAreaSize();
        this.setTotalValue();
        this.setRadiusForCircles();
        this.setSurpriseForCircles();
        this.setPositionForCircles();
        return this.circles;
    }

    setAreaSize() {
        let deltaDegree = Math.abs(this.upperBorder.t - this.lowerBorder.t);
        this.areaSize = this.outerBorder.area * deltaDegree / 360;
    }

    setTotalValue() {
        this.totalValue = 0;
        for (let i=0, len=this.nodes.length; i<len; i++) {
            let tmpNode = this.nodes[i];
            if (!this.isFilterNode(tmpNode)) {
                let tmpValue = this.transformValue(tmpNode.value);
                this.totalValue += tmpValue;
                // console.log(i, tmpValue);
            }
        }
    }

    transformValue(value) {
        let _value = Math.log(value);
        // let _value = Math.pow(value, 2);
        return _value;
    }

    setRadiusForCircles() {
        // ignore the last item
        for (let i=0, len=this.nodes.length-1; i < len; i++) {
            let tmpNode = this.nodes[i];
            if (!this.isFilterNode(tmpNode)) {
                let tmpCircle = this.genCircleForNode(tmpNode);
                this.extendCircles(tmpCircle);
            }
        }
    }

    isFilterNode(node) {
        if (node.value < this.lowerValue) {
            return true;
        }
        if (node.value > this.upperValue) {
            return true;
        }
        return false;
    }

    genCircleForNode(node) {
        var circle = new Circle(0,0,0);
        circle.radius = this.calRadiusForCircle(node.value);
        circle.node = node;
        return circle;
    }

    calRadiusForCircle(value) {
        let circleRatio = this.transformValue(value) / this.totalValue;
        let circleArea = circleRatio * this.areaSize * this.softAreaRatio;
        return Math.sqrt(circleArea/Math.PI);
        // return 10;
    }

    extendCircles(circle) {
        let len = this.circles.length;
        // let time = circle.node.sTime;
        let time = circle.node.eTime;
        if (len == 0) {
            this.circles.push(circle);
            return true;
        }
        for (var i=0; i<len; i++) {
            // let tmpTime = this.circles[i].node.sTime;
            let tmpTime = this.circles[i].node.eTime;
            if (time <= tmpTime) {
                this.circles.splice(i, 0, circle);
                return true;
            }
        }
        if (i == len) {
            this.circles.push(circle);
            return true;
        }
    }

    setSurpriseForCircles() {
        let surpriseGenerator = new Surprise(this.circles);
        surpriseGenerator.setSurpriseForCircles();
    }

    setPositionForCircles() {
        let positionGenerator = new LinearCirclesLayout(this.circles, this.border);
        // let positionGenerator = new PyramidCirclesLayout(this.circles, this.border);
        // let positionGenerator = new UniformCirclesLayout(this.circles, this.border);
        // let positionGenerator = new SpindleCirclesLayout(this.circles, this.border);
        positionGenerator.setPositionForCircles();
        // this.circleGroups = positionGenerator.groups;
    }
}


class Surprise{
    constructor(Circles, n=3){
        this.Circles = Circles;
        this.total = this.sum();
        this.n = n;
    }

    setSurpriseForCircles() {
        var surpriseData = {};
        var attributes = {};
        var pMs = [];
        for(var i = 0; i < this.n ; ++i)
        {
            pMs[i] = 1/this.n;
            attributes[i] = {};
        }
        for(var i in attributes) {
            attributes[i].pM = [pMs[i]];
        }
        // this.uniform.pM = [pMs[0]];
        // this.boom.pM = [pMs[1]];
        // this.bust.pM = [pMs[2]];

        var pDMs = [];
        var pMDs = [];

        var kl;
        var diffs = [];
        var sumDiffs = [];
        for(var i = 0; i < this.n; ++i)
        {
            diffs[i] = 0;
            sumDiffs[i] = 0;
        }

        //Calculate per state surprise
        for (var prop in this.Circles) {
            for(var i = 0; i < this.n; ++i) {
                diffs[i] = 0;
                sumDiffs[i] = 0;
            }
            //Estimate P(D|M) as 1 - |O - E|
            //uniform
            for(var i = 0; i < this.n; i++){
                diffs[i] = ((this.Circles[prop].node.value / this.total) - (this.Circles[prop].node.estimates[i] / this.total));
                // diffs[i] = ((this.Circles[prop][3] / this.total) - (this.Circles[prop][i] / this.total));
                pDMs[i] = 1 - Math.abs(diffs[i]);
                pMDs[i] = pMs[i]*pDMs[i];
            }
            // Surprise is the sum of KL divergance across model space
            // Each model also gets a weighted "vote" on what the sign should be
            kl = 0;
            var voteSum = 0;
            for (var j = 0; j < pMDs.length; j++) {
                kl += pMDs[j] * (Math.log(pMDs[j] / pMs[j]) / Math.log(2));
                voteSum += diffs[j] * pMs[j];
                sumDiffs[j] += Math.abs(diffs[j]);
            }
            this.Circles[prop].node.surprise = voteSum >= 0 ? Math.abs(kl) : -1 * Math.abs(kl);
            // surpriseData[prop] = voteSum >= 0 ? Math.abs(kl) : -1 * Math.abs(kl);
        }

        //Now lets globally update our model belief.

        for (var j = 0; j < pMs.length; j++) {
            pDMs[j] = 1 - 0.5 * sumDiffs[j];
            pMDs[j] = pMs[j] * pDMs[j];
            pMs[j] = pMDs[j];
        }

        //Normalize
        var sum = pMs.reduce(function (a, b) {
            return a + b;
        }, 0);
        for (var j = 0; j < pMs.length; j++) {
            pMs[j] /= sum;
        }

        for (var i = 0; i < this.n; ++i) {
            attributes[i].pM.push(pMs[i]);
        }

        return surpriseData;
    }

    sum(){
        var sum = 0;
        for(var i = 0; i < this.Circles.length; ++i){
            sum += this.Circles[i].node.value;
            // sum += this.Circles[i][3];
        }
        return sum;
    }
}



class LinearCirclesLayout {
    constructor(circles, border) {
        this.circles = circles;
        this.lowerBorder = border.lowerBorder;
        this.upperBorder = border.upperBorder;
        this.innerR = border.innerBorder.radius;
    }

    setPositionForCircles() {
        let middleSpiral = this.genMiddleSpiral();
        let startTheta = middleSpiral.getTheta(this.innerR);
        let deltaTheta = 360 - (startTheta + middleSpiral.t);
        for (let i=0, len=this.circles.length; i<len; i++) {
            let tmpTheta = startTheta + deltaTheta * (i+1) / (len+1);
            let tmpCircle = this.circles[i];
            tmpCircle.x = middleSpiral.getX(tmpTheta) + Math.random()*10;
            tmpCircle.y = middleSpiral.getY(tmpTheta) + Math.random()*10;
        }
    }

    genMiddleSpiral() {
        let a = this.lowerBorder.a;
        let b = this.lowerBorder.b;
        let t = (this.lowerBorder.t+this.upperBorder.t)/2;
        return new Spiral(a, b, t);
    }
}



class PyramidCirclesLayout {
    constructor(circles, border) {
        this.circles = circles;
        this.lowerBorder = border.lowerBorder;
        this.upperBorder = border.upperBorder;
        this.innerBorder = border.innerBorder;
        this.outerBorder = border.outerBorder;
        this.pyramid = [];
        this.levels = 0;

    }

    setPositionForCircles() {
        this.genPyramidByEqualDifference();
        for (let i=0; i<this.levels; i++) {
            this.setCirclesInOneLevel(i);
        }
    }

    genPyramidByEqualRatio() {
        let numberBase = 2;
        this.levels = parseInt(Math.log2(this.circles.length+1));
        for (let i=0; i<this.levels; i++) {
            let circlesInOneLevel = Math.pow(numberBase, i+1);
            this.pyramid.push(circlesInOneLevel);
        }
    }

    genPyramidByEqualDifference() {
        let N = this.circles.length;
        let L = 20;
        let d = 2;
        let a = (N - L*(L-1)/2*d) / L;
        for (let i=0; i<L; i++) {
            let tmpCirclesNum = Math.ceil(a+i*d);
            if (tmpCirclesNum > 0) {
                this.pyramid.push(tmpCirclesNum);
            }
        }
        this.levels = this.pyramid.length;
    }


    setCirclesInOneLevel(i) {
        let circle_id = this.genPyramidCirclesNumber(i);
        let levelRadius = this.genRadiusForOneLevel(i);
        let levelLowerTheta = this.lowerBorder.getTheta(levelRadius);
        let levelUpperTheta = this.upperBorder.getTheta(levelRadius);
        let len = this.genCircleNumForOneLevel(i);

        for (let k=0; k<len; k++) {
            let tmpCircleId = circle_id + k;
            let tmpCircle = this.circles[tmpCircleId];
            let tmpRatio = (k+1) / (len+1);
            this.setPyramidPositionForOneCircle(tmpCircle, levelLowerTheta, levelUpperTheta, levelRadius, tmpRatio);
        }
    }

    genPyramidCirclesNumber(i) {
        let circlesNum = 0;
        for (let j=0; j<i; j++) {
            circlesNum += this.pyramid[j];
        }
        return circlesNum;
    }

    genRadiusForOneLevel(i) {
        let deltaRadius = this.outerBorder.radius - this.innerBorder.radius;
        return this.innerBorder.radius + (i+1)/(this.levels+1) * deltaRadius;
    }

    genCircleNumForOneLevel(i) {
        let circlesTotalNum = this.circles.length;
        let circlesCurrentId = this.genPyramidCirclesNumber(i);
        let levelsSize = this.pyramid[i];
        let remainingNum = circlesTotalNum - circlesCurrentId;
        if (remainingNum > levelsSize) {
            return levelsSize;
        } else {
            return remainingNum;
        }
    }

    setPyramidPositionForOneCircle(circle, lowerTheta, upperTheta, levelRadius, ratio) {
        let theta = lowerTheta + (upperTheta-lowerTheta) * ratio;
        circle.x = levelRadius * Math.cos(theta);
        circle.y = levelRadius * Math.sin(theta);
    }
}

class UniformCirclesLayout {
    constructor(circles, border) {
        this.circles = circles;
        this.lowerBorder = border.lowerBorder;
        this.upperBorder = border.upperBorder;
        this.outerR = border.outerBorder.radius;
        this.innerR = border.innerBorder.radius;
        this.scanCircles();
    }

    get groups() {
        return this.circlesIndexByTime;
    }

    scanCircles() {
        let lastTime = 0;
        let circlesIndexByTime = [];
        let k = 0;
        for (let i=0, len=this.circles.length; i<len; i++) {
            let tmpCircle = this.circles[i];
            let currTime = tmpCircle.node.time;
            if (currTime == lastTime) {
                circlesIndexByTime[k].push(i);
            } else if (lastTime == 0){
                circlesIndexByTime[k] = [0];
                lastTime = currTime;
            } else {
                circlesIndexByTime[++k] = [i];
                lastTime = currTime;
            }
        }
        this.circlesIndexByTime = circlesIndexByTime;
        // console.log(this.circlesIndexByTime);
    }

    setPositionForCircles() {
        var i = 0;
        var len = this.circlesIndexByTime.length;
        for (; i<len; i++) {
            let tmpRadius = this.genRadiusForOneLevel(i);
            let tmpLowerTheta = this.genLowerThetaForOneLevel(tmpRadius);
            let tmpUpperTheta = this.genUpperThetaForOneLevel(tmpRadius);
            this.setCirclesInOneLevel(i, tmpRadius, tmpLowerTheta, tmpUpperTheta);
        }
    }

    genRadiusForOneLevel(i) {
        let len = this.circlesIndexByTime.length;
        return this.innerR + (i+1)/(len+1) * (this.outerR-this.innerR);
    }

    genLowerThetaForOneLevel(radius) {
        return this.lowerBorder.getTheta(radius);
    }

    genUpperThetaForOneLevel(radius) {
        return this.upperBorder.getTheta(radius);
    }

    setCirclesInOneLevel(i, radius, lowerTheta, upperTheta) {
        let circlesNum = this.circlesIndexByTime[i].length;
        for (let j=0; j<circlesNum; j++) {
            let tmpTheta = lowerTheta + (j+1)/(circlesNum+1)*(upperTheta-lowerTheta);
            let circleIndex = this.circlesIndexByTime[i][j];
            let circle = this.circles[circleIndex];
            circle.x = radius * Math.cos(tmpTheta);
            circle.y = radius * Math.sin(tmpTheta);
        }
    }

}

class TemporalCirclesLayout {
    constructor(circles, groups, border) {
        this.circles = circles;
        this.groups = groups;
        this.origin = origin;
        this.scale = 0.5;
        this.innerR = border.innerBorder.radius;
        this.outerR = border.outerBorder.radius;
    }

    update() {
        for (let i=0, len=this.groups.length; i<len; i++) {
            this.updateOneGroup(i);
        }
    }

    updateOneGroup(i) {
        let anchorRadius = this.genRadius(i);
        for (let j=0, len=this.groups[i].length; j<len; j++) {
            let tmpIndex = this.groups[i][j];
            let tmpCircle = this.circles[tmpIndex];
            this.updateOneCircle(tmpCircle, anchorRadius);
        }
    }

    updateOneCircle(circle, anchorRadius) {
        let dist = Calculator.distance(this.origin, circle);
        let delta = dist - anchorRadius;
        // let forceMag = this.scale * Math.abs(delta);
        let forceMag = this.scale / Math.abs(delta);
        if (delta > 0) {
            var forceDir = Calculator.angle(circle, this.origin);
        } else {
            var forceDir = Calculator.angle(this.origin, circle);
        }
        let force = new Vector(forceMag, forceDir);
        circle.move(force);
    }

    genRadius(j) {
        let groupsNum = this.groups.length;
        return this.innerR + (j+1)/(groupsNum+1) * (this.outerR-this.innerR);
    }
}