class CirclesPacker {
    constructor(config) {
        this.config = config;
        this.origin = new Vector(0, 0);
        this.scale = 180 / Math.PI;
        this.lowerBorder = config.border.lowerBorder;
        this.upperBorder = config.border.upperBorder;
        this.innerBorder = config.border.innerBorder;
        this.outerBorder = config.border.outerBorder;
        this.lowerT = Math.abs(this.lowerBorder.t);
        this.upperT = Math.abs(this.upperBorder.t);
        this.innerR = this.innerBorder.radius;
        this.outerR = this.outerBorder.radius;
        this.outsideMidline = this.genOutsideMidline();
    }

    genQuantileMidline(quantile) {
        var a = this.lowerBorder.a;
        var b = this.lowerBorder.b;
        var t = this.lowerT + (this.upperT-this.lowerT) * quantile;
        return new Spiral(a, b, -t);
    }

    genOutsideMidline() {
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

    packNodes(nodes) {
        var start = 0,
        a, b, c, i, j, k;

        // init nodes
        let self = this;
        nodes.forEach(function(d) {
            self.xpackLink(d);
        });

        if (nodes.length - start >= 1) {
            // the first node
            a = nodes[start];
            let midlineA = this.genQuantileMidline(1/3);
            let distOfNodeA = this.innerR + a.radius;
            let angleOfNodeA = midlineA.getTheta(distOfNodeA)/this.scale;
            a.x = distOfNodeA * Math.cos(angleOfNodeA);
            a.y = distOfNodeA * Math.sin(angleOfNodeA);
            // a.x = a.t;
            // a.y = 0;

            if (nodes.length - start >= 2) {
                // the second node
                b = nodes[start+1];
                let midlineB = this.genQuantileMidline(2/3);
                let distOfNodeB = this.innerR + b.radius;
                let angleOfNodeB = midlineB.getTheta(distOfNodeB)/this.scale;
                b.x = distOfNodeB * Math.cos(angleOfNodeB);
                b.y = distOfNodeB * Math.sin(angleOfNodeB);
                // b.x = a.x + a.radius + b.radius;
                // b.y = 0;

                this.xpackInsert(a, b);

                if (nodes.length - start >= 3) {
                    // the third node
                    c = nodes[start+2];
                    this.xpackPlace(a, b, c);

                    this.xpackInsert(a, c); 

                    // iterate through the rest
                    var preiter = false;
                    // var iscross = false;

                    for (i = start + 3; i < nodes.length; i++) {
                        if (!preiter) {
                            // a = this.xpackBestPlace(a, nodes[i]);
                            a = this.xpackBestPlace2(a, nodes[i]);
                            b = a._pack_next;
                        }

                        this.xpackPlace(a, b, c = nodes[i]);
                        
                        // TODO: add boundary constraint
                        // if cross the upper and lower border, update a and b
                        this.distOfCircle = Calculator.distance(this.origin, c);
                        this.angleOfCircle = Calculator.angle(this.origin, c) * this.scale;
                        if (this.isCrossLowerBorder(c) || this.isCrossUpperBorder(c)) {
                            a = b;
                            b = b._pack_next;
                            preiter = true;
                            i--;
                            // skip iter
                            continue;
                        }

                        // search for the closest intersection
                        var isect = 0, s1 = 1, s2 = 1;
                        for (j = b._pack_next; j !== b; j = j._pack_next, s1++) {
                            if (this.xpackIntersects(j, c)) {
                                isect = 1;
                                break;
                            }
                        }
                        if (isect == 1) {
                            for (k = a._pack_prev; k !== j._pack_prev; k = k._pack_prev, s2++) {
                                if (this.xpackIntersects(k, c)) {
                                    break;
                                }
                            }
                        }
                        // update front chain
                        if (isect) {
                            if (s1 < s2 || (s1 == s2 && b.radius < a.radius))
                                this.xpackSplice(a, b = j);
                            else
                                this.xpackSplice(a = k, b);
                            i--;
                            preiter = true;
                        } else {
                            this.xpackInsert(a, c);
                            b = c;
                            preiter = false;
                        }

                        // if cross the outer border, stop packing
                        if (this.isCrossOuterBorder(c)) {
                            return i;
                        }
                    }
                }
            }
        }

        return nodes.length;

    }

    xpackBestPlace(startn, node) {
        var goodnodes = [];
        for(var p = startn._pack_next; p != startn; p = p._pack_next) {
            if (p.x + p.radius < node.t - node.radius || p.x - p.radius > node.t + node.radius)
                continue;
            goodnodes.push(p);
        }
        if (goodnodes.length === 0)
            return startn;

        goodnodes.sort(function(a, b) {return Math.abs(a.y) - Math.abs(b.y);});

        return goodnodes[0];
    }

    xpackBestPlace2(startn, node) {
    	var goodnodes = [];
    	for(let p=startn._pack_next; p!=startn; p=p._pack_next) {
    		if (p.t > node.t) continue;
    		goodnodes.push(p);
    	}
    	if (goodnodes.length === 0) {
    		return startn;
    	}
    	goodnodes.sort(function(a, b) { return b.t - a.t; });
    	return goodnodes[0];
    }

    xpackInsert(a, b) {
        var c = a._pack_next;
        a._pack_next = b;
        b._pack_prev = a;
        b._pack_next = c;
        c._pack_prev = b;
    }

    xpackPlace(a, b, c) {
        var db = a.radius + c.radius,
            dx = b.x - a.x,
            dy = b.y - a.y;
        if (db && (dx || dy)) {
            var da = b.radius + c.radius,
                dc = dx * dx + dy * dy;
            da *= da;
            db *= db;
            var x = 0.5 + (db - da) / (2 * dc),
                y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);
            c.x = a.x + x * dx + y * dy;
            c.y = a.y + x * dy - y * dx;
        } else {
            c.x = a.x + db;
            c.y = a.y;
        }
    }

