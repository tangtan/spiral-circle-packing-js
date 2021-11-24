class APP {
    constructor(ele_id) {
        this.ele_id = ele_id;
        this.border = {};
    }

    init() {
        let mySvg = document.getElementById(this.ele_id);
        this.centerX = mySvg.clientWidth/2;
        this.centerY = mySvg.clientHeight/2;
        this.drawer = new SVGDrawer(this.ele_id, this.centerX, this.centerY);
    }

    loadData(data) {
        let loader = new DataLoader(data);
        loader.convert();
        this.datasets = loader.datasets;
        this.uncertainties = loader.uncertainties;
        this.weights = loader.weights;
        console.log(this.uncertainties, this.weights);
    }

    loadBorder() {
        // boundary
        let innerRadius = 75;
        let outerRadius = 480;
        let spiralB = 1.0;

        let spiral0 = new Spiral(0, spiralB, 0);
        let spiral1 = new Spiral(0, spiralB, -120);
        let spiral2 = new Spiral(0, spiralB, -240);
        let spiral3 = new Spiral(0, spiralB, -360);

        let circle0 = new Circle(0, 0, innerRadius);
        let circle1 = new Circle(0, 0, outerRadius);
        this.border.spirals = [spiral0, spiral1, spiral2, spiral3];
        this.border.circles = [circle0, circle1];
    }

    genSingleAttributeLayout(nodes, lowerBorder, upperBorder) {
        let border = this.getSingleAttributeBorder(lowerBorder, upperBorder);
        let circlesGenerator = new CirclesGenerator(nodes, border);
        let circles = circlesGenerator.run();
        // let groups = circlesGenerator.groups;
        // for (let i=0, len=circles.length; i<len; i++) {
        //     circles[i].x = (i+1);
        //     circles[i].y = 0;
        //     circles[i].r = circles[i].radius;
        // }
        // let circlesPacker = new CirclesPacker(circles);
        // console.log(circles);
        // circles.forEach(function(d) {
        //     d.x = d.px;
        //     d.y = d.py;
        // });


        let svgCircles = this.drawer.initCircles(circles, 'country');
        let config = this.getSingleAttributeConfig(border);
        let circlesUpdator = new CirclesUpdatingLayout(config);
        circlesUpdator.loadData(circles);
        let updateTimes = 0;
        let drawer = this.drawer;
        for (let i=0; i<80; i++) {
            circlesUpdator.update();
        }
        this.drawer.updateCircles(svgCircles);



        // let updateEvent = setInterval(function() {
        //     circlesUpdator.update();
        //     drawer.updateCircles(svgCircles);
        //     updateTimes = updateTimes + 1;
        //     if (updateTimes == 100) {
        //         clearInterval(updateEvent);
        //     }
        // }, 500);
    }

    getSingleAttributeBorder(lowerBorder, upperBorder) {
        let border = {};
        border.lowerBorder = this.border.spirals[lowerBorder];
        border.upperBorder = this.border.spirals[upperBorder];
        border.innerBorder = this.border.circles[0];
        border.outerBorder = this.border.circles[1];
        return border;
    }

    // 顺时钟方向，prespiral 在 latspiral 之前，spiral 的 tau 参数是负值
    getSingleAttributeConfig(border) {
        let config = {};
        config.border = border;
        config.borderWidth = 3;
        config.padding = 2;
        config.margin = 2;
        return config;
    }

    drawBoundary() {
        let centerR = 480;
        this.drawer.strokeSpiral(this.border.spirals[0], centerR)
        this.drawer.strokeSpiral(this.border.spirals[1], centerR)
        this.drawer.strokeSpiral(this.border.spirals[2], centerR)
        // this.drawer.fillCircle(this.border.circles[0], 'white', 1.0);
        this.drawer.strokeCircle(this.border.circles[1]);
    }

    run() {
        let self = this;
        this.init();
        d3.json('/get_testdata', function(data) {
            self.loadData(data);
            // console.log(self.datasets);
            // console.log(self.uncertainties);
            self.loadBorder();
            self.drawBoundary();
            let countryNodes = self.datasets.country;
            // let countryNodes = self.datasets.hashtag;
            self.genSingleAttributeLayout(countryNodes, 1, 2);
        });
    }
}



window.onload = function() {
    // var IS_TEST = false;
    var IS_TEST = true;
    if (IS_TEST) {
        var myTEST = new TEST('mySvg');
        myTEST.run();
    } else {
        var myAPP = new APP('mySvg');
        myAPP.run();
    }
}