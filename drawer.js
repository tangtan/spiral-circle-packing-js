class SVGDrawer {
    constructor(ele_id, centerX=0, centerY=0) {
        this.svg = d3.select('#'+ele_id);
        this.centerX = centerX;
        this.centerY = centerY;
    }

    strokeSpiral(spiral) {
        let line = d3.line()
            .x(function(d) { return d[0]; })
            .y(function(d) { return d[1]; });

        let transform = d3.transform()
            .translate(this.centerX, this.centerY);

        let t = -spiral.t;
        let R = spiral.R;
        var tmpR = 0;
        var delta = 1;

        let paths = [];

        while (tmpR <= R) {
            let tmpX = spiral.getX(t);
            let tmpY = spiral.getY(t);
            paths.push([tmpX, tmpY]);
            t = t + delta;
            tmpR = spiral.getRadius(t);
        }

        let spiralSvg = this.svg.append('path')
            .attr('d', line(paths))
            .attr('stroke', 'blue')
            .attr('stroke-width', 1)
            .attr('fill', 'none')
            .attr('transform', transform);

        return spiralSvg;
    }

    strokeSpiral2(spiral, centerR) {
        let line = d3.line()
            .x(function(d) { return d[0]; })
            .y(function(d) { return d[1]; });

        let a = spiral.a;
        let b = spiral.b;
        let t = spiral.t;

        let scale = Math.PI / 180;
        let delta = 1;

        let angle = -a/b - t;
        let currentR = 0;

        let paths = [];

        while (currentR <= centerR) {
            let currentX = currentR * Math.cos(angle * scale);
            let currentY = currentR * Math.sin(angle * scale);
            paths.push([currentX, currentY]);
            angle = angle + delta;
            currentR = a + b * (angle + t);
        }

        let transform = d3.transform()
            .translate(this.centerX, this.centerY)
            .rotate(-t);

        // console.log(transform);

        let spiralSvg = this.svg.append('path')
            .attr('d', line(paths))
            .attr('stroke', 'blue')
            .attr('stroke-width', 1)
            .attr('fill', 'none')
            .attr('transform', transform);

        return spiralSvg;

    }

    strokeCircle(circle) {
        let transform = d3.transform()
            .translate(this.centerX, this.centerY);

        let circleSvg = this.svg.append('circle')
            .attr('cx', circle.x)
            .attr('cy', circle.y)
            .attr('r', circle.radius)
            .attr('stroke', 'blue')
            .attr('stroke-width', 1)
            .attr('fill', 'none')
            .attr('transform', transform);

        return circleSvg;
    }

    fillCircle(circle, fill='blue', opacity=0.2) {
        let transform = d3.transform()
            .translate(this.centerX, this.centerY);

        let circleSvg = this.svg.append('circle')
            .attr('cx', circle.x)
            .attr('cy', circle.y)
            .attr('r', circle.radius)
            .attr('stroke', 'blue')
            .attr('stroke-width', 1)
            .attr('fill', fill)
            .attr('opacity', opacity)
            .attr('transform', transform);

        return circleSvg;
    }

    initCircles(data, attr_name) {
        let transform = d3.transform()
            .translate(this.centerX, this.centerY);

        let circles = this.svg.selectAll('g.'+attr_name)
            .data(data);

        let circlesEnter = circles.enter()
            .append('g')
            .attr('class', attr_name)
            .attr('transform', transform);

        circlesEnter.append('circle')
            .attr('cx', function(d) { return d.x; })
            .attr('cy', function(d) { return d.y; })
            .attr('r', function(d) { return d.radius; })
            .attr('fill', 'blue')
            .attr('fill-opacity', 0.2)
            .attr('stroke', 'blue');

        circlesEnter.append('text')
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .attr('text-anchor', 'middle')
            .text(function(d, i) { return i; });

        return circlesEnter;
    }

    updateCircles(circles) {
        circles.selectAll('circle')
            .transition().duration(500)
            .attr('cx', function(d, i) { return d.x; })
            .attr('cy', function(d, i) { return d.y; })
            .attr('fill', 'red');

        circles.selectAll('text')
            .transition().duration(500)
            .attr('x', function(d, i) { return d.x; })
            .attr('y', function(d, i) { return d.y; });
    }
}