function Vector(x, y)
{

    if (typeof x == 'Object')
    {
        this.x = x.x;
        this.y = x.y;
    }
    else
    {
        this.x = x;
        this.y = y;
    }


}

Vector.prototype =
{

    cp: function()
    {

        return new Vector(this.x, this.y);

    },

    mul: function(factor)
    {

        this.x *= factor;
        this.y *= factor;
        return this;

    },

    mulNew: function(factor)
    {

        return new Vector(this.x * factor, this.y * factor);

    },

    add: function(vec)
    {

        this.x += vec.x;
        this.y += vec.y;
        return this;

    },

    addNew: function(vec)
    {

        return new Vector(this.x + vec.x, this.y + vec.y);

    },

    sub: function(vec)
    {

        this.x -= vec.x;
        this.y -= vec.y;
        return this;

    },

    subNew: function(vec)
    {

        return new Vector(this.x - vec.x, this.y - vec.y);

    },

    // angle in radians
    rotate: function(angle)
    {

        var x = this.x, y = this.y;
        this.x = x * Math.cos(angle) - Math.sin(angle) * y;
        this.y = x * Math.sin(angle) + Math.cos(angle) * y;
        return this;

    },

    // angle still in radians
    rotateNew: function(angle)
    {

        return this.cp().rotate(angle);

    },

    // angle in radians... again
    setAngle: function(angle)
    {

        var l = this.length();
        this.x = Math.cos(angle) * l;
        this.y = Math.sin(angle) * l;
        return this;

    },

    // RADIANS
    setAngleNew: function(angle)
    {

        return this.cp().setAngle(angle);

    },

    setLength: function(length)
    {

        var l = this.length();
        if (l)
        {
            this.mul(length / l);
        }
        else
        {
            this.x = this.y = length;
        }
        return this;

    },

    setLengthNew: function(length)
    {

        return this.cp().setLength(length);

    },

    normalize: function()
    {
        var l = this.length();
        this.x /= l;
        this.y /= l;
        return this;

    },

    normalizeNew: function()
    {

        return this.cp().normalize();

    },

    angle: function()
    {

        return Math.atan2(this.y, this.x);

    },

    collidesWith: function(rect)
    {

        return this.x > rect.x && this.y > rect.y && this.x < rect.x + rect.width && this.y < rect.y + rect.height;

    },

    length: function()
    {

        var length = Math.sqrt(this.x * this.x + this.y * this.y);
        if (length < 0.005 && length > -0.005) return 0.000001;
        return length;

    },
    lengthSquared: function()
    {

        var lengthSquared = this.x * this.x + this.y * this.y;

        if (lengthSquared < 0.005 && lengthSquared > -0.005) return 0;
        return lengthSquared;

    },


    distance: function(vec)
    {
        var deltaX = this.x - vec.x;
        var deltaY = this.y - vec.y;
        return Math.sqrt( (deltaX * deltaX) + (deltaY * deltaY) );
    },

    distanceSquared: function(vec)
    {
        var deltaX = this.x - vec.x;
        var deltaY = this.y - vec.y;
        return (deltaX * deltaX) + (deltaY * deltaY);
    },

    is: function(test)
    {


        return typeof test == 'object' && this.x == test.x && this.y == test.y;

    },

    toString: function()
    {

        return '[Vector(' + this.x + ', ' + this.y + ') angle: ' + this.angle() + ', length: ' + this.length() + ']';

    }


};

class Force {
    constructor(mag, dir) {
        this.magnitude = mag;
        this.direction = dir;
        this.x = this.getX();
        this.y = this.getY();
    }

    getX() {
        return this.magnitude * Math.cos(this.direction);
    }

    getY() {
        return this.magnitude * Math.sin(this.direction);
    }

    getDirection() {
        return Math.atan2(this.y, this.x);
    }

    getMagnitude() {
        return Math.hypot(this.x, this.y);
    }

    add(force) {
        this.x += force.x;
        this.y += force.y;
    }

    static zero() {
        return new Force(0, 0);
    }
}

class Circle {
    constructor(x, y, radius, node={}) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.node = node;
    }

    get area() {
        return Math.PI * Math.pow(this.radius, 2);
    }

    move(vector) {
        this.x += vector.x;
        this.y += vector.y;
    }

    getDirection() {
        return Math.atan2(this.y, this.x);
    }

    getMagnitude() {
        return Math.hypot(this.x, this.y);
    }
}


class Spiral {
    constructor(a, b, t, R=480) {
        // degree
        this.a = a;
        this.b = b;
        this.t = t;
        this.R = R;
    }

    getTheta(radius) {
        return radius / this.R * 360 - this.t;
    }

    getRadius(theta) {
        let _theta = theta + this.t;
        if (_theta < 0) {
            _theta += 360;
        }
        return _theta * this.R / 360;
    }

    getX(theta) {
        let _theta = theta * Math.PI / 180;
        return this.getRadius(theta) * Math.cos(_theta);
    }

    getY(theta) {
        let _theta = theta * Math.PI / 180;
        return this.getRadius(theta) * Math.sin(_theta);
    }

}