    xpackIntersects(a, b) {
        var dx = b.x - a.x, dy = b.y - a.y, dr = a.radius + b.radius;
        return 0.999 * dr * dr > dx * dx + dy * dy;
        // relative error within epsilon
    }

    xpackSplice(a, b) {
        a._pack_next = b;
        b._pack_prev = a;
    }

    xpackLink(node) {
        node._pack_next = node._pack_prev = node;
    }


    xpackUnlink(node) {
        delete node._pack_next;
        delete node._pack_prev;
    }

    isCrossLowerBorder(node) {
        let borderWidth = this.config.borderWidth;

        let distOfCircle = this.distOfCircle;
        let angle = this.angleOfCircle;
        let distOfBorder = this.lowerBorder.getRadius(angle);

        // false - inside the border
        // true - outside the border
        let iscross = false;
        
        if (distOfCircle+node.radius+borderWidth > distOfBorder) {
            iscross = true;
        }

        if (angle > this.lowerT && angle < this.upperT) {
            let distOfMidline = this.outsideMidline.getRadius(angle);
            if (distOfCircle > distOfMidline && distOfCircle < this.outerR) {
                iscross = false;
            }
        }
        
        return iscross;
        // return false;
    }

    isCrossUpperBorder(node) {
        let borderWidth = this.config.borderWidth;

        let distOfCircle = this.distOfCircle;
        let angle = this.angleOfCircle;
        let distOfBorder = this.upperBorder.getRadius(angle);

        let iscross = false;

        if (distOfCircle < distOfBorder+node.radius+borderWidth) {
            iscross = true;
        }

        if (angle > this.lowerT && angle < this.upperT) {
            let distOfMidline = this.outsideMidline.getRadius(angle);
            if (distOfCircle < distOfMidline) {
                iscross = false;
            }
        }

        return iscross;
        // return false;
    }

    isCrossOuterBorder(node) {
        return false;
    }

}


